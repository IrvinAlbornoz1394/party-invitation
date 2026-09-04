export * from './_shared';
export * from './audit';
export * from './auth';
export * from './engagement';
export * from './events';
export * from './guests';
export * from './memberships';
export * from './plans';
export * from './prospects';
export * from './registry';
export * from './reminders';
export * from './seating';
export * from './security';
export * from './clients';

/**
 * Tablas con `client_id` que deben quedar sujetas a Row-Level Security.
 *
 * La lista está escrita a mano a propósito: es una decisión de seguridad, no algo
 * que convenga derivar automáticamente. Si alguien añade una tabla de tenant y
 * olvida ponerla aquí, la prueba de `scripts/check-rls.ts` falla y lo señala.
 */
export const TENANT_TABLES = [
  'events',
  /*
   * `memberships` es tabla de tenant: las cuentas con acceso a un cliente son datos de ese
   * cliente. Que esté aquí es lo que impide que el panel de un cliente liste los accesos de
   * otro por una consulta mal escrita.
   *
   * El camino del login NO pasa por esta política —cuando alguien pide su código todavía no
   * hay contexto de cliente, y precisamente lo que necesita saber es a qué clientes
   * alcanza—. Ese camino va por `app.list_memberships()`, que es SECURITY DEFINER.
   */
  'memberships',
  'event_blocks',
  'event_venues',
  'event_schedule_items',
  'event_gallery_items',
  'event_messages',
  'event_gift_registries',
  'guest_groups',
  'guests',
  'rsvp_responses',
  'event_tables',
  'table_assignments',
  'reminder_schedules',
  'reminder_deliveries',
  'guestbook_entries',
] as const;

/**
 * Catálogos globales de la plataforma. El rol de la aplicación solo tiene SELECT
 * sobre ellas: un evento no puede inventar planes, variantes ni temas.
 */
export const PLATFORM_CATALOG_TABLES = [
  'features',
  'plans',
  'plan_features',
  'event_types',
  'blocks',
  'component_variants',
  'templates',
  'themes',
  'template_blocks',
  'template_plans',
] as const;

/**
 * Tablas **selladas**: el rol de la aplicación NO tiene ningún permiso sobre ellas y se acceden
 * solo por funciones SECURITY DEFINER.
 *
 * Son de dos clases y comparten la misma regla, que es lo que las hace una sola lista:
 *
 * - **El plano de autenticación.** Aunque alguien lograra ejecutar SQL arbitrario con el rol de
 *   la aplicación, no puede leer un hash de sesión, robar un código a medio usar ni borrar los
 *   intentos para reiniciar los límites.
 * - **Las solicitudes del formulario público.** `prospects` es la única tabla del sistema con
 *   escritura anónima, y sus filas son datos de contacto de terceros. Que el rol de la aplicación
 *   no pueda ni leerlas es lo que hace imposible que el panel de un cliente saque los teléfonos
 *   de los prospectos por una consulta mal escrita.
 *
 * `scripts/check-rls.ts` recorre esta lista y falla si alguna tiene algún privilegio concedido a
 * `mievento_app`. Añadir una tabla sellada sin meterla aquí es un fallo silencioso, así que la
 * comprobación lee de la misma constante que documenta la decisión.
 */
export const AUTH_PLANE_TABLES = [
  'otp_challenges',
  'sessions',
  'auth_attempts',
  'invitation_access_attempts',
  'prospects',
  'prospect_touches',
] as const;

/**
 * Columnas de `users` que el rol de la aplicación NO puede escribir.
 *
 * Hoy la comprobación es trivial de pasar, porque la aplicación no escribe `users` en
 * absoluto: crear o editar una identidad pasa por `app.grant_membership()`. Se conserva a
 * propósito, y no por inercia — es la red que avisa si alguien devolviera permisos de
 * escritura sobre la tabla sin darse cuenta de lo que implica.
 *
 * Lo que cada una protegía, por si vuelve a hacer falta:
 *
 * `platform_role` decide si una cuenta entra a `/admin` y ve a todos los clientes. Con
 * escritura, la pantalla de administrar accesos sería una escalada de privilegios: un dueño
 * editando a alguien de su propio cliente se concedería acceso a todos los demás.
 *
 * `last_login_at` lo escribe el plano de auth con el rol dueño; que la app no pueda tocarlo
 * mantiene el rastro de accesos fiable.
 */
export const USER_COLUMNS_WITHHELD_FROM_APP = ['platform_role', 'last_login_at'] as const;
