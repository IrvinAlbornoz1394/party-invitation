/**
 * Alta, auditoría y baja de las cuentas que administran la plataforma.
 *
 * ## Por qué es un script y no una pantalla
 *
 * `platform_role` es la única columna que decide si una cuenta entra a `/admin` y ve a todos
 * los clientes. Está **revocada** para el rol de la aplicación (ver `sql/0001_security.sql`),
 * así que ni el panel ni una Server Action pueden escribirla, ni siquiera por error. Es
 * deliberado: si el panel pudiera concederla, la pantalla de administrar usuarios de un
 * cliente sería el camino para salirse del aislamiento.
 *
 * La contrapartida es que conceder ese rol tiene que ocurrir fuera de la aplicación, con el
 * rol DUEÑO de Postgres. Eso es este script.
 *
 * ## Por qué separado de `db:seed`
 *
 * `db:seed` carga además catálogos, plantillas y datos de demostración. En producción no se
 * quiere nada de eso: se quiere exactamente una cuenta que pueda entrar. Y al desplegar por
 * primera vez hace falta, porque sin ninguna cuenta no hay forma de entrar al panel — y sin
 * entrar al panel no hay forma de crear cuentas.
 *
 * ## Uso
 *
 * ```bash
 * npm run db:platform-admin                  # la cuenta por defecto de scripts/platform.ts
 * npm run db:platform-admin -- --email otra@ejemplo.com --name "Otra Persona"
 * npm run db:platform-admin -- --list
 * npm run db:platform-admin -- --revoke otro@ejemplo.com
 * ```
 *
 * Precedencia del correo y el nombre: bandera → `PLATFORM_ADMIN_EMAIL` /
 * `PLATFORM_ADMIN_NAME` del entorno → la cuenta de `platform.ts`, que es la misma que crea
 * `db:seed`. Las variables de entorno existen para lanzarlo desde un pipeline sin escribir
 * datos personales en el comando.
 *
 * Es idempotente: repetirlo sobre una cuenta que ya administra la plataforma no cambia nada
 * y lo dice.
 */
import { config as loadDotenv } from 'dotenv';
import { eq, isNotNull, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { normalizeEmail } from '../src/domain/auth/email-address.js';
import { normalizePhoneNumber } from '../src/domain/auth/phone-number.js';
import * as s from '../src/infrastructure/db/schema/index.js';
import { PLATFORM_ADMIN } from './platform.js';

loadDotenv({ path: ['.env.local', '.env'], quiet: true });

/*
 * El rol DUEÑO, no el de la aplicación. `mievento_app` no tiene permiso de escritura sobre
 * `platform_role`, así que con esa conexión este script fallaría — que es exactamente lo que
 * debe pasar.
 */
const url = process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL;

if (!url) {
  console.error('Falta DATABASE_MIGRATION_URL (o DATABASE_URL). Copia .env.example a .env.local.');
  process.exit(1);
}

const pool = new Pool({ connectionString: url, max: 1 });
const db = drizzle(pool, { schema: s, casing: 'snake_case' });

// ────────────────────────────────────────────────────────────────────────────────
// Argumentos
// ────────────────────────────────────────────────────────────────────────────────

interface Options {
  readonly email: string;
  readonly name: string;
  readonly phone: string | null;
  readonly list: boolean;
  readonly revoke: string | null;
}

/**
 * Analizador mínimo de argumentos.
 *
 * Se escribe a mano en lugar de añadir una dependencia: son cinco banderas y `parseArgs` de
 * `node:util` todavía se marca como experimental. Acepta `--clave valor` y `--clave=valor`
 * porque quien escribe esto en una terminal usa las dos formas sin pensarlo.
 */
function parseOptions(argv: readonly string[]): Options {
  const flags = new Map<string, string>();
  let list = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg?.startsWith('--')) continue;

    const [key, inlineValue] = arg.slice(2).split('=', 2);
    if (!key) continue;

    if (key === 'list') {
      list = true;
      continue;
    }

    const value = inlineValue ?? argv[i + 1];
    if (value !== undefined && !value.startsWith('--')) {
      flags.set(key, value);
      if (inlineValue === undefined) i += 1;
    }
  }

  return {
    email: flags.get('email') ?? process.env.PLATFORM_ADMIN_EMAIL ?? PLATFORM_ADMIN.email,
    name: flags.get('name') ?? process.env.PLATFORM_ADMIN_NAME ?? PLATFORM_ADMIN.name,
    phone: flags.get('phone') ?? process.env.PLATFORM_ADMIN_PHONE ?? null,
    list,
    revoke: flags.get('revoke') ?? null,
  };
}

