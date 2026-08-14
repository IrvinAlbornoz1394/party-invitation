import { index, inet, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { createdAtOnly } from './_shared';
import { users } from './auth';
import { clients } from './clients';

/**
 * Bitácora de acciones administrativas.
 *
 * Append-only y sin FK con cascade hacia el actor: si se borra un usuario, el
 * registro de lo que hizo debe sobrevivir. Por eso `user_id` es `set null` y se
 * guarda además una copia del correo en `metadata`.
 *
 * `client_id` es nullable para poder registrar acciones de plataforma
 * (crear un cliente, publicar una plantilla nueva) que no pertenecen a
 * ningún tenant.
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id').references(() => clients.id, {
      onDelete: 'set null',
    }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    /** Verbo en punto: 'event.published', 'guest.imported', 'reminder.sent'. */
    action: text('action').notNull(),
    entityType: text('entity_type'),
    entityId: uuid('entity_id'),
    metadata: jsonb('metadata').notNull().default({}).$type<Record<string, unknown>>(),
    ip: inet('ip'),
    userAgent: text('user_agent'),
    ...createdAtOnly,
  },
  (t) => [
    index('audit_log_client_id_created_at_idx').on(t.clientId, t.createdAt),
    index('audit_log_entity_idx').on(t.entityType, t.entityId),
  ],
);
