import {
  foreignKey,
  index,
  inet,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { timestamps } from './_shared';
import { users } from './auth';
import { events } from './events';

export const moderationStatus = pgEnum('moderation_status', ['pending', 'approved', 'rejected']);

/**
 * Libro de firmas (Fase 2).
 *
 * Cualquiera con el enlace puede escribir, así que el estado por defecto es
 * `pending` y nada se muestra en la invitación hasta que el admin lo aprueba.
 * Un libro de firmas público sin moderación es una invitación a que alguien
 * arruine el evento de un cliente con contenido ofensivo.
 */
export const guestbookEntries = pgTable(
  'guestbook_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull(),
    clientId: uuid('client_id').notNull(),
    authorName: text('author_name').notNull(),
    message: text('message').notNull(),
    status: moderationStatus('status').notNull().default('pending'),
    submittedIp: inet('submitted_ip'),
    submittedUserAgent: text('submitted_user_agent'),
    moderatedAt: timestamp('moderated_at', { withTimezone: true }),
    moderatedBy: uuid('moderated_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [
    foreignKey({
      columns: [t.eventId, t.clientId],
      foreignColumns: [events.id, events.clientId],
      name: 'guestbook_entries_event_fk',
    }).onDelete('cascade'),
    index('guestbook_entries_event_id_status_idx').on(t.eventId, t.status),
    index('guestbook_entries_client_id_idx').on(t.clientId),
  ],
);
