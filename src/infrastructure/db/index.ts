/**
 * Punto de entrada de la base de datos para código de aplicación.
 *
 * `server-only` hace que el build falle si un componente cliente importa esto,
 * en lugar de descubrir en producción que la cadena de conexión viajó al navegador.
 * Los scripts de migración y seed importan `./client` directamente, porque corren
 * fuera de Next y ahí este guardia no aplica.
 */
import 'server-only';

export { db, pool, schema, type Database } from './client';
export { withTenant, type TenantTransaction } from './tenant';
export * from './schema';
