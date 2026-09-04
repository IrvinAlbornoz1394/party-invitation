/**
 * Regenera la migración **única** a partir del esquema de Drizzle.
 *
 * Borra `src/infrastructure/db/migrations/` entera y la vuelve a escribir, así que después de
 * esto siempre hay exactamente un archivo: `0000_initial_schema.sql`. No es lo que hace
 * `drizzle-kit generate` por su cuenta —aquello añade `0001`, `0002`… encima de lo que haya— y la
 * diferencia es deliberada.
 *
 * ## Por qué una sola y no una cadena
 *
 * Porque **no hay ninguna base desplegada que conservar**. Una migración incremental existe para
 * llevar una base que ya tiene datos de un estado al siguiente sin perderlos; mientras la única
 * base sea la de desarrollo, ese trabajo no lo aprovecha nadie y el coste es real: cada `0001` que
 * se acumula hay que mantenerlo aplicable para siempre, y el esquema deja de poder leerse de un
 * tirón porque está repartido en un archivo por decisión.
 *
 * Con una sola, el archivo **es** el esquema: se abre y se lee lo que hay, no la historia de cómo
 * llegó a ser eso. Y rehacer la base es `npm run db:fresh`, que tarda lo mismo.
 *
 * ## Cuándo deja de valer esto
 *
 * El día que haya una base en producción con datos de clientes. A partir de ahí `0000` es
 * intocable —Drizzle lleva su hash en `__drizzle_migrations` y una base que ya la aplicó
 * rechazaría la versión reescrita— y los cambios pasan a ser `0001`, `0002`… de verdad. Ese día
 * este script se borra y `db:generate` vuelve a ser `drizzle-kit generate` a secas.
 *
 * Hasta entonces no hay riesgo silencioso: si alguien corriera esto contra un esquema ya
 * desplegado, `db:migrate` fallaría al intentar crear tablas que ya existen. Falla ruidoso, no
 * corrupción.
 *
 * ## Por qué se borra la carpeta y no solo el `.sql`
 *
 * `meta/_journal.json` y `meta/0000_snapshot.json` son el estado desde el que `drizzle-kit`
 * calcula la diferencia. Dejando el snapshot viejo, la regeneración compara contra él y produce
 * una migración con **solo los cambios** —que es justo lo contrario de lo que se busca— y con el
 * journal intacto la numeraría como `0001`.
 */
import { spawnSync } from 'node:child_process';
import { readdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = resolve(projectRoot, 'src/infrastructure/db/migrations');
const drizzleKit = resolve(projectRoot, 'node_modules/drizzle-kit/bin.cjs');

async function main(): Promise<void> {
  console.log('▸ Borrando la migración anterior…');
  await rm(migrationsDir, { recursive: true, force: true });

  console.log('▸ Regenerando desde el esquema…\n');

  const result = spawnSync(
    process.execPath,
    [drizzleKit, 'generate', '--name=initial_schema'],
    { stdio: 'inherit', cwd: projectRoot },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);

  /*
   * Se comprueba el resultado en lugar de darlo por hecho. `drizzle-kit` puede terminar con
   * código 0 sin escribir nada —por ejemplo si no encuentra el esquema—, y una carpeta de
   * migraciones vacía no se nota hasta que `db:migrate` deja la base sin una sola tabla.
   */
  const written = (await readdir(migrationsDir)).filter((name) => name.endsWith('.sql'));

  if (written.length !== 1) {
    throw new Error(
      `Se esperaba exactamente una migración y hay ${written.length}: ${written.join(', ') || '(ninguna)'}`,
    );
  }

  console.log(`\n✓ Migración única: ${written[0]}`);
  console.log('  Siguiente paso: npm run db:fresh -- --force\n');
}

main().catch((error: unknown) => {
  console.error('\n✗ No se pudo regenerar la migración\n');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
