import clsx from 'clsx';
import { eventWeek } from '@/domain/invitation/month-grid';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DayMarkShape } from './calendar-parts';
import type { CalendarVariantProps } from './calendar-variant';

/**
 * `calendar.week` — el mes en letras vaciadas y debajo **la semana del evento**, con las
 * iniciales de los días y el señalado marcado donde de verdad cae.
 *
 * Es la tercera variante del bloque, y las tres responden a preguntas distintas —por eso conviven
 * en vez de sobrar dos—:
 *
 *   `month`  el mes entero en una lámina de color. «¿Cómo se reparte el mes?»
 *   `sheet`  tres días antes y tres después, con el evento en el centro. «¿Cuándo es, más o
 *            menos?»
 *   `week`   **la semana real**, rotulada. «¿Cae en fin de semana? ¿Pido el viernes libre?»
 *
 * La distancia con `sheet` parece pequeña —las dos pintan siete casillas— y no lo es. Aquella
 * centra el día del evento, así que no puede decir de qué día de la semana se trata: sus siete
 * casillas son «el entorno» y no una semana. Esta coloca el día **donde cae**, que puede ser el
 * primero o el último de la fila, y por eso puede poner las iniciales encima. Para quien tiene
 * que pedir el día en el trabajo, esa es toda la información.
 *
 * La cuenta la hace `eventWeek`, en el dominio, incluido el caso de la semana que cruza de mes.
 * Aquí no hay una sola resta.
 *
 * ## El rótulo es el mes, y va vaciado
 *
 * A cuerpo de cartel y con el contorno haciendo de letra, como el resto de los rótulos de esta
 * estructura. No se usa `BlockHeading` porque lo que va en grande no es el título del bloque sino
 * **el nombre del mes**, que sale del instante y no del contenido: el `title` que escriba el
 * organizador se pinta encima y pequeño, si lo hay.
 */
export function CalendarWeek({ content }: CalendarVariantProps) {
  const week = eventWeek(content.startsAt, content.weekStartsOn);

  return (
    <BlockSection block="calendar" variant="week">
      <BlockContainer className="max-w-md text-center">
        {content.eyebrow && (
          <p className="m-0 text-[10.5px] tracking-[0.28em] text-inv-accent uppercase">
            {content.eyebrow}
          </p>
        )}

        {content.title && (
          <p className="mt-4 mb-0 text-[14px] leading-snug text-inv-ink-soft">{content.title}</p>
        )}

        {/* La fecha completa, para quien escucha. La semana de abajo es decorativa: siete números
            sueltos con una inicial encima no comunican «el sábado 12 de junio». */}
        <p className="sr-only">{content.dateLabel}</p>

        {week ? (
          <>
            <p
              aria-hidden="true"
              className={clsx(
                'inv-outline-text mb-0 font-inv-display text-[clamp(2.6rem,13vw,4.5rem)] leading-none font-semibold tracking-[0.06em] text-inv-primary uppercase',
                content.title || content.eyebrow ? 'mt-6' : 'mt-0',
              )}
            >
              {week.monthLabel}
            </p>

            {/*
              La semana. Las casillas tienen ancho fijo para que las iniciales caigan a plomo
              sobre sus números: dimensionadas al contenido, un «31» empujaría su columna y la
              retícula dejaría de ser una semana para ser una lista de números.
            */}
            <div aria-hidden="true" className="mt-8">
              <div className="flex items-center justify-center gap-x-1 sm:gap-x-2">
                {week.days.map((cell, index) => (
                  // El índice como clave, y aquí es obligatorio: hay dos «M» —martes y miércoles—
                  // y dos claves iguales dejarían a React reconciliando dos columnas distintas
                  // como si fueran una.
                  <span
                    key={index}
                    className="w-9 text-center text-[10px] tracking-[0.14em] text-inv-ink-soft uppercase sm:w-10"
                  >
                    {cell.initial}
                  </span>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-center gap-x-1 sm:gap-x-2">
                {week.days.map((cell, index) => (
                  <span
                    key={index}
                    className="relative flex h-10 w-9 items-center justify-center text-[15px] tabular-nums sm:w-10 sm:text-[16px]"
                  >
                    {cell.isEvent && <DayMarkShape mark={content.dayMark} className="size-9" />}
                    <span
                      className={clsx(
                        'relative',
                        cell.isEvent ? 'font-medium text-inv-ink' : 'text-inv-ink-soft',
                      )}
                    >
                      {cell.day}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <p className="mt-8 mb-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12px] tracking-[0.2em] text-inv-ink uppercase">
              <span className="tabular-nums">{week.year}</span>
              {content.timeLabel && (
                <>
                  <span aria-hidden="true" className="opacity-60">
                    ·
                  </span>
                  <span className="tabular-nums">{content.timeLabel}</span>
                </>
              )}
            </p>
          </>
        ) : (
          /* Sin semana que componer, la frase del organizador: es lo que tiene que verse en una
             invitación ya repartida. */
          <p className="mt-6 mb-0 font-inv-display text-[clamp(1.4rem,4.5vw,2rem)] leading-tight font-medium text-inv-primary">
            {content.dateLabel}
          </p>
        )}

        {content.note && (
          <BlockNote note={content.note} className="mx-auto mt-8 max-w-sm text-center" />
        )}
      </BlockContainer>
    </BlockSection>
  );
}
