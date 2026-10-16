import clsx from 'clsx';
import { monthSpan } from '@/domain/invitation/month-grid';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { DayMarkShape } from './calendar-parts';
import type { CalendarVariantProps } from './calendar-variant';

/**
 * `calendar.dial` — el mes en una **esfera**: una marca por día alrededor de un aro, el arco
 * recorrido hasta el día señalado trazado en el color de acento, y la fecha en el centro.
 *
 * Es la sexta variante del bloque y la única **circular**. Las cinco anteriores son rectas —una
 * retícula, una tira, una semana, un renglón de tipografía, una escala graduada—, y esa es la
 * distancia que la justifica: no es otra forma de alinear días, es otra geometría.
 *
 * ## Por qué esta le toca a `cinematic`
 *
 * Porque esa estructura compone por planos y no por página: fotografías a sangre, muy poco texto
 * por vista y una idea por pantalla. Un calendario de números pequeños es exactamente lo
 * contrario, así que aquí el mes se convierte en **una sola figura** que ocupa la pantalla y se
 * lee de un vistazo desde lejos —el aro es el mes, el arco es lo que va recorrido, la cifra del
 * centro es el día—. La lectura fina no está: es lo que esta plantilla cambia por el plano.
 *
 * Y la figura rima con el material de la estructura: un aro graduado con su arco encendido es un
 * diafragma, y esta es la plantilla que encuadra.
 *
 * ## El reparto es el de una circunferencia, y por eso lo hace la variante
 *
 * `monthSpan` da la longitud del mes y el día, no la fracción. Aquí el principio y el final son
 * **el mismo punto**, así que el mes se reparte en `longitud` tramos y no en `longitud − 1`: con
 * el reparto de una recta —el de `calendar.scale`—, el último día del mes se dibujaría encima del
 * primero y el arco daría la vuelta completa. Que las dos variantes repartan distinto no es una
 * incoherencia: es que una recta tiene dos extremos y un aro no tiene ninguno.
 *
 * El cero está **arriba** (`rotate(-90)` en el arco, `angle − 90` en las marcas), que es donde lo
 * busca cualquiera que haya visto una esfera.
 *
 * ## La cifra va en el centro y no en su marca del aro
 *
 * Pegada a su marca sería la única cifra del dibujo, girada respecto de todo lo demás y a un
 * cuerpo que en un móvil no se lee. En el centro es el dato que la sección viene a dar, y el aro
 * queda de escala: dice **cuánto mes** hay antes y después sin tener que numerar nada.
 *
 * ## Accesibilidad: la esfera es decorativa
 *
 * Como en las cinco anteriores. Quien escucha la página oye la frase que escribió el organizador
 * (`dateLabel`), no treinta marcas y un arco.
 */

/** El radio del aro dentro del lienzo de 200×200, y el perímetro que sale de él. */
const RING_RADIUS = 88;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

