import { BlockImage } from '../../shared/BlockImage';
import { Countdown } from '../../shared/Countdown';
import { BotanicalSpray, CrownGlyph } from '../../shared/paper-ornaments';
import { ScrollHint } from '../../shared/ScrollHint';
import type { HeroVariantProps } from './hero-variant';

/**
 * `hero.crown` — la corona arriba, el rótulo en versalitas, el retrato enmarcado en un filete y
 * el nombre en manuscrita debajo. La participación de unos XV, compuesta en un eje.
 *
 * Es la novena portada y la segunda pensada para unos XV, así que lo primero es decir en qué se
 * diferencia de la que ya había:
 *
 *   `quince`  el titular es **la cifra**: los números romanos a cuerpo de cartel sobre el
 *             retrato, y el nombre debajo. Es un cartel.
 *   `crown`   el titular es **el nombre**, y lo que identifica la celebración es la corona y el
 *             rótulo en versalitas. Es una participación grabada.
 *
 * Son dos composiciones y no una con un parámetro, que es la regla del catálogo: `docs/PROJECT.md`
 * prohíbe que un componente pregunte de qué evento se trata, y el día que las dos hicieran lo
 * mismo con un `if`, la biblioteca dejaría de poder crecer por tipos.
 *
 * ## La corona va escrita en el componente, no en el contenido
 *
 * Como el «XV» de `hero.quince` y como la rasgadura de `rsvp.torn`: no es un dato del evento —no
 * cambia, no se configura— sino la firma de la variante. La consecuencia es que **esta portada es
 * de unos XV** y ponerla en una boda promete otra celebración, igual que las alianzas de
 * `welcome.luminous` al revés. El catálogo lo resuelve donde toca: ofreciendo la plantilla para
 * el tipo de evento que le corresponde.
 *
 * ## El retrato, enmarcado y con la guirnalda cruzándolo
 *
 * El filete va pegado al canto de la foto y no separado como en `hero.framed`: aquí no imita una
 * lámina pegada sobre papel de algodón, imita el **grabado dorado** de una participación impresa
 * en color, donde la línea es el borde y no un marco aparte. Las dos ramas botánicas asoman por
 * las esquinas de la sección, recortadas por ella, que es como se imprime una guirnalda que se
 * sale del troquel.
 *
 * ## Padres y padrinos
 *
 * La referencia de la que sale esta portada los lista debajo del nombre, y el contrato del bloque
 * no tiene dónde ponerlos: `heroContentSchema` guarda una frase de invitación (`intro`) y una
 * promesa (`tagline`), no una lista de personas. No se inventa un campo aquí —sería pedir a las
 * otras ocho portadas algo que ninguna pinta— así que hoy se escriben dentro de `tagline`, que
 * admite cuatrocientos caracteres y respeta los saltos de línea del organizador. Cuando haya
 * suficientes eventos pidiéndolo, será un campo del contrato y lo pintarán las nueve.
 */
export function HeroCrown({ content }: HeroVariantProps) {
  return (
    <section
      data-block="hero"
      data-variant="crown"
      className="relative isolate flex min-h-[var(--inv-viewport,100svh)] w-full flex-col items-center justify-center overflow-hidden bg-inv-bg px-6 py-16 font-inv-body text-inv-ink sm:px-10 sm:py-20"
    >
      <BotanicalSpray className="absolute -top-4 -left-10 h-24 w-[15rem] text-inv-accent opacity-45 sm:h-28 sm:w-[20rem]" />
      <BotanicalSpray className="absolute -right-10 -bottom-4 h-24 w-[15rem] rotate-180 text-inv-accent opacity-45 sm:h-28 sm:w-[20rem]" />

      <div className="inv-rise relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <CrownGlyph className="h-11 w-[4.5rem] text-inv-accent sm:h-12 sm:w-20" />

        {content.eventTypeLabel && (
          <h1 className="mt-5 mb-0 font-inv-display text-[clamp(1.15rem,4.5vw,1.6rem)] leading-tight font-light tracking-[0.3em] text-inv-ink uppercase">
            {content.eventTypeLabel}
          </h1>
        )}

        {content.image && (
          <figure className="relative m-0 mt-8 w-full">
            {/* El filete pegado al canto: es el borde de la fotografía, no un marco alrededor.
                Va como elemento aparte y no como `border` de la caja porque la imagen la pinta
                `BlockImage` con `fill`, y un borde en el contenedor quedaría por debajo de ella. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-10 border border-inv-accent/70"
            />
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-inv-primary/10">
              <BlockImage
                image={content.image}
                priority
                sizes="(min-width: 640px) 24rem, 85vw"
                className="object-top"
              />
            </div>
          </figure>
        )}

        <p className="mt-8 mb-0 font-inv-script text-[clamp(2.6rem,13vw,4rem)] leading-[0.95] text-inv-accent">
          {content.celebrantName}
        </p>

        {content.celebrantLastName && (
          <p className="mt-3 mb-0 text-[11px] tracking-[0.32em] text-inv-ink-soft uppercase">
            {content.celebrantLastName}
          </p>
        )}

        {content.intro && (
          <p className="mt-7 mb-0 max-w-xs text-[10.5px] leading-relaxed tracking-[0.22em] text-inv-ink-soft uppercase sm:text-[11px]">
            {content.intro}
          </p>
        )}

        {/*
          La promesa, y con ella los padres y los padrinos cuando el organizador los escribe ahí.
          `whitespace-pre-line` es lo que hace que sus saltos de línea se respeten: sin él, cuatro
          nombres escritos en cuatro renglones salen en un párrafo corrido. Ver la cabecera.
        */}
        {content.tagline && (
          <p className="mt-6 mb-0 max-w-xs text-[12.5px] leading-relaxed whitespace-pre-line text-inv-ink">
            {content.tagline}
          </p>
        )}

        {content.showCountdown && (
          <Countdown
            startsAt={content.startsAt}
            variant="crest"
            tone="onSurface"
            className="mt-10"
          />
        )}
      </div>

      <ScrollHint tone="onSurface" />
    </section>
  );
}
