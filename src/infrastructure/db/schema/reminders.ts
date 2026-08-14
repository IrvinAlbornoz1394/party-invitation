import {
  boolean,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { createdAtOnly, timestamps } from './_shared';
import { events } from './events';
import { guestGroups } from './guests';

export const reminderChannel = pgEnum('reminder_channel', ['whatsapp', 'email', 'sms']);
export const deliveryStatus = pgEnum('delivery_status', ['queued', 'sent', 'failed', 'skipped']);

/**
 * Recordatorios configurables: 7 días antes, 3 días antes, 1 día antes, el día del evento.
 * El plan Esencial trae 1 recordatorio; el límite sale de `plan_features.limit_value`.
 */
export const reminderSchedules = pgTable(
  'reminder_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull(),
    clientId: uuid('client_id').notNull(),
    /** Días antes del evento. 0 = el mismo día. */
    offsetDays: smallint('offset_days').notNull(),
    /** Hora local a la que se envía, en la zona horaria del evento. */
    sendAtLocalTime: time('send_at_local_time').notNull().default('10:00:00'),
    channel: reminderChannel('channel').notNull().default('whatsapp'),
    isEnabled: boolean('is_enabled').notNull().default(true),
    messageTemplate: text('message_template'),
    ...timestamps,
  },
  (t) => [
    foreignKey({
      columns: [t.eventId, t.clientId],
      foreignColumns: [events.id, events.clientId],
      name: 'reminder_schedules_event_fk',
    }).onDelete('cascade'),
    /** Evita configurar dos veces el mismo recordatorio por el mismo canal. */
    unique('reminder_schedules_event_offset_channel_key').on(t.eventId, t.offsetDays, t.channel),
    unique('reminder_schedules_id_client_id_key').on(t.id, t.clientId),
    index('reminder_schedules_client_id_idx').on(t.clientId),
  ],
);

/**
 * Registro de envíos.
 *
 * La única (reminder_schedule_id, guest_group_id) es la pieza importante: es lo que
 * hace el envío idempotente. Si el worker se reinicia a media tanda o alguien vuelve
 * a disparar el job, la familia no recibe el mensaje dos veces. Mandar recordatorios
 * duplicados a los invitados de un cliente es un daño difícil de reparar.
 */
export const reminderDeliveries = pgTable(
  'reminder_deliveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reminderScheduleId: uuid('reminder_schedule_id').notNull(),
    eventId: uuid('event_id').notNull(),
    clientId: uuid('client_id').notNull(),
    guestGroupId: uuid('guest_group_id').notNull(),
    status: deliveryStatus('status').notNull().default('queued'),
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    /** Identificador del proveedor, para conciliar entregas y fallos después. */
    providerMessageId: text('provider_message_id'),
    error: text('error'),
    attempts: integer('attempts').notNull().default(0),
    ...createdAtOnly,
  },
  (t) => [
    foreignKey({
      columns: [t.reminderScheduleId, t.clientId],
      foreignColumns: [reminderSchedules.id, reminderSchedules.clientId],
      name: 'reminder_deliveries_schedule_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.eventId, t.clientId],
      foreignColumns: [events.id, events.clientId],
      name: 'reminder_deliveries_event_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.guestGroupId, t.clientId],
      foreignColumns: [guestGroups.id, guestGroups.clientId],
      name: 'reminder_deliveries_guest_group_fk',
    }).onDelete('cascade'),
    unique('reminder_deliveries_schedule_guest_group_key').on(t.reminderScheduleId, t.guestGroupId),
    index('reminder_deliveries_status_scheduled_for_idx').on(t.status, t.scheduledFor),
    index('reminder_deliveries_client_id_idx').on(t.clientId),
  ],
);
