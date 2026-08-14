export * from './_shared';
export * from './audit';
export * from './auth';
export * from './engagement';
export * from './events';
export * from './guests';
export * from './plans';
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
 * Tablas del plano de autenticación y control de acceso. El rol de la aplicación NO
 * tiene ningún permiso sobre ellas; se acceden solo por funciones SECURITY DEFINER.
 *
 * `scripts/check-rls.ts` recorre esta lista y falla si alguna tiene algún privilegio
 * concedido a `mievento_app`. Añadir una tabla de credenciales sin meterla aquí es un
 * fallo silencioso, así que la comprobación lee de la misma constante que documenta la
 * decisión.
 */
export const AUTH_PLANE_TABLES = [
  'otp_challenges',
  'sessions',
  'auth_attempts',
  'invitation_access_attempts',
] as const;

/**
 * Columnas de `users` que el rol de la aplicación NO puede escribir.
 *
 * `platform_role` decide si una cuenta entra a `/admin` y ve a todos los clientes. Si la
 * aplicación
 * pudiera escribirla, la pantalla de administrar usuarios sería una escalada de
 * privilegios: un dueño editando a alguien de su propio cliente se concedería
 * acceso a todos los demás clientes.
 *
 * `last_login_at` lo escribe el plano de auth con el rol dueño; que la app no pueda
 * tocarlo mantiene el rastro de accesos fiable.
 */
export const USER_COLUMNS_WITHHELD_FROM_APP = ['platform_role', 'last_login_at'] as const;
