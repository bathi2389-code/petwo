/**
 * Geospatial Utilities for PETWO Platform
 * Provides Haversine distance calculation, coordinate validation,
 * bounding box derivation, and Geohash encoding.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Validates that latitude and longitude are valid finite numbers within bounds.
 * Latitude: [-90, 90]
 * Longitude: [-180, 180]
 */
export function isValidCoordinates(lat: unknown, lng: unknown): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

/**
 * Calculate straight-line distance between two GPS coordinates in kilometers
 * using the Haversine formula.
 *
 * @param lat1 Latitude of point 1 (in degrees)
 * @param lon1 Longitude of point 1 (in degrees)
 * @param lat2 Latitude of point 2 (in degrees)
 * @param lon2 Longitude of point 2 (in degrees)
 * @returns Distance in kilometers, rounded to 1 decimal place
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  if (!isValidCoordinates(lat1, lon1) || !isValidCoordinates(lat2, lon2)) {
    throw new Error('Invalid coordinates provided for distance calculation');
  }

  // Same coordinates yield exactly 0 distance
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  const toRad = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  // Round to 1 decimal place for clean user display
  return Math.round(distance * 10) / 10;
}

/**
 * Compute bounding box coordinates for a center coordinate and search radius in kilometers.
 * Useful for index-friendly range queries in Firestore.
 */
export function getBoundingBox(
  centerLat: number,
  centerLng: number,
  radiusKm: number,
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  if (!isValidCoordinates(centerLat, centerLng)) {
    throw new Error('Invalid center coordinates for bounding box calculation');
  }

  // 1 degree latitude ~= 111 km
  const deltaLat = radiusKm / 111.0;

  // 1 degree longitude ~= 111 km * cos(latitude)
  const latRad = (centerLat * Math.PI) / 180;
  const cosLat = Math.cos(latRad);
  // Avoid division by zero at the poles
  const deltaLng = cosLat > 0.0001 ? radiusKm / (111.0 * cosLat) : radiusKm / 111.0;

  return {
    minLat: Math.max(-90, centerLat - deltaLat),
    maxLat: Math.min(90, centerLat + deltaLat),
    minLng: Math.max(-180, centerLng - deltaLng),
    maxLng: Math.min(180, centerLng + deltaLng),
  };
}

/**
 * Standard Base32 Geohash Encoder (Morton space-filling curve)
 * Encodes latitude and longitude into an alphanumeric geohash string.
 *
 * Precision table:
 * 4 chars: ~20 km x 20 km
 * 5 chars: ~4.9 km x 4.9 km
 * 6 chars: ~1.2 km x 0.6 km
 * 7 chars: ~152 m x 152 m
 */
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export function encodeGeohash(lat: number, lng: number, precision = 6): string {
  if (!isValidCoordinates(lat, lng)) {
    throw new Error('Invalid coordinates for geohash encoding');
  }

  let minLat = -90.0;
  let maxLat = 90.0;
  let minLng = -180.0;
  let maxLng = 180.0;

  let geohash = '';
  let isEven = true;
  let bit = 0;
  let ch = 0;

  while (geohash.length < precision) {
    if (isEven) {
      const mid = (minLng + maxLng) / 2;
      if (lng >= mid) {
        ch |= 1 << (4 - bit);
        minLng = mid;
      } else {
        maxLng = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) {
        ch |= 1 << (4 - bit);
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }

    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
}
