import { sql } from 'drizzle-orm';
import { date, index, inet, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createdAtOnly, timestamps } from './_shared';
import { users } from './auth';
import { clients } from './clients';

/**
 * En qué punto está la conversación con un prospecto.
 *
 * Son los estados que alguien **marca**, y son los mínimos a propósito. «Dejó de responder» no
 * está aquí y no es un olvido: se calcula de `next_follow_up_at` vencido o del último contacto de
 * la bitácora. Todo estado que dependa de que alguien se acuerde de actualizarlo acaba mintiendo,
 * y un panel que miente es peor que uno vacío.
 */
export const prospectStatus = pgEnum('prospect_status', [
  'new',
  'contacted',
  'quoted',
  'won',
  'lost',
]);

/** Por dónde se habló con el prospecto. Es una bitácora manual: no lo escribe ningún integrador. */
export const touchChannel = pgEnum('touch_channel', ['whatsapp', 'call', 'email', 'meeting', 'other']);

/**
 * Una solicitud de información del formulario público.
 *
 * ## No es un cliente a medias
 *
 * Un prospecto es un **hecho**: alguien llenó un formulario un día y pidió información. Un cliente
 * es un **tenant**, con identidad, membresías, eventos, RLS y facturación. Meterlos en la misma
 * tabla significaría crear tenants para gente que nunca compró, y esas filas contaminarían
 * `users`, las políticas de RLS y todas las cifras del resumen.
 *
 * Al contratar, las dos entidades se **vinculan** por `client_id`; no se convierte una en la otra.
 *
 * ## La solicitud es inmutable; el seguimiento va encima
 *
 * De la línea `message` hacia arriba, nada se edita nunca: es la evidencia de lo que esa persona
 * pidió. De `status` hacia abajo es la capa que cambia todos los días.
 *
 * La separación no es estética. Poder editar lo que alguien escribió convierte la evidencia en una
 * nota, y a los dos meses nadie sabe si «quería Premium» lo dijo el prospecto o lo dedujo quien
 * atendió.
 *
 * ## No es una tabla de tenant
 *
 * No cuelga de ningún `client_id` al nacer, así que no entra en el juego de RLS ni en
 * `withTenant()`. Su `client_id` es el **resultado** de la conversión, no su alcance. Y como es la
 * única tabla del sistema con escritura anónima, el rol de la aplicación no tiene ningún permiso
 * sobre ella: se escribe por `app.submit_prospect()` y se lee por
 * `app.list_prospects_for_platform()`, las dos `SECURITY DEFINER`.
 *
 * Nadie debe poder leer los teléfonos de los prospectos desde una consulta del panel de un
 * cliente, y sin permisos sobre la tabla eso deja de depender de que nadie escriba esa consulta.
 */
export const prospects = pgTable(
  'prospects',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    /* ── Lo que llenaron. Inmutable. ─────────────────────────────────────── */

    contactName: text('contact_name').notNull(),
    contactEmail: text('contact_email'),
    /** El canal real de la conversación en este mercado, y por eso es el obligatorio. */
    contactPhone: text('contact_phone').notNull(),
    /** Clave de `event_types`. Sin clave ajena: el catálogo puede retirar un tipo y la solicitud
        tiene que seguir contando lo que pidieron ese día. */
    eventTypeKey: text('event_type_key'),
    /** Puede no haber fecha todavía; es justo lo que decide si hay tiempo de producirlo. */
    eventDate: date('event_date'),
    /** Un rango y no un número: nadie sabe cuántos invitados va a tener con precisión. */
    guestRange: text('guest_range'),
    /**
     * De dónde venía. Es lo que convierte una solicitud en una propuesta: llega diciendo «quiere
     * `botanical` en Plus» y la primera respuesta ya no es un cuestionario.
     *
     * Sin clave ajena, por lo mismo que `event_type_key`: si mañana se retira esa plantilla, la
     * solicitud sigue diciendo la verdad de lo que le gustó.
     */
    templateKey: text('template_key'),
    planKey: text('plan_key'),
    message: text('message'),
    /** Para el límite por IP. Se cuenta sobre esta columna: cada envío ya es una fila. */
    submittedIp: inet('submitted_ip'),

    /* ── El seguimiento. Mutable. ────────────────────────────────────────── */

    status: prospectStatus('status').notNull().default('new'),
    /** Cuándo toca insistir. Es lo único que mira hacia adelante, y de ahí sale «vencido». */
    nextFollowUpAt: timestamp('next_follow_up_at', { withTimezone: true }),
    /** Por qué se perdió. Se guarda porque es la mitad interesante de la estadística. */
    lostReason: text('lost_reason'),
    /**
     * El cliente en que se convirtió. `set null` y no `cascade`: si alguien borrara el cliente, la
     * solicitud tiene que sobrevivir — es historia del embudo, no del tenant.
     */
    clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),

    ...timestamps,
  },
  (t) => [
    /** La bandeja: primero los nuevos, luego los que toca insistir. */
    index('prospects_status_idx').on(t.status, t.nextFollowUpAt),
    /** El conteo del límite por IP dentro de la ventana. */
    index('prospects_ip_idx').on(t.submittedIp, t.createdAt),
    index('prospects_client_id_idx').on(t.clientId),
  ],
);

/**
 * Cada vez que se habló con un prospecto.
 *
 * Existe en vez de un campo `notes` largo porque responde preguntas que un bloque de texto no
 * responde a los dos meses: ¿ya le insistí?, ¿cuándo?, ¿qué contestó? Y porque `last_touch_at` no
 * se guarda denormalizado en ninguna parte — es el `MAX` de esta tabla, así que no puede
 * contradecir a la bitácora.
 */
export const prospectTouches = pgTable(
  'prospect_touches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    prospectId: uuid('prospect_id')
      .notNull()
      .references(() => prospects.id, { onDelete: 'cascade' }),
    channel: touchChannel('channel').notNull(),
    note: text('note').notNull(),
    /**
     * Quién anotó. `set null` para que borrar una cuenta de plataforma no se lleve por delante la
     * bitácora del embudo.
     */
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    ...createdAtOnly,
  },
  (t) => [index('prospect_touches_prospect_idx').on(t.prospectId, sql`created_at desc`)],
);
