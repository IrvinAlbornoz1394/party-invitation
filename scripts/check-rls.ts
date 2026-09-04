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
      -- ── La excepción, declarada y no silenciada ──────────────────────────────
      --
      -- La tabla "prospects" tiene client_id y NO lleva RLS, y es correcto: no es una tabla de
      -- tenant. Su client_id es el RESULTADO de la conversión —a qué cliente acabó llegando esa
      -- solicitud— y no su alcance; al nacer es NULL y una solicitud no pertenece a nadie.
      --
      -- Lo que la protege es más fuerte que RLS: el rol de la aplicación no tiene NINGÚN permiso
      -- sobre ella, así que está en AUTH_PLANE_TABLES y esa comprobación falla si alguien le
      -- concede uno. Una política de tenant aquí no protegería nada —no hay contexto de cliente
      -- cuando alguien llena el formulario público— y daría la falsa impresión de que sí.
      --
      -- Los acentos graves están prohibidos en este comentario: vive dentro de un template
      -- literal de JavaScript y cerrarían la cadena.
      and c.relname <> 'prospects'
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
 * Los invariantes del modelo de membresías.
 *
 * Sustituyen al CHECK `users_client_xor_platform`, que se fue con `users.client_id`. La
 * diferencia importa: aquel era una imposibilidad estructural —una fila que la base de datos
 * no dejaba escribir— y estos son condiciones sobre el CONJUNTO, que ningún CHECK puede
 * expresar porque miran más de una fila a la vez. Por eso se verifican aquí, y por eso esta
 * comprobación es más necesaria que la que reemplaza.
 *
 * El primero es el que más pesa. Que las cuentas de plataforma fueran invisibles para el panel
 * de cualquier cliente venía gratis cuando `users.client_id` era NULL en ellas: `NULL =
 * <cualquier cosa>` nunca es TRUE, así que ninguna política las alcanzaba. Al salir esa
 * columna, la garantía pasa a depender de que no tengan membresías — y de que la política de
 * `users` exija compartir una. Si alguien le diera una membresía a la cuenta de plataforma,
 * empezaría a aparecer en el equipo de ese cliente sin que nada más lo señalara.
 */
