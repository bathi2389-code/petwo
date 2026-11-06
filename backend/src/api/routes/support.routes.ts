import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getDb, COLLECTIONS } from '../../config/firebase';
import { authenticate, isAdmin } from '../../middleware/auth.middleware';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import type { SupportTicket, TicketMessage, TicketStatus, TicketPriority } from '@petwo/shared';
import { TICKET_NUMBER_PREFIX } from '@petwo/shared';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CreateTicketSchema = z.object({
  category: z.enum([
    'booking_issue', 'payment_issue', 'refund_request',
    'provider_complaint', 'account_issue', 'technical_issue', 'other',
  ]),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  subject: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  bookingId: z.string().optional(),
  paymentId: z.string().optional(),
});

const AddMessageSchema = z.object({
  body: z.string().min(1).max(5000),
  attachments: z.array(z.string().url()).max(5).optional(),
});

const UpdateTicketStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'waiting_user', 'resolved', 'closed']),
  note: z.string().max(500).optional(),
});

const AssignTicketSchema = z.object({
  adminId: z.string().min(1),
});

const AdminTicketQuerySchema = z.object({
  status: z.enum(['open', 'in_progress', 'waiting_user', 'resolved', 'closed']).optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedAdminId: z.string().optional(),
  userId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateTicketNumber(): string {
  const date = dayjs().format('YYYYMMDD');
  const suffix = nanoid(6).toUpperCase();
  return `${TICKET_NUMBER_PREFIX}-${date}-${suffix}`;
}

// ─── Route Plugin ─────────────────────────────────────────────────────────────

export default async function supportRoutes(app: FastifyInstance): Promise<void> {

  /**
   * POST /support/tickets — Create a new support ticket (any authenticated user)
   */
  app.post('/tickets', {
    preHandler: [authenticate],
    schema: { tags: ['Support'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = CreateTicketSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const data = parsed.data;
    const db = getDb();
    const user = request.user!;
    const id = nanoid();
    const now = new Date().toISOString();

    // Initial message from the user as part of the ticket thread
    const initialMessage: TicketMessage = {
      id: nanoid(),
      authorId: user.uid,
      authorRole: user.role,
      body: data.description,
      createdAt: now,
    };

    const ticket: SupportTicket = {
      id,
      ticketNumber: generateTicketNumber(),
      userId: user.uid,
      userRole: user.role,
      category: data.category,
      priority: data.priority,
      status: 'open',
      subject: data.subject,
      description: data.description,
      bookingId: data.bookingId,
      paymentId: data.paymentId,
      messages: [initialMessage],
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(COLLECTIONS.SUPPORT_TICKETS).doc(id).set(ticket);

    return reply.status(201).send({ success: true, data: ticket });
  });

  /**
   * GET /support/tickets/me — Get the authenticated user's own tickets
   */
  app.get('/tickets/me', {
    preHandler: [authenticate],
    schema: { tags: ['Support'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { status, page = '1', limit = '20' } = request.query as Record<string, string>;
    const db = getDb();
    const userId = request.user!.uid;

    let query = db.collection(COLLECTIONS.SUPPORT_TICKETS)
      .where('userId', '==', userId) as FirebaseFirestore.Query;

    if (status) {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('createdAt', 'desc');

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;

    const snapshot = await query.offset(offset).limit(limitNum).get();
    const tickets = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    return reply.send({
      success: true,
      data: tickets,
      meta: { page: pageNum, limit: limitNum, hasMore: tickets.length === limitNum },
    });
  });

  /**
   * GET /support/tickets/:id — Get a single ticket (owner or admin)
   */
  app.get('/tickets/:id', {
    preHandler: [authenticate],
    schema: { tags: ['Support'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const db = getDb();
    const doc = await db.collection(COLLECTIONS.SUPPORT_TICKETS).doc(request.params.id).get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Ticket not found.' },
      });
    }

    const ticket = doc.data() as SupportTicket;
    const user = request.user!;

    // Access control: only ticket owner or admin can view
    if (ticket.userId !== user.uid && !['admin', 'super_admin'].includes(user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: 'AUTH_003', message: 'Access denied.' },
      });
    }

    return reply.send({ success: true, data: { ...ticket, id: doc.id } });
  });

  /**
   * POST /support/tickets/:id/messages — Add a message to a ticket thread (owner or admin)
   */
  app.post('/tickets/:id/messages', {
    preHandler: [authenticate],
    schema: { tags: ['Support'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const parsed = AddMessageSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const db = getDb();
    const ticketRef = db.collection(COLLECTIONS.SUPPORT_TICKETS).doc(request.params.id);
    const doc = await ticketRef.get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Ticket not found.' },
      });
    }

    const ticket = doc.data() as SupportTicket;
    const user = request.user!;

    // Access control: only ticket owner or admin can add messages
    if (ticket.userId !== user.uid && !['admin', 'super_admin'].includes(user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: 'AUTH_003', message: 'Access denied.' },
      });
    }

    // Cannot reply to a closed ticket
    if (ticket.status === 'closed') {
      return reply.status(400).send({
        success: false,
        error: { code: 'RES_003', message: 'Cannot add messages to a closed ticket.' },
      });
    }

    const now = new Date().toISOString();
    const message: TicketMessage = {
      id: nanoid(),
      authorId: user.uid,
      authorRole: user.role,
      body: parsed.data.body,
      attachments: parsed.data.attachments,
      createdAt: now,
    };

    const { FieldValue } = await import('firebase-admin/firestore');

    // When a user replies, flip status back to open so admin gets notified
    const newStatus: TicketStatus = user.role === 'customer' || user.role === 'provider'
      ? 'open'
      : 'waiting_user';

    await ticketRef.update({
      messages: FieldValue.arrayUnion(message),
      status: newStatus,
      updatedAt: now,
    });

    return reply.status(201).send({ success: true, data: message });
  });

  // ─── Admin-only routes ────────────────────────────────────────────────────

  /**
   * GET /support/tickets — Admin: list all tickets with filters
   */
  app.get('/tickets', {
    preHandler: [authenticate, isAdmin],
    schema: { tags: ['Support', 'Admin'], security: [{ bearerAuth: [] }] },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = AdminTicketQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const { status, category, priority, assignedAdminId, userId, page, limit } = parsed.data;
    const db = getDb();

    let query = db.collection(COLLECTIONS.SUPPORT_TICKETS) as FirebaseFirestore.Query;

    if (status) {
      query = query.where('status', '==', status);
    }
    if (category) {
      query = query.where('category', '==', category);
    }
    if (priority) {
      query = query.where('priority', '==', priority);
    }
    if (assignedAdminId) {
      query = query.where('assignedAdminId', '==', assignedAdminId);
    }
    if (userId) {
      query = query.where('userId', '==', userId);
    }

    query = query.orderBy('createdAt', 'desc');

    const offset = (page - 1) * limit;
    const snapshot = await query.offset(offset).limit(limit).get();
    const tickets = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

    return reply.send({
      success: true,
      data: tickets,
      meta: { page, limit, hasMore: tickets.length === limit },
    });
  });

  /**
   * PUT /support/tickets/:id/status — Admin: update ticket status
   */
  app.put('/tickets/:id/status', {
    preHandler: [authenticate, isAdmin],
    schema: { tags: ['Support', 'Admin'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const parsed = UpdateTicketStatusSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const db = getDb();
    const ticketRef = db.collection(COLLECTIONS.SUPPORT_TICKETS).doc(request.params.id);
    const doc = await ticketRef.get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Ticket not found.' },
      });
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {
      status: parsed.data.status,
      updatedAt: now,
    };

    if (parsed.data.status === 'resolved') {
      updates.resolvedAt = now;
    }
    if (parsed.data.status === 'closed') {
      updates.closedAt = now;
    }

    // Optionally add admin note as a system message
    if (parsed.data.note) {
      const { FieldValue } = await import('firebase-admin/firestore');
      const sysMessage: TicketMessage = {
        id: nanoid(),
        authorId: request.user!.uid,
        authorRole: request.user!.role,
        body: `[Status changed to ${parsed.data.status}] ${parsed.data.note}`,
        createdAt: now,
      };
      updates.messages = FieldValue.arrayUnion(sysMessage);
    }

    await ticketRef.update(updates);

    return reply.send({ success: true, data: { message: `Ticket status updated to: ${parsed.data.status}` } });
  });

  /**
   * PUT /support/tickets/:id/assign — Admin: assign ticket to an admin
   */
  app.put('/tickets/:id/assign', {
    preHandler: [authenticate, isAdmin],
    schema: { tags: ['Support', 'Admin'], security: [{ bearerAuth: [] }] },
  }, async (request: any, reply: FastifyReply) => {
    const parsed = AssignTicketSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(422).send({
        success: false,
        error: { code: 'VAL_001', message: 'Validation failed', details: parsed.error.format() },
      });
    }

    const db = getDb();
    const ticketRef = db.collection(COLLECTIONS.SUPPORT_TICKETS).doc(request.params.id);
    const doc = await ticketRef.get();

    if (!doc.exists) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RES_001', message: 'Ticket not found.' },
      });
    }

    const now = new Date().toISOString();
    await ticketRef.update({
      assignedAdminId: parsed.data.adminId,
      status: 'in_progress',
      updatedAt: now,
    });

    return reply.send({ success: true, data: { message: 'Ticket assigned successfully.' } });
  });
}
