import { eventDateParts } from '@/domain/invitation/event-date';
import { BlockImage } from '../../shared/BlockImage';
import { ScrollHint } from '../../shared/ScrollHint';
import { Countdown } from '../../shared/Countdown';
import type { HeroVariantProps } from './hero-variant';

/**
 * `hero.quince` — el retrato a toda página y la cifra grabada en una pestaña de papel que sube
 * sobre su canto.
 *
 * Es la portada de `storytelling` para unos XV. Lo único que identifica a esa celebración antes de
 * leer una palabra es el número; las otras cinco portadas parten del retrato o del papel y sirven
 * para cualquier evento.
 *
 * ## Cuatro intentos, y qué enseñó cada uno
 *
 * Vale la pena dejarlo escrito: los cuatro fallos son de clases distintas y los cuatro son fáciles
 * de repetir.
 *
 *   1. **Cifra a `opacity: 0.14` detrás de la cara.** Invisible sobre un retrato claro, que es la
 *      mayoría. Delante, una pila centrada — la composición de `hero.framed` y `hero.centered`.
 *   2. **Columna a la izquierda sobre foto a sangre.** Arregló el eje y mantuvo el error de fondo:
 *      texto encima de la fotografía, que es lo que hacen `hero.classic` y `hero.centered`. Y
 *      contradecía a su estructura — `hero.split`, la portada de `storytelling` para boda, existe
 *      **precisamente para no escribir sobre la foto**.
 *   3. **Cifra recortada de la propia fotografía** (`background-clip: text`). Lo que se ve dentro
 *      de las letras es el trozo de imagen que caiga detrás, y en el retrato de la demo cayó la
 *      balaustrada, casi blanca. Una pieza cuya legibilidad depende de qué haya en una foto que
 *      nadie va a revisar no se afina: se retira.
 *   4. **Plancha desplazada con la cifra asomando al lado.** Correcta en un móvil y rota en
 *      escritorio: estaba escrita solo con `max-w-md`, así que en una pantalla ancha se quedaba
 *      como una columna estrecha pegada a la izquierda con dos tercios de página en blanco. Una
 *      portada tiene que **componer** en los dos anchos, no encogerse en uno y sobrar en el otro.
 *
 * Las lecciones, que son las dos reglas de este archivo: **el contraste de la cifra lo controla el
 * tema, nunca la fotografía**, y **cada ancho necesita su composición**.
 *
 * ## Qué hace
 *
 * Una sola columna vertical, que es la que se compone bien de 320 a 2560 píxeles:
 *
 *   · **El retrato, a toda página**, en una banda que ocupa algo más de media pantalla. A sangre
 *     por los cuatro costados: en escritorio llena el ancho en lugar de dejarlo vacío, y en un
 *     móvil sigue siendo la franja alta de siempre. El alto va en `svh` y no en proporción para
 *     que el reparto entre foto y texto sea el mismo en cualquier pantalla.
 *   · **La pestaña de papel**, centrada y subida sobre el canto inferior de la banda, con la cifra
 *     grabada entre dos filetes. Es papel del tema, así que la cifra tiene su fondo garantizado —el
 *     error del tercer intento no puede repetirse—, y el solape es lo que la convierte en una
 *     etiqueta pegada sobre la fotografía en lugar de en un rótulo puesto debajo.
 *   · **El texto, centrado sobre el papel.** Sin velo y sin sombra: el contraste lo garantiza el
 *     tema entre `ink` y `surface`, igual que en `hero.split`.
 *
 * ## Por qué centrado y no a la izquierda
 *
 * Porque el eje izquierdo solo compone contra algo que ocupe la derecha, y aquí no hay nada: la
 * banda es a sangre y debajo solo hay papel. Alineado a un lado, ese papel se lee como un margen
 * abandonado —que es exactamente lo que se veía en escritorio—. Centrado bajo una banda a sangre,
 * la página tiene un solo eje y funciona igual de ancha que de estrecha.
 *
 * ## Por qué la pestaña sube con `rem` y no con `em`
 *
 * Un margen negativo en `em` va atado a la métrica de la tipografía del tema: al cambiar de tema,
 * el solape cambia y la pieza se descuadra. En `rem` el solape es el mismo en los siete temas.
 */
