import clsx from 'clsx';
import { dayStrip } from '@/domain/invitation/day-strip';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DayMarkShape } from './calendar-parts';
import type { CalendarVariantProps } from './calendar-variant';

/**
 * `calendar.sheet` — la fecha en una tira: el día y el mes escritos arriba, y debajo una sola
 * fila con los tres días anteriores, el del evento marcado en el centro, y los tres siguientes.
 *
 * Es la segunda variante del bloque, y la distancia con la primera no es de estilo:
 *
 *   `month`  el **mes entero**, cuarenta y dos casillas en una lámina de color con cantos
 *            rasgados. Responde a «en qué día de la semana cae» y ocupa media pantalla.
 *   `sheet`  **siete días** en un renglón sobre el papel. Responde a «cuándo es, más o menos»,
 *            que es la pregunta que de verdad se hace quien abre una invitación, y cabe debajo
 *            del saludo sin partir la lectura en dos secciones.
 *
 * Por eso conviven en el catálogo en vez de ser dos versiones de lo mismo: una es un calendario y
 * la otra es una fecha compuesta como si lo fuera. Y por eso `botanical` lleva la lámina —ahí el
 * calendario **es** una sección— y `monochrome` lleva la tira, donde es el remate del saludo.
 *
 * ## La cuenta la hace el dominio
 *
 * `dayStrip` decide qué números salen y cuál va marcado, incluido el caso de la tira que cruza de
 * mes —con el evento el día 2, los tres anteriores son del mes de antes—. Aquí no hay una sola
 * resta: la aritmética del calendario no puede vivir dentro de un componente, por lo mismo que
 * `monthGrid` tampoco lo hace.
 *
 * ## El identificador se quedó con el nombre del primer diseño
 *
 * `sheet` describía una hoja de agenda con el mes entero, que es lo que esta variante fue antes
 * de rehacerse. Renombrar un `registry_id` no es gratis —hay que reapuntar los bloques que lo
 * usan y borrar después, ver `RETIRED_VARIANTS`— y el nombre que se lee en el panel sí está
 * actualizado. La cadena es un identificador, no una descripción.
 *
 * ## Accesibilidad: la tira es decorativa
 *
 * Igual que la retícula de la lámina. Quien escucha la página oye la frase completa que escribió
 * el organizador (`dateLabel`) —«Sábado 12 de junio, 2027»—, no siete números sueltos de los que
 * uno lleva un corazón detrás. La frase va en `sr-only` porque visualmente ya está dicha, partida
 * entre el rótulo de arriba y el año de abajo.
 */
export function CalendarSheet({ content }: CalendarVariantProps) {
  const strip = dayStrip(content.startsAt);

  return (
    <BlockSection block="calendar" variant="sheet">
      <BlockContainer className="max-w-md text-center">
        {content.title && (
          <BlockHeading
            eyebrow={content.eyebrow}
            title={content.title}
            align="center"
            titleFont="script"
            className="mb-10"
          />
        )}

        {/* La fecha completa, para quien escucha. Ver la cabecera. */}
        <p className="sr-only">{content.dateLabel}</p>

        {strip ? (
          <>
            {/*
              «6 de junio», en versalitas espaciadas. Es el rótulo de la tira y se compone del
              instante, no de `dateLabel`: esa frase la escribe el organizador y puede decir
              «Sábado 12 de junio, 2027» —demasiado larga para este renglón— o «El día de nuestra
              boda», que no da ni día ni mes. Lo que la tira necesita son las dos piezas exactas.
            */}
            <p className="m-0 text-[13px] tracking-[0.3em] text-inv-ink uppercase sm:text-[14px]">
              {strip.dayLabel} de {strip.monthLabel}
            </p>

            {/*
              La tira. Los siete van en la misma fila y con el mismo cuerpo; lo único que
              distingue al del evento es la marca detrás y medio punto de peso. `justify-center`
              con casillas de ancho fijo mantiene el marcado exactamente en el eje de la columna,
              que es de lo que vive la composición: si las casillas se dimensionaran a su
              contenido, un «31» junto a un «1» descentraría la fila.
            */}
            <div
              aria-hidden="true"
              className="mt-6 flex items-center justify-center gap-x-1.5 sm:gap-x-2.5"
            >
              {strip.days.map((cell, index) => (
                // El índice como clave y no el número: la tira puede repetir día al cruzar de mes
                // en un caso extremo, y dos claves iguales dejarían a React reconciliando dos
                // casillas distintas como si fueran una.
                <span
                  key={index}
                  className="relative flex size-9 items-center justify-center text-[14px] tabular-nums sm:size-10 sm:text-[15px]"
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

            {/*
              El año y la hora, debajo y pequeños. El año no cabía arriba —«6 de junio de 2027» en
              versalitas con este espaciado se sale de un móvil— y tampoco puede faltar: una fecha
              sin año en una invitación que se reparte con meses de antelación es un dato a medias.
            */}
            <p className="mt-7 mb-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11.5px] tracking-[0.24em] text-inv-ink-soft uppercase">
              <span className="tabular-nums">{strip.year}</span>
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
          /* Sin tira que componer —una fecha que no se deja leer— queda la frase del organizador,
             que es lo que tiene que verse en una invitación ya repartida. */
          <p className="m-0 font-inv-display text-[clamp(1.3rem,4vw,1.7rem)] leading-tight font-light text-inv-ink">
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