// ────────────────────────────────────────────────────────────────────────────────
// Acciones
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Quién puede ver a todos los clientes.
 *
 * No es un extra: es la pregunta de seguridad más importante de un SaaS multi-tenant, y sin
 * esto solo se puede responder abriendo la base de datos a mano. Conviene mirarlo después de
 * cada despliegue.
 */
async function listPlatformAdmins(): Promise<void> {
  const rows = await db
    .select({
      email: s.users.email,
      name: s.users.name,
      role: s.users.platformRole,
      status: s.users.status,
      lastLoginAt: s.users.lastLoginAt,
    })
    .from(s.users)
    .where(isNotNull(s.users.platformRole))
    .orderBy(s.users.email);

  if (rows.length === 0) {
    console.log('\n  No hay ninguna cuenta con rol de plataforma.');
    console.log(
      '  Crea una con: npm run db:platform-admin -- --email tu@correo.com --name "Tu Nombre"\n',
    );
    return;
  }

  console.log(`\n  ${rows.length} cuenta(s) con rol de plataforma:\n`);
  for (const row of rows) {
    const lastLogin = row.lastLoginAt
      ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(row.lastLoginAt)
      : 'nunca';
    console.log(`  · ${row.email}`);
    console.log(`      ${row.name} · ${row.role} · ${row.status}`);
    console.log(`      último acceso: ${lastLogin}`);
  }
  console.log('');
}

/**
 * Quita el rol de plataforma.
 *
 * Aquí **sí hay que borrar la cuenta**, y es la diferencia más importante con el modelo
 * anterior. Antes una cuenta de plataforma pertenecía además a una organización propia, así
 * que quitarle el rol la dejaba como usuaria normal de esa organización. Hoy su `client_id`
 * es NULL, y el CHECK `users_client_xor_platform` no admite una fila sin cliente y sin rol:
 * una cuenta a la que solo se le quitara el privilegio sería una fila imposible.
 *
 * Eso es lo correcto, además de lo único posible. Una cuenta de plataforma no tiene ningún
 * panel al que "volver": si deja de administrar la plataforma, no le queda nada que hacer en
 * el sistema. El historial de `audit_log` sobrevive igual, porque su `user_id` es
 * `set null` y las acciones guardan copia del correo en `metadata`.
 *
 * Las sesiones abiertas se cortan en la misma transacción. Sin eso, quien acaba de perder el
 * acceso seguiría dentro de `/admin` hasta que su sesión venciera —hasta 30 días—, y quien
 * ejecuta esto normalmente lo hace porque esa persona dejó de llevar la plataforma.
 */
