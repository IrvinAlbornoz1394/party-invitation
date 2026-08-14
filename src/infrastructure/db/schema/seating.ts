import {
  foreignKey,
  index,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { timestamps } from './_shared';
import { events } from './events';
import { guests } from './guests';

export const tableShape = pgEnum('table_shape', ['round', 'rectangular', 'other']);

/**
 * Mesas del evento (Premium).
 *
 * Se llama `event_tables` y no `tables` para no colisionar con el vocabulario de
 * Postgres en consultas y en herramientas de introspección.
 */
export const eventTables = pgTable(
  'event_tables',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull(),
    clientId: uuid('client_id').notNull(),
    name: text('name').notNull(),
    capacity: smallint('capacity').notNull(),
    shape: tableShape('shape').notNull().default('round'),
    position: smallint('position').notNull().default(0),
    notes: text('notes'),
    ...timestamps,
  },
  (t) => [
    foreignKey({
      columns: [t.eventId, t.clientId],
      foreignColumns: [events.id, events.clientId],
      name: 'event_tables_event_fk',
    }).onDelete('cascade'),
    unique('event_tables_event_name_key').on(t.eventId, t.name),
    unique('event_tables_id_client_id_key').on(t.id, t.clientId),
    index('event_tables_client_id_idx').on(t.clientId),
  ],
);

/**
 * Asignación de invitados a mesas.
 *
 * `guest_id` es único: una persona se sienta en una sola mesa. Esa restricción en la
 * base de datos es lo que hace que la vista para impresión no pueda salir con alguien
 * duplicado, sin importar qué haga la UI.
 *
 * La capacidad de la mesa NO se puede imponer con una restricción declarativa (haría
 * falta un subquery), así que se valida en la capa de aplicación dentro de la misma
 * transacción que inserta.
 */
export const tableAssignments = pgTable(
  'table_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull(),
    clientId: uuid('client_id').notNull(),
    eventTableId: uuid('event_table_id').notNull(),
    guestId: uuid('guest_id').notNull(),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [
    foreignKey({
      columns: [t.eventId, t.clientId],
      foreignColumns: [events.id, events.clientId],
      name: 'table_assignments_event_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.eventTableId, t.clientId],
      foreignColumns: [eventTables.id, eventTables.clientId],
      name: 'table_assignments_event_table_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.guestId, t.clientId],
      foreignColumns: [guests.id, guests.clientId],
      name: 'table_assignments_guest_fk',
    }).onDelete('cascade'),
    unique('table_assignments_guest_id_key').on(t.guestId),
    index('table_assignments_event_table_id_idx').on(t.eventTableId),
    index('table_assignments_client_id_idx').on(t.clientId),
  ],
);
