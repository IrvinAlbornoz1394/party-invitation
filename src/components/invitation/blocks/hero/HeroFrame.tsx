import { eventDateParts } from '@/domain/invitation/event-date';
import { BlockImage } from '../../shared/BlockImage';
import { Countdown } from '../../shared/Countdown';
import { DrawnFrame, WeddingRings } from '../../shared/doodle-ornaments';
import { ScrollHint } from '../../shared/ScrollHint';
import type { HeroVariantProps } from './hero-variant';

/**
 * `hero.frame` — el rótulo en letras vaciadas, el retrato dentro de un marco dibujado a mano y
 * los nombres en manuscrita debajo. Todo sobre el papel, sin una sola fotografía a sangre.
 *
 * Es la octava portada y la única **ilustrada**: lo que sostiene la pantalla no es la fotografía
 * ni la tipografía, es el dibujo alrededor de la fotografía. Con `hero.framed` —la de
 * `botanical`— comparte la idea de enmarcar y no la ejecución, y la diferencia es exactamente la
 * que separa a las dos plantillas:
 *
 *   `framed`  un filete impreso, recto y separado de la foto. Papelería de imprenta.
 *   `frame`   un marco **temblado**, dibujado a mano, con las esquinas sin cerrar. Ilustración.
 *
 * Y el titular tampoco es el mismo: allí es el tipo de evento en versalitas finas; aquí es el
 * rótulo vaciado a cuerpo de cartel —`.inv-outline-text`, la letra dibujada con su contorno— que
 * es el recurso que la referencia repite en todas sus secciones.
 *
 * ## Las alianzas solo cuando hay dos nombres
 *
 * El dibujo de los aros es nupcial y esta portada se ofrece también para unos XV, donde
 * prometería otra celebración —es el mismo problema que separó `welcome.crown` de
 * `welcome.luminous`—. Aquí no hace falta una variante aparte porque el contenido ya lo dice: un
 * `celebrantName` con dos nombres unidos («Ana & Diego») es una pareja, y uno solo («Renata») no
 * lo es. Se lee del contenido y no del tipo de evento, que es lo que `docs/PROJECT.md` prohíbe
 * preguntar.
 *
 * ## Las manchas de color
 *
 * Dos círculos difuminados del color de acento, muy tenues, detrás del contenido. Es lo que en la
 * referencia hacen los borrones pastel: quitan el vacío del papel sin dibujar nada. Van con
 * `blur` y opacidad baja, así que en un tema oscuro se leen como un halo y no como dos pegotes.
 */
export function HeroFrame({ content }: HeroVariantProps) {
  const parts = eventDateParts(content.startsAt);

  return (
    <section
      data-block="hero"
      data-variant="frame"
      className="relative isolate flex min-h-[var(--inv-viewport,100svh)] w-full flex-col items-center justify-center overflow-hidden bg-inv-bg px-6 py-16 font-inv-body text-inv-ink sm:px-10 sm:py-20"
    >
      <span
        aria-hidden="true"
        className="absolute -top-10 -left-16 -z-10 size-56 rounded-full bg-inv-accent/15 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="absolute -right-16 bottom-8 -z-10 size-64 rounded-full bg-inv-primary/10 blur-3xl"
      />

      <div className="inv-rise flex w-full max-w-md flex-col items-center text-center">
        {content.eventTypeLabel && (
          <h1 className="inv-outline-text m-0 font-inv-display text-[clamp(2.4rem,11vw,4rem)] leading-[1.05] font-semibold tracking-[0.04em] text-inv-primary uppercase">
            {content.eventTypeLabel}
          </h1>
        )}

        {isPair(content.celebrantName) && (
          <WeddingRings className="mt-6 w-20 text-inv-accent sm:w-24" />
        )}

        {content.image && (
          /*
            El marco va **fuera** de la caja de la foto (`-inset-3`) y no como borde suyo: pegado
            al canto se lee como el filete de una tarjeta, y separado, como un marco dibujado
            alrededor de una lámina. El relleno de la sección es lo que garantiza que esos doce
            píxeles no se salgan por los lados en un móvil.
          */
          <figure className="relative m-0 mt-9 w-full max-w-[17rem]">
            <DrawnFrame className="absolute -inset-3 h-[calc(100%+1.5rem)] w-[calc(100%+1.5rem)] text-inv-primary" />
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-inv-sm bg-inv-primary/5">
              <BlockImage
                image={content.image}
                priority
                sizes="(min-width: 640px) 17rem, 75vw"
                className="object-top"
              />
            </div>
          </figure>
        )}

        <p className="mt-10 mb-0 font-inv-script text-[clamp(2.4rem,12vw,3.6rem)] leading-[0.95] text-inv-primary">
          {content.celebrantName}
        </p>

        {content.celebrantLastName && (
          <p className="mt-3 mb-0 text-[11px] tracking-[0.3em] text-inv-ink-soft uppercase">
            {content.celebrantLastName}
          </p>
        )}

        {content.tagline && (
          <p className="mt-6 mb-0 max-w-sm text-[14.5px] leading-relaxed text-inv-ink-soft">
            {content.tagline}
          </p>
        )}

        <p className="mt-7 mb-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12px] tracking-[0.18em] text-inv-ink uppercase">
          {content.dateLabel}
          {parts?.time && <span className="tabular-nums">· {parts.time}</span>}
        </p>

        {content.city && (
          <p className="mt-2 mb-0 text-[12.5px] text-inv-ink-soft">{content.city}</p>
        )}

        {content.showCountdown && (
          <Countdown
            startsAt={content.startsAt}
            variant="bubble"
            tone="onSurface"
            className="mt-9"
          />
        )}
      </div>

      <ScrollHint tone="onSurface" />
    </section>
  );
}

/**
 * ¿El nombre trae una pareja?
 *
 * Lo mismo que `splitPair` en `hero.script`, y por lo mismo: el contrato guarda una sola línea y
 * si dentro hay dos personas es una lectura de esta composición, no un dato del evento. Aquí solo
 * hace falta saber **si** las hay, para decidir si se pintan las alianzas.
 */
function isPair(name: string): boolean {
  return /\s(?:&|y)\s/i.test(name.trim());
}
