/**
 * Aplica el esquema completo con el rol DUEÑO.
 *
 *   1. Migraciones de Drizzle (DDL de src/lib/db/migrations)
 *   2. SQL de seguridad (RLS, permisos, funciones del plano de autenticación)
 *
 * El paso 2 va después y siempre, porque cada migración nueva puede crear tablas
 * que necesitan políticas y permisos. Es idempotente.
 */
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

loadDotenv({ path: ['.env.local', '.env'], quiet: true });

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// No se importa src/lib/env.ts a propósito: migrar no necesita AUTH_SECRET, y un job
// de CI no debería tener que inventarse secretos que no usa.
const url = process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL;

if (!url) {
  console.error('Falta DATABASE_MIGRATION_URL (o DATABASE_URL). Copia .env.example a .env.local.');
  process.exit(1);
}

const pool = new Pool({ connectionString: url, max: 1 });

/** Comprueba que el bootstrap de roles ya se ejecutó, para poder decirlo con claridad. */
async function assertRolesExist(): Promise<void> {
  const { rows } = await pool.query<{ rolname: string }>(
    `select rolname from pg_roles where rolname = any($1::text[])`,
    [['mievento_owner', 'mievento_app']],
  );
  const found = new Set(rows.map((r) => r.rolname));
  const missing = ['mievento_owner', 'mievento_app'].filter((r) => !found.has(r));

  if (missing.length > 0) {
    throw new Error(
      `Faltan los roles de Postgres: ${missing.join(', ')}.\n\n` +
        'Ejecuta primero el bootstrap como superusuario:\n' +
        '  psql -U postgres -d mievento -f src/infrastructure/db/sql/0000_bootstrap_roles.sql\n\n' +
        '(recuerda cambiar las contraseñas del archivo antes de correrlo)',
    );
  }
}

async function main(): Promise<void> {
  await assertRolesExist();

  console.log('▸ Aplicando migraciones de Drizzle…');
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder: resolve(projectRoot, 'src/infrastructure/db/migrations') });
  console.log('  migraciones al día');

  console.log('▸ Aplicando SQL de seguridad…');
  const securitySql = await readFile(
    resolve(projectRoot, 'src/infrastructure/db/sql/0001_security.sql'),
    'utf8',
  );
  await pool.query(securitySql);
  console.log('  RLS, permisos y funciones de autenticación aplicados');

  console.log('\n✓ Esquema listo. Siguiente paso: npm run db:seed');
}

main()
  .catch((error: unknown) => {
    console.error('\n✗ Migración fallida\n');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
