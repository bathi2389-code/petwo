import * as admin from 'firebase-admin';
import { createPrivateKey } from 'crypto';
import { env } from './env';

let _db: admin.firestore.Firestore;
let _storage: admin.storage.Storage;
let _auth: admin.auth.Auth;
let _messaging: admin.messaging.Messaging;

export function initializeFirebase(): void {
  let app = admin.apps.find((candidate) => candidate?.name === '[DEFAULT]');
  if (!app) {
    const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    try {
      createPrivateKey(privateKey);
    } catch {
      throw new Error('FIREBASE_PRIVATE_KEY is not a valid PEM private key. Check the Firebase service account configuration.');
    }

    const serviceAccount: admin.ServiceAccount = {
      projectId: env.FIREBASE_PROJECT_ID,
      privateKey,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
    };

    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: env.FIREBASE_STORAGE_BUCKET,
    });
    _db = admin.firestore(app);
    _db.settings({ ignoreUndefinedProperties: true });
  } else {
    _db = admin.firestore(app);
  }

  _storage = admin.storage(app);
  _auth = admin.auth(app);
  _messaging = admin.messaging(app);
}

export const getDb = (): admin.firestore.Firestore => {
  if (!_db) throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  return _db;
};

export const getStorage = (): admin.storage.Storage => {
  if (!_storage) throw new Error('Firebase not initialized.');
  return _storage;
};

export const getAuth = (): admin.auth.Auth => {
  if (!_auth) throw new Error('Firebase not initialized.');
  return _auth;
};

export const getMessaging = (): admin.messaging.Messaging => {
  if (!_messaging) throw new Error('Firebase not initialized.');
  return _messaging;
};

// ─── Collection References ───────────────────────────────────────────────────

export const COLLECTIONS = {
  USERS: 'users',
  CUSTOMERS: 'customers',
  PETS: 'pets',
  VACCINATION_RECORDS: 'vaccinationRecords',
  MEDICAL_RECORDS: 'medicalRecords',
  PROVIDERS: 'providers',
  PROVIDER_LOCATIONS: 'providerLocations',
  STAFF: 'staff',
  SERVICES: 'services',
  SERVICE_CATEGORIES: 'serviceCategories',
  BOOKINGS: 'bookings',
  PAYMENTS: 'payments',
  REFUNDS: 'refunds',
  SETTLEMENTS: 'settlements',
  COUPONS: 'coupons',
  REVIEWS: 'reviews',
  NOTIFICATIONS: 'notifications',
  SUPPORT_TICKETS: 'supportTickets',
  SUBSCRIPTION_PLANS: 'subscriptionPlans',
  AUDIT_LOGS: 'auditLogs',
  OTP_CACHE: 'otpCache',
  SYSTEM_CONFIG: 'systemConfig',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
