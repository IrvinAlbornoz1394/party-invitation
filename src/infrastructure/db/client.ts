import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '@/lib/env';
import * as schema from './schema';

/**
 * Pool de conexiones.
 *
 * Se guarda en globalThis porque en desarrollo Next recarga los módulos en cada
 * cambio, y sin esto cada recarga abriría un pool nuevo hasta agotar las conexiones
 * de Postgres.
 */
const globalForDb = globalThis as unknown as { __mieventoPool?: Pool };

function createPool(): Pool {
  return new Pool({
    connectionString: env.DATABASE_URL,
    /**
     * Conservador a propósito. Cada instancia serverless abre su propio pool, así que
     * un número alto aquí multiplica por el número de instancias y tumba a Postgres.
     * Con un pooler delante (PgBouncer, Supabase, Neon) esto puede subir.
     */
    max: 10,
    idleTimeoutMillis: 30_000,
    /** Falla rápido en vez de dejar la petición colgada si Postgres no responde. */
    connectionTimeoutMillis: 10_000,
    /*
     * El TLS NO se configura aquí: lo decide `sslmode` en DATABASE_URL, que `pg` ya
     * respeta.
     *
     * Atarlo a NODE_ENV era un error. `next start` corre con NODE_ENV=production
     * también en local, así que forzaba TLS contra un Postgres de desarrollo que no lo
     * soporta y la conexión fallaba con "The server does not support SSL connections".
     * Peor aún, ese acoplamiento oculta una decisión de infraestructura dentro del
     * código: si mañana hay un staging sin TLS o un pooler que lo termina antes, hay
     * que recompilar en vez de cambiar una variable.
     *
     * Producción: añadir `?sslmode=require` a DATABASE_URL.
     */
  });
}

export const pool = globalForDb.__mieventoPool ?? createPool();

if (env.NODE_ENV !== 'production') {
  globalForDb.__mieventoPool = pool;
}

/**
 * Cliente Drizzle.
 *
 * IMPORTANTE: usar este cliente directamente NO aplica contexto de tenant. Para
 * cualquier consulta sobre datos de un cliente hay que pasar por `withTenant()`.
 * Row-Level Security hace que sin contexto no se vea ninguna fila, así que el error
 * se manifiesta como "no hay datos", no como una fuga.
 */
export const db = drizzle(pool, { schema, casing: 'snake_case' });

export type Database = typeof db;
export { schema };
