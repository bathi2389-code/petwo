import { FastifyRequest, FastifyReply } from 'fastify';
import { getDb, COLLECTIONS } from '../config/firebase';
import type { AuditLog, UserRole } from '@petco/shared';
import { nanoid } from 'nanoid';

/**
 * Records an audit log entry for sensitive admin actions.
 */
export async function createAuditLog(params: {
  actorId: string;
  actorRole: UserRole;
  action: string;
  resourceType: string;
  resourceId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  const db = getDb();
  const id = nanoid();

  const log: AuditLog = {
    id,
    actorId: params.actorId,
    actorRole: params.actorRole,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    before: params.before,
    after: params.after,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    createdAt: new Date().toISOString(),
  };

  await db.collection(COLLECTIONS.AUDIT_LOGS).doc(id).set(log);
}

/**
 * Middleware factory for automatic audit logging of destructive operations.
 */
export function auditLog(action: string, resourceType: string) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.user) return;

    // Non-blocking — fire and forget audit log
    createAuditLog({
      actorId: request.user.uid,
      actorRole: request.user.role,
      action,
      resourceType,
      resourceId: (request.params as Record<string, string>).id ?? 'unknown',
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    }).catch(err => {
      // Audit log failure should never break the request
      console.error('Audit log failed:', err);
    });
  };
}
