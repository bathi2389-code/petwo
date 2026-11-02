import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getDb, COLLECTIONS } from '../../config/firebase';
import { authenticate, isCustomer } from '../../middleware/auth.middleware';
import { nanoid } from 'nanoid';
import type { Pet } from '@petco/shared';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const PairDeviceSchema = z.object({
  petId: z.string().min(1),
  deviceSerial: z.string().min(5).max(50),
  deviceModel: z.enum(['PETCO_SMART_COLLAR_GEN1', 'PETCO_SMART_COLLAR_PRO', 'GENERIC_GPS']),
  firmwareVersion: z.string().default('v2.1.0'),
});

const IngestTelemetrySchema = z.object({
  deviceSerial: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speedKmph: z.number().min(0).default(0),
  batteryPercent: z.number().min(0).max(100),
  heartRateBpm: z.number().min(30).max(300).optional(),
  temperatureC: z.number().min(30).max(45).optional(),
  activityLevel: z.enum(['resting', 'walking', 'running', 'scratching']).default('resting'),
  dailySteps: z.number().int().min(0).default(0),
});

const SetGeofenceSchema = z.object({
  petId: z.string().min(1),
  centerLat: z.number(),
  centerLng: z.number(),
  radiusMeters: z.number().min(20).max(5000), // e.g. 100 meters around house
  safeZoneName: z.string().min(2).max(100),
});

// ─── Route Plugin ─────────────────────────────────────────────────────────────

export default async function iotTrackerRoutes(app: FastifyInstance): Promise<void> {

  /**
   * POST /iot/devices/pair — Register and pair IoT Smart Collar
   */
  app.post('/devices/pair', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['IoT Smart Collar'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = PairDeviceSchema.parse(request.body);
    const db = getDb();

    // Verify pet ownership
    const petDoc = await db.collection(COLLECTIONS.PETS).doc(body.petId).get();
    if (!petDoc.exists || petDoc.data()?.ownerId !== request.user!.uid) {
      return reply.status(403).send({ success: false, error: { code: 'AUTH_003', message: 'Unauthorized pet access.' } });
    }

    const deviceId = `IOT-${nanoid(8).toUpperCase()}`;
    const now = new Date().toISOString();

    const deviceRecord = {
      id: deviceId,
      ...body,
      ownerId: request.user!.uid,
      status: 'paired',
      lastHeartbeat: now,
      createdAt: now,
    };

    await db.collection('iotDevices').doc(body.deviceSerial).set(deviceRecord);
    await petDoc.ref.update({
      iotDeviceSerial: body.deviceSerial,
      updatedAt: now,
    });

    return reply.status(201).send({
      success: true,
      data: deviceRecord,
      message: 'Pet collar paired successfully.',
    });
  });

  /**
   * POST /iot/telemetry/ingest — Ingest device stream (GPS + Accelerometer Vitals)
   */
  app.post('/telemetry/ingest', {
    schema: { tags: ['IoT Smart Collar'] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = IngestTelemetrySchema.parse(request.body);
    const db = getDb();
    const now = new Date().toISOString();

    const deviceDoc = await db.collection('iotDevices').doc(body.deviceSerial).get();
    if (!deviceDoc.exists) {
      return reply.status(404).send({ success: false, error: { code: 'RES_001', message: 'Device not recognized' } });
    }

    const deviceData = deviceDoc.data()!;
    const petId = deviceData.petId;

    const telemetryRecord = {
      id: nanoid(),
      petId,
      ...body,
      recordedAt: now,
    };

    // Store latest live state cache
    await db.collection('iotLiveState').doc(petId).set(telemetryRecord);

    // Also update device heartbeat
    await deviceDoc.ref.update({
      lastHeartbeat: now,
      batteryPercent: body.batteryPercent,
    });

    return reply.status(200).send({ success: true, recorded: true });
  });

  /**
   * GET /iot/telemetry/:petId/live — Get real-time pet location and vital signs
   */
  app.get('/telemetry/:petId/live', {
    preHandler: [authenticate],
    schema: { tags: ['IoT Smart Collar'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const { petId } = request.params;
    const db = getDb();

    const snap = await db.collection('iotLiveState').doc(petId).get();

    if (!snap.exists) {
      // Return simulated live telemetry if device recently paired
      return reply.send({
        success: true,
        data: {
          petId,
          lat: 17.4239,
          lng: 78.4378, // Near KBR National Park, Banjara Hills
          speedKmph: 4.2,
          batteryPercent: 88,
          heartRateBpm: 92,
          temperatureC: 38.6, // Normal canine body temp is ~38.3–39.2°C
          activityLevel: 'walking',
          dailySteps: 4820,
          isInsideGeofence: true,
          recordedAt: new Date().toISOString(),
          mode: 'simulated_live_feed',
        },
      });
    }

    return reply.send({ success: true, data: snap.data() });
  });

  /**
   * POST /iot/geofence — Setup safe boundary zone
   */
  app.post('/geofence', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['IoT Smart Collar'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = SetGeofenceSchema.parse(request.body);
    const db = getDb();

    const geofenceId = `GF-${nanoid(6).toUpperCase()}`;
    const geofenceData = {
      id: geofenceId,
      ...body,
      ownerId: request.user!.uid,
      isActive: true,
      updatedAt: new Date().toISOString(),
    };

    await db.collection('petGeofences').doc(body.petId).set(geofenceData);

    return reply.send({
      success: true,
      data: geofenceData,
      message: `Geofence "${body.safeZoneName}" established with ${body.radiusMeters}m radius.`,
    });
  });

  /**
   * POST /iot/simulate/:petId — Trigger realistic live pet movement in Hyderabad
   */
  app.post('/simulate/:petId', {
    preHandler: [authenticate, isCustomer],
    schema: { tags: ['IoT Smart Collar'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const { petId } = request.params;
    const db = getDb();

    // Baseline coordinates around KBR Park / Jubilee Hills
    const baseLat = 17.4239;
    const baseLng = 78.4378;
    const jitterLat = (Math.random() - 0.5) * 0.005;
    const jitterLng = (Math.random() - 0.5) * 0.005;

    const simulation = {
      petId,
      deviceSerial: 'PETCO-SMART-DEMO-01',
      lat: baseLat + jitterLat,
      lng: baseLng + jitterLng,
      speedKmph: Number((Math.random() * 8 + 2).toFixed(1)),
      batteryPercent: 94,
      heartRateBpm: Math.floor(85 + Math.random() * 25),
      temperatureC: 38.5,
      activityLevel: 'walking',
      dailySteps: 5240,
      isInsideGeofence: true,
      recordedAt: new Date().toISOString(),
      locationName: 'KBR Park Perimeter, Jubilee Hills, Hyderabad',
    };

    await db.collection('iotLiveState').doc(petId).set(simulation);

    return reply.send({
      success: true,
      data: simulation,
      message: 'Simulated pet GPS and vitals telemetry emitted.',
    });
  });
}
