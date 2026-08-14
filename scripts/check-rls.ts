/**
 * Verifica que el aislamiento entre clientes esté realmente puesto.
 *
 * Existe porque la lista de tablas con RLS en 0001_security.sql está escrita a mano:
 * es auditable, pero también es olvidable. Si alguien agrega una tabla con
 * client_id y no la mete en la lista, este script falla y lo dice.
 *
 * Comprueba cinco cosas:
 *   1. Toda tabla con client_id tiene RLS habilitado.
 *   2. Toda tabla con RLS tiene al menos una política.
 *   3. El rol de la aplicación no tiene ningún permiso sobre el plano de auth, y ninguna
 *      tabla con hashes de credenciales quedó fuera de esa lista.
 *   4. Las columnas sensibles de `users` no son escribibles desde la aplicación.
 *   5. El rol de la aplicación no puede hacer DDL en el esquema public.
 *
 * Corre con el rol dueño, que es el único que puede inspeccionar el catálogo completo.
 */
import { config as loadDotenv } from 'dotenv';
import { Pool } from 'pg';
import {
  AUTH_PLANE_TABLES,
  USER_COLUMNS_WITHHELD_FROM_APP,
} from '../src/infrastructure/db/schema/index.js';

loadDotenv({ path: ['.env.local', '.env'], quiet: true });

const url = process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL;

if (!url) {
  console.error('Falta DATABASE_MIGRATION_URL (o DATABASE_URL).');
  process.exit(1);
}

const pool = new Pool({ connectionString: url, max: 1 });
const problems: string[] = [];

async function checkTenantTablesHaveRls(): Promise<void> {
  const { rows } = await pool.query<{ table_name: string; rls: boolean; policies: number }>(`
    select c.relname   as table_name,
           c.relrowsecurity as rls,
           (select count(*) from pg_policy p where p.polrelid = c.oid)::int as policies
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and (
        exists (
          select 1 from pg_attribute a
          where a.attrelid = c.oid and a.attname = 'client_id'
            and a.attnum > 0 and not a.attisdropped
        )
        -- clients aísla por su propio id, no por client_id, así que hay
        -- que nombrarla explícitamente o se escaparía de esta comprobación.
        or c.relname = 'clients'
      )
    order by c.relname
  `);

  for (const row of rows) {
    if (!row.rls) {
      problems.push(`${row.table_name}: tiene client_id pero RLS está DESHABILITADO`);
    } else if (row.policies === 0) {
      problems.push(`${row.table_name}: RLS habilitado pero SIN políticas (bloquea todo)`);
    }
  }

  console.log(`  ${rows.length} tablas con client_id revisadas`);
}

async function checkAuthPlaneIsSealed(): Promise<void> {
  const { rows } = await pool.query<{ table_name: string; privilege_type: string }>(
    `select table_name, privilege_type
     from information_schema.table_privileges
     where grantee = 'mievento_app'
       and table_schema = 'public'
       and table_name = any($1::text[])`,
    [AUTH_PLANE_TABLES],
  );

  for (const row of rows) {
    problems.push(
      `${row.table_name}: mievento_app tiene ${row.privilege_type}; el plano de auth debe estar sellado`,
    );
  }

  // Se comprueba también que la lista no se haya quedado corta. Una tabla de credenciales
  // nueva que nadie metió en AUTH_PLANE_TABLES pasaría esta prueba sin ser revisada, y ese
  // es justo el fallo silencioso que el script existe para evitar.
  const { rows: missing } = await pool.query<{ table_name: string }>(
    `select c.relname as table_name
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relkind = 'r'
       and not (c.relname = any($1::text[]))
       and exists (
         select 1 from pg_attribute a
         where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
           and a.attname in ('token_hash', 'code_hash')
       )`,
    [AUTH_PLANE_TABLES],
  );

  for (const row of missing) {
    problems.push(
      `${row.table_name}: guarda hashes de credenciales pero no está en AUTH_PLANE_TABLES`,
    );
  }

  console.log(`  ${AUTH_PLANE_TABLES.length} tablas del plano de auth revisadas`);
}

