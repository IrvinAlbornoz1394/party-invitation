/**
 * Vacía el esquema para volver a levantarlo desde cero. **Destructivo y sin vuelta atrás.**
 *
 * Se corre con el rol DUEÑO y exige `--force`, que es lo único que separa un reinicio deliberado
 * de un `npm run` escrito de más en la terminal equivocada.
 *
 * ## Por qué borra tablas y no el esquema entero
 *
 * `drop schema public cascade` parece más limpio y es una trampa: `grant usage on schema public
 * to mievento_app` vive en `sql/0000_bootstrap_roles.sql`, que se aplica **a mano y como
 * superusuario**, y que `db:migrate` no vuelve a correr. Al recrear el esquema, el rol de la
 * aplicación se queda sin permiso para verlo y todo responde «permission denied for schema
 * public» — un fallo que no se parece en nada a su causa.
 *
 * Borrando las tablas y los tipos, los permisos de esquema siguen en pie y `db:migrate` deja la
 * base lista sin ningún paso manual. Los roles son del cluster y tampoco se tocan.
 *
 * El esquema `app` sí se borra entero: lo crea `sql/0001_security.sql`, que sí se reaplica en
 * cada migración.
 *
 * ## Qué se lleva por delante
 *
 * Todo lo de `public`: catálogos, clientes, eventos, cuentas y **las sesiones abiertas**. Después
 * de esto hay que volver a entrar a `/admin` pidiendo un código nuevo. Lo que Supabase guarda en
 * sus propios esquemas (`auth`, `storage`) no se toca — este producto no los usa.
 */
import { config as loadDotenv } from 'dotenv';
import { Pool } from 'pg';

loadDotenv({ path: ['.env.local', '.env'], quiet: true });

const url = process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL;

if (!url) {
  console.error('Falta DATABASE_MIGRATION_URL (o DATABASE_URL).');
  process.exit(1);
}

if (!process.argv.includes('--force')) {
  const { hostname, pathname } = new URL(url);

  console.error(
    `\n✗ Esto BORRA todas las tablas de "public" en ${hostname}${pathname}, incluidas las\n` +
      '  cuentas y las sesiones abiertas. Si estás seguro:\n\n' +
      '    npm run db:reset -- --force\n',
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: url, max: 1 });

/*
 * Se recorre el catálogo en lugar de escribir la lista de tablas a mano: una lista se queda
 * corta en cuanto alguien añade una tabla, y entonces el reinicio deja una fila viva que hace
 * fallar la migración siguiente por un motivo que no se entiende.
 *
 * `cascade` en cada `drop` porque hay claves ajenas cruzadas y no existe un orden que las
 * respete todas.
 */
const RESET = `
do $$
declare
  target record;
begin
  for target in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('drop table if exists public.%I cascade', target.tablename);
  end loop;

  for target in
    select t.typname
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typtype = 'e'
  loop
    execute format('drop type if exists public.%I cascade', target.typname);
  end loop;
end
$$;
`;

async function main(): Promise<void> {
  const { hostname, pathname } = new URL(url as string);

  console.log(`▸ Vaciando public en ${hostname}${pathname}…`);

  // El esquema de las funciones de seguridad va primero: sus funciones referencian las tablas.
  await pool.query('drop schema if exists app cascade');
  await pool.query(RESET);

  /*
   * Y el registro de migraciones de Drizzle, que vive en su propio esquema.
   *
   * Sin esto, `db:migrate` responde «migraciones al día» sobre una base sin una sola tabla —cree
   * que ya las aplicó, porque su registro dice que sí— y el fallo aparece dos comandos después,
   * en el seed, con un «no existe la relación public.events» que no se parece a su causa.
   */
  await pool.query('drop schema if exists drizzle cascade');

  const { rows } = await pool.query<{ count: string }>(
    "select count(*)::text as count from pg_tables where schemaname = 'public'",
  );

  console.log(`  tablas restantes en public: ${rows[0]?.count ?? '?'}`);
  console.log('\n✓ Base vacía. Siguiente paso: npm run db:migrate');
}

main()
  .catch((error: unknown) => {
    console.error('\n✗ Reinicio fallido\n');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
