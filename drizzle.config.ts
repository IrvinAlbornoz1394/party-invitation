import { config as loadDotenv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// .env.local gana sobre .env, igual que en Next.
loadDotenv({ path: ['.env.local', '.env'], quiet: true });

/**
 * Las migraciones corren con el rol DUEÑO, no con el de la aplicación: el rol de la
 * app no tiene permisos de DDL y no debe tenerlos.
 */
const url = process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    'Falta DATABASE_MIGRATION_URL (o DATABASE_URL). Copia .env.example a .env.local y rellénalo.',
  );
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infrastructure/db/schema/index.ts',
  out: './src/infrastructure/db/migrations',
  dbCredentials: { url },
  // Los nombres de columna del esquema ya están en snake_case explícito.
  casing: 'snake_case',
  strict: true,
  verbose: true,
});
