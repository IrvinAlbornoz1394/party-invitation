import { boolean, index, inet, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { createdAtOnly } from './_shared';

/**
 * Intentos de abrir una invitación.
 *
 * Sirve para dos cosas: aplicar el límite por IP que hace inviable barrer códigos de
 * 6 caracteres, y dejar rastro para investigar si alguien lo intenta.
 *
 * NO es una tabla de tenant y no lleva `client_id`. Un intento fallido no tiene
 * evento asociado —justamente porque el slug o el código no resolvieron—, así que no
 * hay cliente a la que atribuirlo.
 *
 * NO se guarda el código intentado. Sería útil para forense, pero un código válido
 * para otro evento acabaría almacenado en claro en una tabla de logs, y eso convierte
 * un log en un depósito de credenciales ajenas.
 *
 * El rol de la aplicación no tiene permisos directos: se escribe y se consulta solo
 * desde `app.resolve_invitation_access()`.
 */
export const invitationAccessAttempts = pgTable(
  'invitation_access_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Slug solicitado. Se guarda aunque no exista, para ver qué nombres se están probando. */
    slug: text('slug').notNull(),
    clientIp: inet('client_ip'),
    succeeded: boolean('succeeded').notNull(),
    ...createdAtOnly,
  },
  (t) => [
    /** Índice de la consulta del límite: intentos fallidos de esta IP en la ventana. */
    index('invitation_access_attempts_ip_created_at_idx').on(t.clientIp, t.createdAt),
    index('invitation_access_attempts_slug_created_at_idx').on(t.slug, t.createdAt),
  ],
);
