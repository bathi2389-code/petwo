import { describe, it, expect } from 'vitest';

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function isWithinGeofence(
  currentLat: number,
  currentLng: number,
  centerLat: number,
  centerLng: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistanceMeters(currentLat, currentLng, centerLat, centerLng);
  return distance <= radiusMeters;
}

describe('IoT Collar Geofencing Engine', () => {
  // Center: KBR National Park entrance, Jubilee Hills, Hyderabad (17.4239, 78.4378)
  const homeCenter = { lat: 17.4239, lng: 78.4378 };
  const safeRadiusMeters = 200; // 200 meter safe zone

  it('accurately calculates distance between GPS coordinates using Haversine formula', () => {
    // Distance to same point is 0
    expect(calculateDistanceMeters(homeCenter.lat, homeCenter.lng, homeCenter.lat, homeCenter.lng)).toBe(0);

    // Nearby spot ~50 meters away
    const nearby = { lat: 17.4242, lng: 78.4381 };
    const dist = calculateDistanceMeters(homeCenter.lat, homeCenter.lng, nearby.lat, nearby.lng);
    expect(dist).toBeGreaterThan(30);
    expect(dist).toBeLessThan(70);
  });

  it('confirms pet is inside safe zone when distance is under threshold', () => {
    // 50m away from center
    const insideLoc = { lat: 17.4242, lng: 78.4381 };
    expect(isWithinGeofence(insideLoc.lat, insideLoc.lng, homeCenter.lat, homeCenter.lng, safeRadiusMeters)).toBe(true);
  });

  it('triggers geofence breach alert when pet moves outside designated perimeter', () => {
    // 500m away in Banjara Hills Road No 2
    const breachLoc = { lat: 17.4285, lng: 78.4415 };
    expect(isWithinGeofence(breachLoc.lat, breachLoc.lng, homeCenter.lat, homeCenter.lng, safeRadiusMeters)).toBe(false);
  });
});