export function HeroQuince({ content }: HeroVariantProps) {
  const parts = eventDateParts(content.startsAt);

  return (
    <section
      data-block="hero"
      data-variant="quince"
      className="relative isolate flex min-h-[var(--inv-viewport,100svh)] w-full flex-col overflow-hidden bg-inv-bg pb-14 font-inv-body text-inv-ink"
    >
      {content.image ? (
        /* La banda del retrato, a sangre. `svh` y no proporción: con `aspect-ratio` una pantalla
           ancha daría una banda bajísima y una estrecha una altísima, y el reparto entre imagen y
           texto dejaría de ser el mismo. */
        <div className="relative isolate h-[52svh] min-h-[17rem] w-full shrink-0">
          <BlockImage image={content.image} priority className="object-center" sizes="100vw" />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="h-[52svh] min-h-[17rem] w-full shrink-0 bg-inv-primary"
        />
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center px-6 text-center sm:px-10">
        {/*
          La pestaña: papel del tema subiendo sobre el canto de la banda. El fondo es lo que le da
          a la cifra su contraste, y por eso esta versión no puede repetir el fallo del recorte.
        */}
        <p
          aria-hidden="true"
          className="m-0 -mt-9 flex items-center gap-5 rounded-inv-md bg-inv-bg px-8 py-4 sm:-mt-11 sm:gap-6 sm:px-10"
        >
          <span className="h-px w-8 bg-inv-line sm:w-12" />
          <span className="font-inv-display text-[clamp(2.4rem,7vw,3.6rem)] leading-none font-light tracking-[0.04em] text-inv-primary">
            XV
          </span>
          <span className="h-px w-8 bg-inv-line sm:w-12" />
        </p>

        {content.eventTypeLabel && (
          <p className="mt-5 mb-0 text-[10.5px] tracking-[0.34em] text-inv-ink-soft uppercase">
            {content.eventTypeLabel}
          </p>
        )}

        <h1 className="mt-3 mb-0 font-inv-script text-[clamp(2.6rem,11vw,4.5rem)] leading-[0.95] font-normal text-inv-primary">
          {content.celebrantName}
        </h1>

        {content.celebrantLastName && (
          <p className="mt-3 mb-0 font-inv-display text-[11.5px] tracking-[0.3em] text-inv-ink-soft uppercase">
            {content.celebrantLastName}
          </p>
        )}

        {content.tagline && (
          <p className="mt-5 mb-0 max-w-md text-[14.5px] leading-relaxed text-inv-ink-soft">
            {content.tagline}
          </p>
        )}

        {/* La fecha en una línea. La retícula con filetes —día grande en medio, mes y año a los
            lados— es la papelería impresa y es la de `hero.framed`; aquí es un renglón más. */}
        <p className="mt-6 mb-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11.5px] tracking-[0.2em] text-inv-ink uppercase">
          {parts ? (
            <>
              <span>
                {parts.day} {parts.month} {parts.year}
              </span>
              {parts.time && (
                <>
                  <span aria-hidden="true" className="h-3 w-px bg-inv-line" />
                  <span className="tabular-nums tracking-normal">{parts.time}</span>
                </>
              )}
            </>
          ) : (
            <span>{content.dateLabel}</span>
          )}

          {content.city && (
            <>
              <span aria-hidden="true" className="h-3 w-px bg-inv-line" />
              <span className="text-inv-ink-soft">{content.city}</span>
            </>
          )}
        </p>

        {/* La fecha completa se anuncia una sola vez para lectura asistida: la línea de arriba,
            leída en voz alta, son tres palabras sueltas. */}
        <span className="sr-only">{content.dateLabel}</span>

        {/* La misma forma que `hero.split`: las dos son la portada de `storytelling`, y la decide
            la estructura y no el tipo de evento. Centrada, como el resto de la columna. */}
        {content.showCountdown && (
          <Countdown
            startsAt={content.startsAt}
            variant="script"
            tone="onSurface"
            className="mt-7"
          />
        )}
      </div>
      <ScrollHint tone="onSurface" />
    </section>
  );
}
