/**
 * Shared Firebase Admin exports used by provider routes.
 *
 * Firebase Admin is initialized once by server.ts through initializeFirebase()
 * in webhook.routes.ts. Re-exporting the getter keeps provider registration
 * on that same initialized Admin app instead of creating a second instance.
 */
export { getAuth } from '../api/routes/webhook.routes';
