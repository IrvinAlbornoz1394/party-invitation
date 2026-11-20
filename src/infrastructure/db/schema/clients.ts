import { sql } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from './_shared';

export const clientStatus = pgEnum('client_status', ['active', 'suspended', 'closed']);

/**
 * El cliente: quien contrata la plataforma, y el tenant del sistema.
 *
 * Toda fila de datos que no sea catálogo de plataforma cuelga de un cliente, y el
 * aislamiento entre clientes lo impone Postgres vía Row-Level Security, no la
 * aplicación.
 *
 * Un cliente tiene N eventos. Es la razón de que el cliente exista como entidad y no
 * se confunda con el evento: la misma familia contrata la boda este año y los XV el
 * siguiente, y sus cuentas de acceso, su historial y su facturación son los mismos en
 * los dos. Si el tenant fuera el evento, esa persona tendría dos identidades sin
 * relación entre sí.
 *
 * El plan NO vive aquí sino en `events`: se vende por evento, así que un cliente puede
 * tener una boda Premium y unos XV Esencial al mismo tiempo.
 */
export const clients = pgTable(
  'clients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Cómo se le llama en el panel de plataforma: 'Familia Albornoz', 'Ana & Diego'. */
    name: text('name').notNull(),
    /** Identificador legible y estable, para URLs internas y referencias en soporte. */
    /** Único entre los clientes vivos: al eliminar uno, su slug queda libre (ver `deleted_at`). */
    slug: text('slug').notNull(),
    /**
     * `suspended` corta el acceso al panel sin borrar nada; `closed` es la baja.
     * Ninguno de los dos despublica las invitaciones ya publicadas: eso se decide por
     * evento, porque cortarle la invitación a los invitados de una boda que es mañana
     * sería un daño desproporcionado frente a un impago.
     */
    status: clientStatus('status').notNull().default('active'),
    contactEmail: text('contact_email'),
    contactPhone: text('contact_phone'),
    /** Notas internas del equipo de plataforma. El cliente nunca las ve. */
    notes: text('notes'),
    /**
     * Eliminado lógico (`sql/increments/2026-11-20_eliminado_logico.sql`). Con valor, el cliente no
     * existe para la aplicación: ni se lista, ni abre sesiones, ni se le puede abrir el contexto.
     * Sus eventos se marcan con el mismo instante.
     */
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('clients_slug_active_key').on(t.slug).where(sql`deleted_at is null`),
  ],
);
