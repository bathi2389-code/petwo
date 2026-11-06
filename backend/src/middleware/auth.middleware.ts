import { FastifyRequest, FastifyReply } from 'fastify';
import { getAuth } from '../config/firebase';
import { getDb, COLLECTIONS } from '../config/firebase';
import type { UserRole } from '@petwo/shared';

export interface AuthenticatedUser {
  uid: string;
  role: UserRole;
  isActive: boolean;
}

export interface FirebaseIdentity {
  uid: string;
  email: string;
  emailVerified: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
    firebaseIdentity?: FirebaseIdentity;
  }
}

/** Verify a Firebase session for account-bootstrap endpoints before a Firestore role profile exists. */
export async function authenticateVerifiedFirebaseUser(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    reply.status(401).send({ success: false, error: { code: 'AUTH_001', message: 'Sign in to continue.' } });
    return;
  }
  try {
    const decoded = await getAuth().verifyIdToken(authHeader.slice(7));
    if (!decoded.email || decoded.email_verified !== true) {
      reply.status(403).send({ success: false, error: { code: 'AUTH_EMAIL_UNVERIFIED', message: 'Verify your email address before continuing.' } });
      return;
    }
    request.firebaseIdentity = { uid: decoded.uid, email: decoded.email.toLowerCase(), emailVerified: true };
  } catch {
    reply.status(401).send({ success: false, error: { code: 'AUTH_001', message: 'Your session is invalid or expired. Sign in again.' } });
  }
}

/**
 * Extracts and verifies the Firebase ID token from Authorization header.
 * Attaches user info to request if valid.
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({
      success: false,
      error: { code: 'AUTH_001', message: 'Missing or invalid authorization header.' },
    });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = await getAuth().verifyIdToken(token);
    const db = getDb();

    // Fetch user record from Firestore to get role and active status
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(decoded.uid).get();

    if (!userDoc.exists) {
      return reply.status(401).send({
        success: false,
        error: { code: 'AUTH_001', message: 'User not found.' },
      });
    }

    const userData = userDoc.data()!;

    // Admin accounts retain their existing access policy. Customer/provider
    // API access requires Firebase's trusted email_verified token claim.
    if ((userData.role === 'customer' || userData.role === 'provider') && decoded.email_verified !== true) {
      return reply.status(403).send({
        success: false,
        error: { code: 'AUTH_EMAIL_UNVERIFIED', message: 'Verify your email address before accessing PETWO.' },
      });
    }

    if (!userData.isActive) {
      return reply.status(401).send({
        success: false,
        error: { code: 'AUTH_004', message: 'Account is deactivated.' },
      });
    }

    request.user = {
      uid: decoded.uid,
      role: userData.role as UserRole,
      isActive: userData.isActive,
    };
  } catch (error) {
    const err = error as Error;
    if (err.message.includes('expired')) {
      return reply.status(401).send({
        success: false,
        error: { code: 'AUTH_002', message: 'Token has expired.' },
      });
    }
    return reply.status(401).send({
      success: false,
      error: { code: 'AUTH_001', message: 'Invalid token.' },
    });
  }
}

/**
 * Role-based authorization factory.
 * Returns a preHandler function that checks if user has one of the allowed roles.
 */
export function authorize(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: 'AUTH_001', message: 'Authentication required.' },
      });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'AUTH_003',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}.`,
        },
      });
    }
  };
}

/** Convenience role check helpers */
export const isCustomer = authorize('customer');
export const isProvider = authorize('provider');
export const isAdmin = authorize('admin', 'super_admin');
export const isProviderOrAdmin = authorize('provider', 'admin', 'super_admin');
export const isCustomerOrAdmin = authorize('customer', 'admin', 'super_admin');
export const isAnyAuthenticatedUser = authorize('customer', 'provider', 'admin', 'super_admin');
