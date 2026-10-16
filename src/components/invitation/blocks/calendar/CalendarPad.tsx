import clsx from 'clsx';
import { eventDateParts } from '@/domain/invitation/event-date';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { DayMarkShape } from './calendar-parts';
import type { CalendarVariantProps } from './calendar-variant';

/**
 * `calendar.pad` — la fecha en una **hoja de taco**: una pila de hojas apoyada sobre el papel, con
 * el mes en la cabecera de color, la línea de troquel debajo y la cifra del día en el centro.
 *
 * Es la séptima variante del bloque y la única que es **un objeto**. Las seis anteriores son
 * composiciones sobre la página —una lámina de color, una tira, una semana, un renglón de
 * tipografía, una escala, una esfera—; esta es una cosa que se puede coger, con su canto, su
 * sombra, sus hojas de debajo asomando y la perforación por donde se arranca la de hoy.
 *
 * ## Por qué esta le toca a `silk`
 *
 * Porque esa estructura se arma **por planos**: casi cada sección es una pieza de papel apoyada
 * sobre otra cosa —la portada es una tarjeta encima de la fotografía, el relato una copia montada,
 * el dress code y los detalles son pilas de fichas—. El calendario se había quedado fuera de esa
 * plantilla por falta de una variante que compusiera así, y ninguna de las seis lo hacía: todas
 * son tinta sobre la página, y una de ellas —la lámina de color de `calendar.month`— habría metido
 * la única franja a sangre de una invitación que no tiene ninguna.
 *
 * La pila, además, dice algo que a esta plantilla le sirve: un taco es tiempo que se arranca. La
 * hoja de arriba es el día, y debajo hay más.
 *
 * ## Por qué no dibuja el mes
 *
 * Un taco de sobremesa enseña **un día**, y esa es exactamente la diferencia con `calendar.band`,
 * que es la otra variante sin retícula: aquella compone la fecha como tipografía a cuerpo de
 * cartel —tres datos en un renglón entre filetes, para leerse desde el otro lado de la
 * habitación—; esta la mete dentro de un objeto pequeño y centrado, que es lo que se mira de
 * cerca. Una es un rótulo y la otra es papelería.
 *
 * ## El rótulo de la sección no repite el mes
 *
 * Cuando el evento no trae `title`, esta variante **no** pinta el nombre del mes como respaldo,
 * que es lo que hacen `calendar.month` y `calendar.scale`. Aquí el mes ya está escrito en la
 * cabecera de la hoja, y ponerlo otra vez encima dejaría la misma palabra dos veces en cuatro
 * centímetros. Sin título, la sección abre con el rótulo pequeño y la pila.
 *
 * ## Accesibilidad
 *
 * La pila es decorativa y la fecha se anuncia con la frase que escribió el organizador
 * (`dateLabel`), como en las seis anteriores: «Junio 2027 / Sábado / 12 / 5:00 PM» leído en voz
 * alta son cuatro fragmentos sueltos, no una fecha.
 */
export function CalendarPad({ content }: CalendarVariantProps) {
  const parts = eventDateParts(content.startsAt);
  // Sin rótulo ni título no hay cabecera: la hoja arranca arriba, sin el margen que la separaba.
  const hasHeading = hasText(content.eyebrow) || hasText(content.title);

  return (
    <BlockSection block="calendar" variant="pad">
      <BlockContainer className="max-w-md text-center">
        {hasText(content.eyebrow) && (
          <p className="m-0 text-[10.5px] tracking-[0.3em] text-inv-accent uppercase">
            {content.eyebrow}
          </p>
        )}

        {/* Ver la cabecera: sin título propio no se pinta el mes, que ya está en la hoja. */}
        {hasText(content.title) && (
          <p
            className={clsx(
              'mb-0 font-inv-display text-[clamp(1.5rem,4vw,2.1rem)] leading-tight font-light text-inv-primary',
              hasText(content.eyebrow) ? 'mt-4' : 'mt-0',
            )}
          >
            {content.title}
          </p>
        )}

        {/* La fecha completa, para quien escucha. Ver la cabecera. */}
        <p className="sr-only">{content.dateLabel}</p>

        {parts ? (
          <div
            aria-hidden="true"
            className={clsx('relative mx-auto w-full max-w-[16.5rem]', hasHeading && 'mt-12')}
          >
            {/*
              Las hojas de debajo. Van desplazadas hacia abajo y a la derecha y **sin contenido**:
              lo único que tienen que hacer es asomar por dos cantos para que la de arriba se lea
              como la primera de una pila. Con `inset-0` copian su tamaño, así que la pila no
              descuadra si el día pasa de una cifra a dos.
            */}
            <span className="absolute inset-0 translate-x-[7px] translate-y-[7px] rounded-inv-md border border-inv-line bg-inv-surface" />
            <span className="absolute inset-0 translate-x-[3.5px] translate-y-[3.5px] rounded-inv-md border border-inv-line bg-inv-surface" />

            <div className="relative overflow-hidden rounded-inv-md border border-inv-line bg-inv-surface shadow-inv-soft">
              {/* La cabecera. Es la única mancha de color de la pieza, y por eso lleva el mes: es
                  el dato que ordena a los otros dos. */}
              <p className="m-0 bg-inv-primary px-5 py-3 text-[11px] tracking-[0.3em] text-inv-on-primary uppercase">
                {parts.month} <span className="tabular-nums">{parts.year}</span>
              </p>

              {/*
                El troquel: una línea de puntos justo debajo de la cabecera, que es donde se
                arranca la hoja de un taco. Va como borde discontinuo de un elemento sin altura y
                no como un adorno dibujado, porque tiene que medir exactamente el ancho de la
                hoja —un SVG habría que reescalarlo cada vez que cambie el tope de ancho—.
              */}
              <span className="block border-t border-dashed border-inv-line" />

              <div className="px-6 py-8">
                <p className="m-0 text-[10.5px] tracking-[0.28em] text-inv-ink-soft uppercase">
                  {parts.weekday}
                </p>

                {/*
                  La cifra, con la marca del día detrás. Es la misma pieza que en las otras seis
                  variantes (`calendar-parts.tsx`): la forma —corazón, disco o aro— la elige el
                  organizador, y si cada calendario dibujara la suya, cambiar de variante en el
                  panel le cambiaría también la que ya había elegido.
                */}
                <span className="relative mx-auto mt-3 flex size-28 items-center justify-center">
                  <DayMarkShape mark={content.dayMark} className="size-28" />
                  <span className="relative font-inv-display text-[clamp(3.6rem,18vw,4.6rem)] leading-none font-light text-inv-ink tabular-nums">
                    {parts.day}
                  </span>
                </span>

                {hasText(content.timeLabel) && (
                  <p className="mx-auto mt-6 mb-0 w-fit border-t border-inv-line pt-3 text-[11px] tracking-[0.26em] text-inv-ink uppercase tabular-nums">
                    {content.timeLabel}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Sin hoja que componer —una fecha que no se deja leer—, la frase del organizador: es lo
             que tiene que verse en una invitación ya repartida. */
          <p
            className={clsx(
              'mb-0 font-inv-display text-[clamp(1.5rem,5vw,2.2rem)] leading-tight font-light text-inv-ink',
              hasHeading ? 'mt-10' : 'mt-0',
            )}
          >
            {content.dateLabel}
          </p>
        )}

        {hasText(content.note) && (
          <BlockNote note={content.note} className="mx-auto mt-12 max-w-sm text-center" />
        )}
      </BlockContainer>
    </BlockSection>
  );
}