/**
 * Las columnas sensibles de `users` no deben ser escribibles por la aplicación.
 *
 * `platform_role` decide si una cuenta entra a `/admin` y ve a todos los clientes. Si la
 * aplicación pudiera escribirla, la pantalla de administrar usuarios sería una escalada: un
 * dueño editando a alguien de su propio cliente —cosa que RLS permite y debe permitir— se
 * concedería acceso a todos los demás clientes.
 *
 * Es una comprobación de permisos por columna, y por eso hace falta un script: un
 * `grant update on users` escrito sin pensar en algún momento futuro revertiría la
 * protección sin que nada más lo note.
 */
async function checkUserColumnsAreWithheld(): Promise<void> {
  const { rows } = await pool.query<{ column_name: string; privilege_type: string }>(
    `select column_name, privilege_type
     from information_schema.column_privileges
     where grantee = 'mievento_app'
       and table_schema = 'public'
       and table_name = 'users'
       and column_name = any($1::text[])
       and privilege_type in ('INSERT', 'UPDATE')`,
    [USER_COLUMNS_WITHHELD_FROM_APP],
  );

  for (const row of rows) {
    problems.push(
      `users.${row.column_name}: mievento_app tiene ${row.privilege_type}; ` +
        'esa columna no debe ser escribible desde la aplicación',
    );
  }

  console.log(
    `  columnas protegidas de users revisadas (${USER_COLUMNS_WITHHELD_FROM_APP.join(', ')})`,
  );
}

/**
 * El invariante que separa los dos paneles tiene que seguir impuesto por la base de datos.
 *
 * `users_client_xor_platform` exige que una cuenta sea de un cliente o de la plataforma,
 * nunca las dos ni ninguna. Sin él, una fila con `client_id` Y `platform_role` sería un
 * cliente con acceso a `/admin`: un tenant propio más el privilegio de ver a todos los
 * demás, que es exactamente la escalada que el modelo evita.
 *
 * Se comprueba aquí porque un CHECK se puede tirar con una línea de SQL y nada más lo
 * notaría: la aplicación seguiría funcionando igual hasta el día que alguien escribiera la
 * fila imposible.
 */
async function checkAccountKindConstraint(): Promise<void> {
  const { rows } = await pool.query<{ conname: string }>(
    `select conname
     from pg_constraint
     where conrelid = 'public.users'::regclass
       and contype = 'c'
       and conname = 'users_client_xor_platform'`,
  );

  if (rows.length === 0) {
    problems.push(
      'users: falta el CHECK users_client_xor_platform; una cuenta podría ser de un ' +
        'cliente y de la plataforma a la vez',
    );
  }

  console.log('  CHECK users_client_xor_platform revisado');
}

async function checkAppRoleCannotCreate(): Promise<void> {
  const { rows } = await pool.query<{ has_create: boolean }>(
    `select has_schema_privilege('mievento_app', 'public', 'CREATE') as has_create`,
  );

  if (rows[0]?.has_create) {
    problems.push('mievento_app puede CREATE en el esquema public; debería estar revocado');
  }

  console.log('  privilegio CREATE del rol de aplicación revisado');
}

async function main(): Promise<void> {
  console.log('▸ Verificando aislamiento entre clientes…');
  await checkTenantTablesHaveRls();
  await checkAuthPlaneIsSealed();
  await checkUserColumnsAreWithheld();
  await checkAccountKindConstraint();
  await checkAppRoleCannotCreate();

  if (problems.length > 0) {
    console.error(`\n✗ ${problems.length} problema(s) de seguridad:\n`);
    for (const problem of problems) console.error(`  · ${problem}`);
    process.exitCode = 1;
    return;
  }

  console.log('\n✓ Aislamiento entre clientes correcto');
}

main()
  .catch((error: unknown) => {
    console.error('\n✗ Verificación fallida\n');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
