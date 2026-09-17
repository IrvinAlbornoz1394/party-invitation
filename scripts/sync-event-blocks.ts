/**
 * Añade a cada evento los bloques que su plantilla tiene y él todavía no.
 *
 * ## Por qué hace falta
 *
 * La composición de un evento se **copia** de su plantilla al darlo de alta, y a partir de ahí las
 * dos vidas son independientes: eso es lo correcto —el admin puede reordenar bloques y cambiar
 * variantes, y una plantilla que cambie no debe deshacerle el trabajo a nadie—, pero tiene una
 * consecuencia que se nota el día que el catálogo crece. Cuando `editorial`, `cinematic` y `silk`
 * estrenaron sección de fecha, sus plantillas la ganaron y los eventos ya creados con ellas se
 * quedaron sin ella: no por un fallo, sino porque su copia se hizo antes de que existiera.
 *
 * Sin esto, las salidas eran dos y las dos malas: borrar y volver a crear el evento —perdiendo el
 * contenido que su cliente ya capturó— o meter la fila a mano en SQL, inventándose la variante,
 * la posición y la configuración.
 *
 * ## Qué hace, y sobre todo qué NO hace
 *
 * - **Solo añade.** Un bloque que el evento tiene y la plantilla no se queda donde está: puede
 *   habérselo añadido el admin a propósito, y quitarlo sería borrar una sección de una invitación
 *   que quizá ya está repartida.
 * - **No cambia variantes ni textos.** Un evento que cambió su galería sigue con la suya, aunque
 *   la plantilla ahora traiga otra por defecto.
 * - **No reordena.** Cada bloque nuevo entra en la posición que ocupa en su plantilla y empuja
 *   hacia abajo a los que estaban de ahí en adelante; el orden relativo de lo que ya había se
 *   conserva intacto, que es lo que el plan Plus vende poder tocar.
 * - **Respeta el plan.** `is_enabled` se calcula con la misma expresión que el alta de eventos
 *   (`DrizzleEventRepository.create`): un bloque cuya funcionalidad no entra en el plan vendido, o
 *   cuya variante exige uno superior, nace **apagado** en vez de omitirse — así, quien suba de
 *   plan solo tiene que encenderlo.
 *
 * Es idempotente: en la segunda pasada no encuentra nada que añadir y no escribe nada.
 *
 * ## Por qué es un script y no una migración
 *
 * Porque no cambia el esquema, y porque no es una corrección de una sola vez: vuelve a hacer
 * falta cada vez que una plantilla del catálogo gane un bloque. Una migración se aplica una vez
 * y queda escrita en la historia; esto es mantenimiento del catálogo, como el propio seed.
 *
 * Uso: `npm run db:sync-blocks` (y `-- --dry` para ver qué haría sin escribir nada).
 */
import { config as loadDotenv } from 'dotenv';
import { Pool } from 'pg';

loadDotenv({ path: ['.env.local', '.env'], quiet: true });

const url = process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL;

if (!url) {
  console.error('Falta DATABASE_MIGRATION_URL (o DATABASE_URL).');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry');
const pool = new Pool({ connectionString: url, max: 1 });

/** Un bloque que la plantilla de un evento tiene y el evento no. */
interface MissingBlock {
  readonly eventId: string;
  readonly eventTitle: string;
  readonly templateKey: string;
  readonly blockKey: string;
  readonly registryId: string;
  readonly position: number;
}

/**
 * Los huecos, ya calculados por la base de datos.
 *
 * Se pregunta por todos los eventos de una vez y no evento a evento: la comparación es entre dos
 * tablas y Postgres la hace mejor que un bucle con una consulta por fila.
 */
async function findMissing(): Promise<readonly MissingBlock[]> {
  const { rows } = await pool.query<MissingBlock>(
    `select e.id            as "eventId",
            e.title         as "eventTitle",
            t.key           as "templateKey",
            tb.block_key    as "blockKey",
            cv.registry_id  as "registryId",
            tb.position     as position
       from public.events e
       join public.templates t on t.id = e.template_id
       join public.template_blocks tb on tb.template_id = e.template_id
       join public.component_variants cv on cv.id = tb.default_variant_id
      where not exists (
              select 1
                from public.event_blocks eb
               where eb.event_id = e.id
                 and eb.block_key = tb.block_key)
      order by e.created_at, tb.position`,
  );

  return rows;
}

/**
 * Mete un bloque en su sitio: primero abre el hueco, después inserta.
 *
 * Las dos cosas en la misma transacción. A medias dejaría las posiciones con un salto —inocuo,
 * porque solo se usan para ordenar— o dos bloques compartiendo número, que se resolvería por el
 * orden en que Postgres los devuelva, es decir por ninguno.
 */
async function insertBlock(block: MissingBlock): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('begin');

    /* `>=` y no `>`: el bloque nuevo se queda con esa posición y quien la tenía baja. Es lo que
       coloca el calendario de `cinematic` entre el relato y el programa, y no detrás de los dos.
       No hay índice único sobre (event_id, position), así que el desplazamiento no necesita la
       pasada por números negativos que sí hacen las colecciones del evento. */
    await client.query(
      `update public.event_blocks
          set position = position + 1, updated_at = now()
        where event_id = $1::uuid and position >= $2`,
      [block.eventId, block.position],
    );

    /* La misma expresión de `is_enabled` que el alta de eventos. Está copiada y no compartida
       —son dos capas distintas y este script no importa el repositorio— así que si aquella
       cambia, esta hay que cambiarla: por eso está señalado en las dos. */
    await client.query(
      `insert into public.event_blocks
         (event_id, client_id, block_key, variant_id, position, is_enabled, config)
       select e.id,
              e.client_id,
              tb.block_key,
              tb.default_variant_id,
              tb.position,
              coalesce(pf.is_included, b.feature_key is null) and cv.min_plan_rank <= p.rank,
              tb.default_config
         from public.events e
         join public.template_blocks tb
           on tb.template_id = e.template_id and tb.block_key = $2
         join public.blocks b on b.key = tb.block_key
         join public.component_variants cv on cv.id = tb.default_variant_id
         join public.plans p on p.key = e.plan_key
         left join public.plan_features pf
           on pf.plan_key = p.key and pf.feature_key = b.feature_key
        where e.id = $1::uuid`,
      [block.eventId, block.blockKey],
    );

    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

async function main(): Promise<void> {
  const missing = await findMissing();

  if (missing.length === 0) {
    console.log('✓ Todos los eventos tienen los bloques de su plantilla. Nada que hacer.');

    return;
  }

  console.log(`▸ ${missing.length} bloque(s) por añadir\n`);

  for (const block of missing) {
    console.log(
      `  ${block.eventTitle} · ${block.templateKey} → ${block.blockKey} (${block.registryId}) en la posición ${block.position}`,
    );

    if (!dryRun) await insertBlock(block);
  }

  console.log(
    dryRun
      ? '\n· Simulación: no se escribió nada. Quita `--dry` para aplicarlo.'
      : '\n✓ Listo. Los bloques nuevos nacen con el texto por defecto de su plantilla.',
  );
}

main()
  .catch((error: unknown) => {
    console.error('\n✗ La sincronización falló\n');
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
