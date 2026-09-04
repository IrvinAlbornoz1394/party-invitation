/**
 * Levanta la base **desde cero** de una sola vez: vacía, crea el esquema, lo puebla y lo audita.
 *
 * **Destructivo y sin vuelta atrás.** Es `db:reset` + `db:migrate` + `db:seed` + `db:check` en ese
 * orden, y existe porque ese orden importa y no se recuerda: `migrate` antes de `reset` deja
 * migraciones «al día» sobre tablas viejas, y `seed` antes de `migrate` falla con un «no existe la
 * relación public.events» que no se parece a su causa. Cuatro comandos que hay que teclear bien y
 * en el orden correcto son cuatro sitios donde equivocarse; uno, no.
 *
 * ## Por qué el esquema se rehace en vez de migrarse
 *
 * Porque no hay ninguna base desplegada que conservar. Mientras eso siga siendo cierto, el
 * historial de migraciones no tiene nada que contar: hay **una sola** —`0000_initial_schema`— y un
 * cambio de esquema se aplica regenerándola con `db:generate` y volviendo a correr esto. Una
 * cadena de migraciones incrementales antes de que exista producción es un historial de
 * decisiones que nadie va a leer y que hay que mantener aplicable para siempre.
 *
 * El día que haya una base con datos de clientes, esto deja de valer: ahí las migraciones se
 * apilan y este comando se queda solo para desarrollo. Está anotado en `docs/BACKEND.md`.
 *
 * ## Deja la base con cero clientes
 *
 * Lo que puebla el seed es el **catálogo** —bloques, variantes, plantillas, temas, planes— y la
 * cuenta de plataforma. `clients`, `events` y todo lo que cuelga de ellos quedan vacías, y así se
 * quedan: no hay un indicador para meter datos de prueba.
 *
 * No hacen falta. Lo que se enseña en `/plantillas` es contenido local de
 * `components/invitation/demo/` y se prerenderiza en el build sin abrir una conexión a Postgres,
 * así que un cliente sembrado no aparece en ninguna de esas páginas — solo ensucia `/admin` con
 * clientes ficticios que no se distinguen de uno real mirando la pantalla. El razonamiento
 * completo está en la cabecera de `scripts/seed.ts`.
 *
 * ## Los roles se comprueban ANTES de borrar
 *
 * `mievento_owner` y `mievento_app` no los crea este comando: viven en el **cluster**, no en la
 * base, y los crea `sql/0000_bootstrap_roles.sql` como superusuario, una vez. `db:migrate` ya
 * comprueba que existan — pero lo comprueba en el paso dos, y para entonces el paso uno ya vació
 * el esquema. El resultado sería una base vacía que no se puede volver a levantar sin acceso de
 * superusuario, que es exactamente el momento en el que uno no lo tiene a mano.
 *
 * Por eso la comprobación se adelanta aquí, contra la misma conexión y antes de tocar nada.
 *
 * ## Por qué llama a los otros cuatro y no repite su código
 *
 * Cada uno se sigue pudiendo correr suelto —`db:migrate` en un despliegue, `db:check` en CI— y
 * duplicar su contenido aquí garantizaría que un día dejen de hacer lo mismo. Se lanzan como
 * procesos hijo con `node --import tsx` y no importándolos: los cuatro crean su propio pool y
 * llaman a `main()` al cargarse, así que un `import` los ejecutaría en el orden de los imports y
 * sin poder parar la cadena cuando uno falla.
 */
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import { Pool } from 'pg';

loadDotenv({ path: ['.env.local', '.env'], quiet: true });

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const url = process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL;

if (!url) {
  console.error('Falta DATABASE_MIGRATION_URL (o DATABASE_URL). Copia .env.example a .env.local.');
  process.exit(1);
}

const { hostname, pathname } = new URL(url);
const target = `${hostname}${pathname}`;

