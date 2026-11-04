import { FastifyRequest, FastifyReply } from 'fastify';
import { getAuth } from '../api/routes/webhook.routes';
import { getDb, COLLECTIONS } from '../api/routes/webhook.routes';
import type { UserRole } from '@petwo/shared';

export interface AuthenticatedUser {
  uid: string;
  role: UserRole;
  isActive: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
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
