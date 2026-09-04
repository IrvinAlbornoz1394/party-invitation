import { eventDateParts } from '@/domain/invitation/event-date';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import type { CalendarVariantProps } from './calendar-variant';

/**
 * `calendar.band` — la fecha en una banda grabada: el mes encima, y debajo el día de la semana, la
 * cifra a cuerpo de cartel y el año, separados por dos filetes.
 *
 * Es la cuarta variante del bloque y la única **sin retícula**. Las otras tres dibujan casillas
 * —el mes entero, una tira de siete, la semana— y las tres contestan «qué día de la semana cae» o
 * «cuándo es, más o menos». Esta no dibuja ninguna: compone la fecha como un dato tipográfico, y
 * lo que gana a cambio es **peso**. La cifra del día ocupa la mitad de la sección, así que la
 * fecha se lee desde el otro lado de la habitación, que es lo que pide una invitación formal
 * donde el día es la información.
 *
 * Que un calendario no tenga calendario no es una contradicción: el bloque guarda un instante y
 * cada variante decide cómo se enseña. `CalendarMonth` ya hacía exactamente esto cuando la fecha
 * no se dejaba leer y no había retícula que pintar — aquí es la composición y no el respaldo.
 *
 * ## Las tres piezas salen del instante, no de la frase
 *
 * `dateLabel` es lo que escribió el organizador y puede decir cualquier cosa; el día de la
 * semana, la cifra y el año se sacan de `startsAt` con el partidor del dominio. La frase se
 * conserva **para quien escucha la página**: los tres fragmentos sueltos y en tres tamaños no se
 * leen en voz alta como una fecha.
 *
 * ## Los filetes van a los lados de la cifra y no debajo
 *
 * Es lo que convierte tres datos en una sola pieza. Con la cifra suelta entre dos palabras, la
 * banda se lee como tres renglones apilados; con los filetes verticales, como un escudo. Y son
 * cortos —no cruzan la sección— porque un filete a todo el ancho volvería a partirla en dos.
 */
export function CalendarBand({ content }: CalendarVariantProps) {
  const parts = eventDateParts(content.startsAt);

  return (
    <BlockSection block="calendar" variant="band">
      <BlockContainer className="max-w-sm text-center">
        {content.eyebrow && (
          <p className="m-0 text-[10.5px] tracking-[0.3em] text-inv-accent uppercase">
            {content.eyebrow}
          </p>
        )}

        {content.title && (
          <p className="mt-4 mb-0 font-inv-script text-[clamp(1.8rem,7vw,2.4rem)] leading-none text-inv-accent">
            {content.title}
          </p>
        )}

        {/* La fecha completa, para quien escucha. Ver la cabecera. */}
        <p className="sr-only">{content.dateLabel}</p>

        {parts ? (
          <div aria-hidden="true" className="mt-8">
            <p className="m-0 text-[12px] tracking-[0.34em] text-inv-ink uppercase">
              {parts.month}
            </p>

            <div className="mt-4 flex items-center justify-center gap-5 sm:gap-7">
              <span className="flex-1 text-right text-[11px] tracking-[0.24em] text-inv-ink-soft uppercase">
                {parts.weekday}
              </span>

              {/* La cifra, entre sus dos filetes. `leading-none` y `tabular-nums`: es el número
                  más grande de la invitación y cualquier holgura de línea lo descentra respecto
                  de las dos palabras que lo flanquean. */}
              <span className="border-x border-inv-accent/50 px-5 font-inv-display text-[clamp(3rem,15vw,4.5rem)] leading-none font-light text-inv-ink tabular-nums sm:px-7">
                {parts.day}
              </span>

              <span className="flex-1 text-left text-[11px] tracking-[0.24em] text-inv-ink-soft uppercase tabular-nums">
                {parts.year}
              </span>
            </div>
          </div>
        ) : (
          <p className="mt-8 mb-0 font-inv-display text-[clamp(1.5rem,5vw,2.2rem)] leading-tight font-light text-inv-ink">
            {content.dateLabel}
          </p>
        )}

        {content.timeLabel && (
          <p className="mt-7 mb-0 text-[12px] tracking-[0.26em] text-inv-accent uppercase tabular-nums">
            {content.timeLabel}
          </p>
        )}

        {content.note && (
          <BlockNote note={content.note} className="mx-auto mt-8 max-w-sm text-center" />
        )}
      </BlockContainer>
    </BlockSection>
  );
}