async function checkMembershipInvariants(): Promise<void> {
  const { rows: platformWithMembership } = await pool.query<{ email: string }>(
    `select u.email
     from public.users u
     join public.memberships m on m.user_id = u.id
     where u.platform_role is not null`,
  );

  for (const row of platformWithMembership) {
    problems.push(
      `${row.email} es cuenta de plataforma y tiene membresías; dejaría de ser invisible ` +
        'para el panel del cliente al que alcanza',
    );
  }

  /*
   * El CHECK `memberships_role_scope` sí es expresable por fila, y se comprueba que siga
   * puesto por lo mismo que se comprobaba el anterior: se tira con una línea de SQL y nada
   * más lo notaría hasta que alguien escribiera un visor sin evento —que alcanzaría el
   * cliente entero— o un dueño de un solo evento.
   */
  const { rows: scopeCheck } = await pool.query<{ conname: string }>(
    `select conname
     from pg_constraint
     where conrelid = 'public.memberships'::regclass
       and contype = 'c'
       and conname = 'memberships_role_scope'`,
  );

  if (scopeCheck.length === 0) {
    problems.push(
      'memberships: falta el CHECK memberships_role_scope; un visor sin evento alcanzaría ' +
        'el cliente entero',
    );
  }

  /*
   * Los dos únicos parciales. Un `unique (user_id, client_id, event_id)` a secas NO sirve
   * —dos NULL no son iguales en Postgres— así que si alguien los sustituyera por el único
   * "obvio", la misma persona podría tener dos roles simultáneos sobre el mismo cliente y
   * nada decidiría cuál gana.
   */
  const { rows: partialIndexes } = await pool.query<{ indexname: string }>(
    `select indexname
     from pg_indexes
     where schemaname = 'public'
       and tablename = 'memberships'
       and indexname in ('memberships_client_scope_idx', 'memberships_event_scope_idx')`,
  );

  if (partialIndexes.length < 2) {
    problems.push(
      'memberships: faltan los únicos parciales por alcance; una identidad podría tener ' +
        'dos membresías del mismo alcance sobre el mismo cliente',
    );
  }

  /*
   * Que la aplicación no escriba `users`. Es lo que obliga a que crear una identidad pase por
   * `app.grant_membership()`, y no es un detalle de estilo: una identidad no es un dato de
   * tenant, así que RLS no puede acotar quién tiene derecho a crearla. Con INSERT concedido,
   * un cliente podría fabricar identidades ajenas.
   */
  const { rows: userWrites } = await pool.query<{ privilege_type: string }>(
    `select distinct privilege_type
     from information_schema.table_privileges
     where table_schema = 'public'
       and table_name = 'users'
       and grantee = 'mievento_app'
       and privilege_type in ('INSERT', 'UPDATE', 'DELETE')`,
  );

  for (const row of userWrites) {
    problems.push(
      `users: mievento_app tiene ${row.privilege_type} sobre la tabla; crear o editar una ` +
        'identidad debe pasar por app.grant_membership()',
    );
  }

  console.log(
    '  invariantes de membresías revisados (plataforma sin membresías, alcance, únicos ' +
      'parciales, users de solo lectura)',
  );
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

/**
 * Con qué rol se conecta la APLICACIÓN, que es distinto de con cuál corre esta comprobación.
 *
 * Row-Level Security **no se aplica a un superusuario ni a quien tenga BYPASSRLS**, y tampoco al
 * dueño de la tabla salvo que se fuerce. Así que todo lo que verifica este script —políticas
 * puestas, permisos revocados— puede estar perfecto y aun así la aplicación verlo todo, si su
 * cadena de conexión apunta a `postgres` en lugar de a `mievento_app`.
 *
 * No es hipotético: pasó en desarrollo y el síntoma fue el peor posible, porque no parecía un
 * problema de permisos — la ficha de CADA cliente mostraba los eventos de TODOS, y lo primero que
 * uno mira es el filtro de la consulta, que estaba bien. Las consultas del panel no llevan
 * `where client_id` a propósito: confían en RLS.
 */
async function checkAppConnectionRespectsRls(): Promise<void> {
  const appUrl = process.env.DATABASE_URL;

  if (!appUrl) {
    console.log('  DATABASE_URL sin definir: no se pudo revisar el rol de la aplicación');

    return;
  }

  const appPool = new Pool({ connectionString: appUrl, max: 1 });

  try {
    const { rows } = await appPool.query<{ usuario: string; superusuario: boolean; bypassrls: boolean }>(
      `select current_user as usuario,
              rolsuper as superusuario,
              rolbypassrls as bypassrls
         from pg_roles where rolname = current_user`,
    );
    const role = rows[0];

    if (!role) return;

    if (role.superusuario || role.bypassrls) {
      problems.push(
        `DATABASE_URL se conecta como "${role.usuario}", que ${role.superusuario ? 'es superusuario' : 'tiene BYPASSRLS'}: ` +
          'Row-Level Security NO se le aplica y la aplicación vería los datos de todos los clientes. ' +
          'Debe conectarse con mievento_app.',
      );
    }

    console.log(`  rol de la aplicación revisado (${role.usuario})`);
  } finally {
    await appPool.end();
  }
}

async function main(): Promise<void> {
  console.log('▸ Verificando aislamiento entre clientes…');
  await checkTenantTablesHaveRls();
  await checkAuthPlaneIsSealed();
  await checkUserColumnsAreWithheld();
  await checkMembershipInvariants();
  await checkAppRoleCannotCreate();
  await checkAppConnectionRespectsRls();

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