export function CalendarDial({ content }: CalendarVariantProps) {
  const span = monthSpan(content.startsAt);
  // Sin rótulo ni título no hay cabecera: la esfera arranca arriba, sin el margen que la separaba.
  const hasHeading = hasText(content.eyebrow) || hasText(content.title);

  /* La parte del aro que queda detrás del día señalado. Ver la cabecera: el reparto de una
     circunferencia. */
  const travelled = span ? (span.day - 1) / span.length : 0;

  return (
    <BlockSection block="calendar" variant="dial">
      <BlockContainer className="max-w-xl text-center">
        {hasText(content.eyebrow) && (
          <p className="m-0 text-[10.5px] tracking-[0.3em] text-inv-accent uppercase">
            {content.eyebrow}
          </p>
        )}

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

        {span ? (
          /*
            La esfera. Cuadrada y con tope en el ancho de la pantalla: es la pieza que tiene que
            llenar la vista en esta plantilla, pero un círculo que ocupe el ancho completo de un
            móvil deja el aro pegado al canto y pierde el aire que lo hace leerse como un objeto.
          */
          <div
            className={clsx(
              'relative mx-auto aspect-square w-full max-w-[min(80vw,25rem)]',
              hasHeading && 'mt-12',
            )}
          >
            <svg viewBox="0 0 200 200" aria-hidden="true" className="absolute inset-0 size-full">
              {/* El aro, del color de la línea del tema. */}
              <circle
                cx="100"
                cy="100"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="0.75"
                className="stroke-inv-line"
              />

              {/*
                El arco recorrido. Se dibuja con el trazo discontinuo del propio aro —un guion tan
                largo como la parte recorrida y un hueco tan largo como el resto— en lugar de con
                una ruta calculada: es la misma circunferencia, así que no puede quedar
                desalineada del aro ni por un píxel, y no hay una sola función trigonométrica que
                revisar.
              */}
              <circle
                cx="100"
                cy="100"
                r={RING_RADIUS}
                fill="none"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeDasharray={`${RING_LENGTH * travelled} ${RING_LENGTH}`}
                transform="rotate(-90 100 100)"
                className="stroke-inv-accent"
              />

              {Array.from({ length: span.length }, (_, index) => {
                const day = index + 1;
                const isEvent = day === span.day;

                return (
                  <line
                    key={day}
                    x1="100"
                    y1={100 - RING_RADIUS}
                    x2="100"
                    /* Las marcas crecen hacia dentro: hacia fuera se saldrían del lienzo en las
                       cuatro puntas y habría que encoger el aro para nada. */
                    y2={100 - RING_RADIUS + (isEvent ? 16 : day % 5 === 0 ? 10 : 6)}
                    strokeWidth={isEvent ? 2 : 0.75}
                    transform={`rotate(${(index / span.length) * 360} 100 100)`}
                    className={
                      isEvent
                        ? 'stroke-inv-accent'
                        : day % 5 === 0
                          ? 'stroke-inv-ink-soft'
                          : 'stroke-inv-line'
                    }
                  />
                );
              })}
            </svg>

            {/*
              El centro. Va en HTML y no en `<text>` del SVG a propósito: aquí manda la
              tipografía del tema —cuerpo fluido, versalitas espaciadas, cifras tabulares— y
              dentro del SVG habría que reescribirla en unidades del lienzo, que además escalan
              con el dibujo y no con la pantalla.
            */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-[18%]">
              <p className="m-0 text-[10.5px] tracking-[0.28em] text-inv-ink-soft uppercase">
                {span.weekday}
              </p>

              {/*
                La cifra, con la marca del día detrás. Es la misma pieza que en las otras cinco
                variantes (`calendar-parts.tsx`): la forma la elige el organizador, y si cada
                calendario dibujara la suya, cambiar de variante en el panel le cambiaría también
                la que ya había elegido.
              */}
              <span className="relative flex size-28 items-center justify-center sm:size-32">
                <DayMarkShape mark={content.dayMark} className="size-28 sm:size-32" />
                <span className="relative font-inv-display text-[clamp(3.4rem,17vw,4.6rem)] leading-none font-light text-inv-ink tabular-nums">
                  {span.day}
                </span>
              </span>

              <p className="m-0 text-[11px] tracking-[0.3em] text-inv-ink uppercase">
                {span.monthLabel} <span className="tabular-nums">{span.year}</span>
              </p>

              {hasText(content.timeLabel) && (
                <p className="mt-2 mb-0 text-[10.5px] tracking-[0.26em] text-inv-accent uppercase tabular-nums">
                  {content.timeLabel}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Sin esfera que graduar, la frase del organizador: es lo que tiene que verse en una
             invitación ya repartida. */
          <p
            className={clsx(
              'mb-0 font-inv-display text-[clamp(1.6rem,5vw,2.4rem)] leading-tight font-light text-inv-ink',
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
