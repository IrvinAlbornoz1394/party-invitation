import { foreignKey, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { clients } from './clients';
import { events } from './events';

/**
 * Los enlaces para que el cliente llene su información, uno vigente por evento.
 *
 * Es una credencial: abrirlo y pulsar «Entrar» abre una sesión de ese evento sin pedir código
 * (`app.redeem_content_link`). Por eso se guarda solo el HMAC del token y vence a los cinco días.
 * El token se deriva del `id` con AUTH_SECRET (`contentLinkToken`), lo que deja al admin volver a
 * copiar el mismo enlace sin guardar nada que sirva para entrar.
 *
 * Creado por `sql/increments/2026-11-18_enlace_del_cliente.sql`. Va **sellada** como las sesiones
 * (`AUTH_PLANE_TABLES`): la aplicación no tiene permisos sobre ella y la usa por
 * `app.active_content_link`, `app.issue_content_link` y `app.redeem_content_link`. Conserva RLS de
 * alcance evento como segunda defensa.
 */
export const contentLinks = pgTable(
  'content_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id').notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    /** La primera vez que se canjeó. */
    openedAt: timestamp('opened_at', { withTimezone: true }),
    /** Se sella al generar uno nuevo para el mismo evento: solo vale el último. */
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (t) => [
    foreignKey({
      name: 'content_links_event_client_fkey',
      columns: [t.eventId, t.clientId],
      foreignColumns: [events.id, events.clientId],
    }).onDelete('cascade'),
    index('content_links_event_id_idx').on(t.eventId),
  ],
);