if (!process.argv.includes('--force')) {
  console.error(
    `\n✗ Esto REHACE la base entera en ${target}: borra todas las tablas de "public",\n` +
      '  incluidas las cuentas, los eventos y las sesiones abiertas, y la vuelve a levantar\n' +
      '  con el catálogo y sin ningún cliente. Si estás seguro:\n\n' +
      '    npm run db:fresh -- --force\n',
  );
  process.exit(1);
}

/** Los roles del cluster que el bootstrap crea una vez y que este comando no puede crear. */
const REQUIRED_ROLES = ['mievento_owner', 'mievento_app'] as const;

/**
 * Comprueba lo que no se puede arreglar después de haber borrado.
 *
 * Solo los roles. Todo lo demás que pueda fallar —una tabla que no se deja borrar, un SQL de
 * seguridad con un error— falla dejando la base a medias, y eso se arregla corriendo esto otra
 * vez. La falta de un rol, no: sin `mievento_owner` no hay con quién volver a crear el esquema.
 */
async function preflight(): Promise<void> {
  const pool = new Pool({ connectionString: url, max: 1 });

  try {
    const { rows } = await pool.query<{ rolname: string }>(
      'select rolname from pg_roles where rolname = any($1::text[])',
      [[...REQUIRED_ROLES]],
    );

    const found = new Set(rows.map((row) => row.rolname));
    const missing = REQUIRED_ROLES.filter((role) => !found.has(role));

    if (missing.length > 0) {
      throw new Error(
        `Faltan los roles de Postgres: ${missing.join(', ')}.\n\n` +
          'No se ha borrado nada. Ejecuta primero el bootstrap como superusuario:\n' +
          '  psql -U postgres -d mievento -f src/infrastructure/db/sql/0000_bootstrap_roles.sql\n\n' +
          '(recuerda cambiar las contraseñas del archivo antes de correrlo)',
      );
    }
  } finally {
    await pool.end();
  }
}

/** Las cuatro fases, en el único orden en que funcionan. */
const PHASES: readonly { title: string; script: string; args: readonly string[] }[] = [
  { title: 'Vaciando el esquema', script: 'reset.ts', args: ['--force'] },
  { title: 'Creando el esquema y la seguridad', script: 'migrate.ts', args: [] },
  { title: 'Poblando el catálogo', script: 'seed.ts', args: [] },
  { title: 'Auditando el aislamiento entre clientes', script: 'check-rls.ts', args: [] },
];

/**
 * Lanza uno de los scripts y devuelve su código de salida.
 *
 * `stdio: 'inherit'` para que su salida sea la de este comando y no un bloque de texto capturado
 * y vuelto a imprimir al final: la parte lenta es el seed, y verlo avanzar es lo que distingue
 * «está trabajando» de «se colgó».
 */
function run(script: string, args: readonly string[]): number {
  const result = spawnSync(
    process.execPath,
    ['--import', 'tsx', resolve(projectRoot, 'scripts', script), ...args],
    { stdio: 'inherit', cwd: projectRoot },
  );

  if (result.error) throw result.error;

  /* `status` es null cuando el proceso murió por una señal —un Ctrl-C, por ejemplo—, y eso no es
     un éxito: se trata como fallo para que la cadena pare. */
  return result.status ?? 1;
}

async function main(): Promise<void> {
  console.log(`\n▸ Rehaciendo la base desde cero en ${target}\n`);

  await preflight();

  for (const [index, phase] of PHASES.entries()) {
    console.log(`── [${index + 1}/${PHASES.length}] ${phase.title} ${'─'.repeat(30)}`);

    const status = run(phase.script, phase.args);

    if (status !== 0) {
      console.error(
        `\n✗ Falló en «${phase.title}».\n\n` +
          '  La base queda a medias. Corregido el problema, vuelve a correr el comando entero:\n' +
          '  es idempotente desde el principio y no hay que reconstruir el estado a mano.\n',
      );
      process.exit(status);
    }

    console.log('');
  }

  console.log('✓ Base lista desde cero: esquema, seguridad y catálogo. Cero clientes.');
  console.log('  Entra por /acceso con el correo de la cuenta de plataforma.\n');
}

main().catch((error: unknown) => {
  console.error('\n✗ No se pudo rehacer la base\n');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