async function revokePlatformAdmin(rawEmail: string): Promise<void> {
  const email = normalizeEmail(rawEmail);
  if (email === null) {
    throw new Error(`"${rawEmail}" no tiene forma de correo.`);
  }

  const [account] = await db
    .select({ id: s.users.id, role: s.users.platformRole })
    .from(s.users)
    .where(eq(s.users.email, email))
    .limit(1);

  if (!account) {
    console.log(`\n  No existe ninguna cuenta con ${email}.\n`);
    return;
  }

  if (account.role === null) {
    console.log(`\n  ${email} no tiene rol de plataforma. No hay nada que revocar.\n`);
    return;
  }

  /*
   * Salvaguarda contra el peor resultado posible de este script: quedarse sin ninguna cuenta
   * capaz de entrar a `/admin`. No habría forma de arreglarlo desde la aplicación, porque
   * crear cuentas de plataforma exige... una cuenta de plataforma. Se comprueba aquí y no se
   * confía en que quien lo ejecuta lo tenga presente.
   */
  const remaining = await db
    .select({ id: s.users.id })
    .from(s.users)
    .where(isNotNull(s.users.platformRole));

  if (remaining.length <= 1) {
    throw new Error(
      `${email} es la última cuenta de plataforma. Crea otra antes de revocar esta, ` +
        'o nadie podrá volver a entrar a /admin.',
    );
  }

  await db.transaction(async (tx) => {
    await tx.update(s.sessions).set({ revokedAt: new Date() }).where(eq(s.sessions.userId, account.id));
    await tx.delete(s.users).where(eq(s.users.id, account.id));
  });

  console.log(`\n  ✓ ${email} ya no administra la plataforma. Sus sesiones quedaron cerradas.\n`);
}

/**
 * Crea o promueve la cuenta.
 *
 * Es un upsert por correo, no un insert: el correo es la identidad de acceso y ya podría
 * existir. Si existe y pertenece a un cliente, se rechaza en vez de convertirla — mover a
 * alguien del panel de un cliente al de la plataforma es una decisión que nadie debería
 * tomar de rebote al ejecutar un script de alta.
 */
async function grantPlatformAdmin(options: Options): Promise<void> {
  const email = normalizeEmail(options.email);
  if (email === null) {
    throw new Error(`"${options.email}" no tiene forma de correo.`);
  }

  const name = options.name.trim();
  if (name.length === 0) {
    throw new Error('Hace falta un nombre: --name "Tu Nombre".');
  }

  let phone: string | null = null;
  if (options.phone) {
    phone = normalizePhoneNumber(options.phone);
    if (phone === null) {
      throw new Error(`"${options.phone}" no es un teléfono válido.`);
    }
  }

  const [existing] = await db
    .select({
      id: s.users.id,
      role: s.users.platformRole,
      /*
       * Si alcanza algún cliente, es una cuenta de cliente. Antes bastaba mirar
       * `users.client_id`; ahora la pertenencia son filas de `memberships`, así que la
       * pregunta se hace con un EXISTS. La condición es «alguna», del alcance que sea: un
       * visor de un solo evento tampoco debe convertirse en administrador de la plataforma
       * de rebote.
       */
      hasMembership: sql<boolean>`exists (
        select 1 from ${s.memberships} m where m.user_id = ${s.users.id}
      )`,
    })
    .from(s.users)
    .where(eq(s.users.email, email))
    .limit(1);

  if (existing && existing.hasMembership) {
    throw new Error(
      `${email} ya alcanza algún cliente. Usa otro correo: una misma dirección no puede ` +
        'administrar la plataforma y tener acceso como cliente a la vez.',
    );
  }

  if (existing?.role === 'superadmin') {
    console.log(`\n  ${email} ya administra la plataforma. Nada que hacer.\n`);
    return;
  }

  await db
    .insert(s.users)
    .values({ email, name, phone, platformRole: 'superadmin' })
    .onConflictDoUpdate({
      target: s.users.email,
      set: { name, phone, platformRole: 'superadmin' },
    });

  console.log(`\n  ✓ ${email} administra la plataforma.`);
  console.log('    Entra en /acceso y pide tu código.\n');
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));

  if (options.list) {
    await listPlatformAdmins();
    return;
  }

  if (options.revoke) {
    await revokePlatformAdmin(options.revoke);
    return;
  }

  await grantPlatformAdmin(options);
}

main()
  .catch((error: unknown) => {
    console.error('\n✗ Falló\n');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
