import { sql } from 'drizzle-orm';
import { check, foreignKey, index, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from './_shared';
import { membershipRole, users, userStatus } from './auth';
import { clients } from './clients';
import { events } from './events';

/**
 * Qué alcanza cada identidad. Es la tabla que separa «quién eres» de «qué puedes ver».
 *
 * Vive en su propio archivo y no en `auth.ts` porque necesita `events` para la clave ajena
 * compuesta, y `events` ya importa `users`: ponerla junto a la identidad crearía un ciclo
 * entre módulos del esquema.
 *
 * ## Dos alcances en una sola tabla
 *
 * - `event_id` NULL → **alcance cliente**: la persona alcanza todos los eventos de ese
 *   cliente. Es lo que antes era `users.client_id` + `users.role`.
 * - `event_id` no nulo → **alcance evento**: alcanza ese evento y nada más. Es lo que hace
 *   posible que los novios vean su boda sin ver las otras del organizador que la produce.
 *
 * Un evento puede tener N accesos porque la pertenencia es una fila y no una columna. Ese
 * era el límite del modelo anterior, no un permiso que faltara.
 *
 * ## Por qué la clave ajena es compuesta
 *
 * `(event_id, client_id) → events(id, client_id)` es el mismo recurso que usan todas las
 * tablas hijas del evento: el `client_id` está repetido para que las políticas de RLS no
 * necesiten joins, y la compuesta es lo que impide que ese valor duplicado contradiga al
 * del evento. Sin ella se podría dar acceso a un evento de OTRO cliente escribiendo un
 * `client_id` cualquiera, que es exactamente la fuga que RLS existe para evitar.
 *
 * ## El rol y el alcance no son independientes
 *
 * Están atados por un CHECK y no por una convención, porque una regla de negocio que la
 * base de datos no impone acaba incumplida por el primer camino que se escriba sin leer
 * esto:
 *
 * - `owner` y `admin` son del cliente entero. Un «dueño de un solo evento» no significa
 *   nada: quien puede dar de alta cuentas puede dárselas sobre cualquier evento del
 *   cliente, así que limitarlo a uno sería una restricción que la propia capacidad
 *   deshace.
 * - `viewer` es siempre de un evento. Un visor de todo un cliente es una figura que nadie
 *   pidió y que expone los eventos de terceros —el organizador tiene clientes distintos en
 *   cada boda—.
 * - `staff` admite los dos, y ahí está lo que el modelo regala: la asistente que solo debe
 *   tocar una boda es una membresía de alcance evento con rol `staff`. «Visor» y
 *   «asistente de un solo evento» son la misma forma con distinto rol, y por eso no hacen
 *   falta dos conceptos.
 */
export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /**
     * Siempre presente, incluso en el alcance evento: es el tenant de la fila y lo que
     * comparan las políticas de RLS sin tener que resolver el evento primero.
     */
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    /** NULL = alcance cliente. Ver el comentario de la tabla. */
    eventId: uuid('event_id'),
    role: membershipRole('role').notNull(),
    /**
     * Cómo llama el cliente a esta persona: «Los novios», «Mamá de la quinceañera».
     *
     * Va aquí y no en `users.name` porque pertenece a la relación y no a la persona: la
     * misma identidad es «los novios» en un evento y otra cosa en otro. Es también lo que
     * permite dar de alta un visor sin pedirle ningún dato personal.
     */
    label: text('label'),
    /**
     * El acceso se retira desactivando la membresía, no borrándola: `audit_log` apunta a
     * la cuenta y el historial de quién tuvo acceso a un evento es justo lo que hay que
     * poder responder después.
     *
     * Nace en `invited` cuando se concede a alguien que todavía no ha entrado nunca.
     */
    status: userStatus('status').notNull().default('active'),
    ...timestamps,
  },
  (t) => [
    foreignKey({
      columns: [t.eventId, t.clientId],
      foreignColumns: [events.id, events.clientId],
      name: 'memberships_event_fk',
    }).onDelete('cascade'),

    /**
     * `owner` y `admin` solo con alcance cliente; `viewer` solo con alcance evento.
     * `staff` sin restricción. Ver el comentario de la tabla.
     */
    check(
      'memberships_role_scope',
      sql`(${t.role} in ('owner', 'admin') and ${t.eventId} is null)
          or (${t.role} = 'viewer' and ${t.eventId} is not null)
          or ${t.role} = 'staff'`,
    ),

    /*
     * Dos únicos PARCIALES y no un `unique (user_id, client_id, event_id)`.
     *
     * El único de tres columnas no sirve: en Postgres dos NULL no son iguales entre sí, así
     * que dos membresías de alcance cliente para la misma persona pasarían la restricción
     * sin protestar y el sistema tendría dos roles simultáneos sobre el mismo cliente sin
     * forma de decidir cuál gana. `NULLS NOT DISTINCT` lo arreglaría en Postgres 15+, pero
     * dos índices parciales dicen lo mismo sin depender de la versión y además nombran las
     * dos reglas por separado.
     */
    uniqueIndex('memberships_client_scope_idx')
      .on(t.userId, t.clientId)
      .where(sql`event_id is null`),
    uniqueIndex('memberships_event_scope_idx')
      .on(t.userId, t.eventId)
      .where(sql`event_id is not null`),

    /** El listado del selector de entrada: todas las membresías de una identidad. */
    index('memberships_user_id_idx').on(t.userId),
    index('memberships_client_id_idx').on(t.clientId),
    index('memberships_event_id_idx').on(t.eventId),
  ],
);
