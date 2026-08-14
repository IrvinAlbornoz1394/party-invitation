import {
  foreignKey,
  index,
  inet,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { createdAtOnly, timestamps } from './_shared';
import { events } from './events';

export const guestKind = pgEnum('guest_kind', ['adult', 'child']);
export const rsvpStatus = pgEnum('rsvp_status', ['pending', 'confirmed', 'declined']);
export const rsvpChannel = pgEnum('rsvp_channel', ['web', 'whatsapp', 'panel']);

/**
 * Grupo de invitados = una familia, que es como se invita en la práctica y como lo
 * pide el plan Premium ("Invitados por familia").
 *
 * `invite_code` es el que va en el enlace personalizado (/i/<slug>?c=<code>) y por lo
 * tanto es una credencial: quien lo tiene puede confirmar por esa familia. Debe
 * generarse con un CSPRNG y no ser secuencial ni derivable del nombre.
 */
export const guestGroups = pgTable(
  'guest_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull(),
    clientId: uuid('client_id').notNull(),
    name: text('name').notNull(),
    inviteCode: text('invite_code').notNull(),
    /** Cupo asignado. El RSVP no puede confirmar más personas de las invitadas. */
    maxAdults: smallint('max_adults').notNull().default(0),
    maxChildren: smallint('max_children').notNull().default(0),
    phone: text('phone'),
    notes: text('notes'),
    ...timestamps,
  },
  (t) => [
    foreignKey({
      columns: [t.eventId, t.clientId],
      foreignColumns: [events.id, events.clientId],
      name: 'guest_groups_event_fk',
    }).onDelete('cascade'),
    /** El código solo tiene que ser único dentro del evento, no globalmente. */
    unique('guest_groups_event_invite_code_key').on(t.eventId, t.inviteCode),
    unique('guest_groups_id_client_id_key').on(t.id, t.clientId),
    index('guest_groups_event_id_idx').on(t.eventId),
    index('guest_groups_client_id_idx').on(t.clientId),
  ],
);

/**
 * Invitado individual. Se separa de la familia porque el panel necesita contar
 * adultos y niños por separado y porque las mesas se asignan por persona.
 *
 * `rsvp_status` es el estado ACTUAL. El historial de cómo se llegó a él vive en
 * `rsvp_responses`.
 */
export const guests = pgTable(
  'guests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull(),
    clientId: uuid('client_id').notNull(),
    guestGroupId: uuid('guest_group_id').notNull(),
    fullName: text('full_name').notNull(),
    kind: guestKind('kind').notNull().default('adult'),
    status: rsvpStatus('status').notNull().default('pending'),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    foreignKey({
      columns: [t.eventId, t.clientId],
      foreignColumns: [events.id, events.clientId],
      name: 'guests_event_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.guestGroupId, t.clientId],
      foreignColumns: [guestGroups.id, guestGroups.clientId],
      name: 'guests_guest_group_fk',
    }).onDelete('cascade'),
    unique('guests_id_client_id_key').on(t.id, t.clientId),
    index('guests_event_id_status_idx').on(t.eventId, t.status),
    index('guests_guest_group_id_idx').on(t.guestGroupId),
    index('guests_client_id_idx').on(t.clientId),
  ],
);

/**
 * Historial de confirmaciones. Append-only: una familia puede confirmar, cambiar de
 * opinión y volver a confirmar, y queremos poder explicar por qué el número de
 * asistentes cambió. También es la fuente de "Últimas confirmaciones" del panel.
 *
 * Se registran IP y user-agent porque este endpoint es público y sin autenticación
 * fuerte; son los datos mínimos para investigar un abuso.
 */
export const rsvpResponses = pgTable(
  'rsvp_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull(),
    clientId: uuid('client_id').notNull(),
    guestGroupId: uuid('guest_group_id').notNull(),
    status: rsvpStatus('status').notNull(),
    adultsCount: smallint('adults_count').notNull().default(0),
    childrenCount: smallint('children_count').notNull().default(0),
    message: text('message'),
    channel: rsvpChannel('channel').notNull().default('web'),
    submittedIp: inet('submitted_ip'),
    submittedUserAgent: text('submitted_user_agent'),
    ...createdAtOnly,
  },
  (t) => [
    foreignKey({
      columns: [t.eventId, t.clientId],
      foreignColumns: [events.id, events.clientId],
      name: 'rsvp_responses_event_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.guestGroupId, t.clientId],
      foreignColumns: [guestGroups.id, guestGroups.clientId],
      name: 'rsvp_responses_guest_group_fk',
    }).onDelete('cascade'),
    /** Índice del widget "Últimas confirmaciones". */
    index('rsvp_responses_event_id_created_at_idx').on(t.eventId, t.createdAt),
    index('rsvp_responses_client_id_idx').on(t.clientId),
  ],
);
