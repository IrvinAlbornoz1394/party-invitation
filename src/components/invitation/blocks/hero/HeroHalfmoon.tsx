import { Countdown } from '../../shared/Countdown';
import { BlockImage } from '../../shared/BlockImage';
import { hasText } from '../../shared/has-text';
import { DoodleHeart, FloralSpray } from '../../shared/nocturne-ornaments';
import { WATERCOLOR } from '../../shared/nocturne-assets';
import type { HeroVariantProps } from './hero-variant';

/**
 * Parte «Ana & Diego» en sus dos nombres. Con un solo festejado devuelve uno.
 *
 * Es composición y no contenido: el nombre se guarda entero y aquí solo se decide dónde va el
 * corazón. Un nombre que lleve «y» por dentro («María y José Luis») se partiría mal, así que solo
 * se parte por el conector rodeado de espacios y en su primera aparición.
 */
function splitNames(name: string): readonly string[] {
  const match = /\s+(?:&|y)\s+/.exec(name);
  if (!match) return [name];
  return [name.slice(0, match.index), name.slice(match.index + match[0].length)];
}

/**
 * `hero.halfmoon` — la portada de `nocturne`: el azul medianoche, la fecha y la ciudad en
 * versalitas, los nombres en inglesa amplia con un corazón dorado dibujado entre los dos, y la
 * fotografía en un círculo grande que se hunde en la sección siguiente como una luna a medio salir.
 *
 * ## La media luna
 *
 * La foto no se recorta a la mitad: es un círculo entero que empieza dentro del azul y termina en
 * el papel blanco del bloque siguiente. El azul se corta en recto a media altura del círculo, así
 * que la mitad de arriba se lee sobre la noche y la de abajo sobre el día — el paso de la portada
 * al resto de la invitación en un solo gesto.
 *
 * ## XV años
 *
 * Con un solo nombre el corazón sube encima de él: lo que cambia es la composición, no el
 * componente, y no hace falta preguntar qué se celebra.
 */
export function HeroHalfmoon({ content }: HeroVariantProps) {
  const names = splitNames(content.celebrantName);
  const couple = names.length === 2;

  return (
    <section
      data-block="hero"
      data-variant="halfmoon"
      className="relative isolate w-full overflow-hidden bg-inv-bg font-inv-body text-inv-bg"
    >
      {/* La noche: llega hasta la mitad del círculo de la foto. */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[calc(100%-min(43vw,11.5rem)-3rem)] bg-inv-ink" />

      <FloralSpray
        asset={WATERCOLOR.lilac}
        motion="sway"
        rotate={-150}
        className="-top-10 -right-14 w-40 opacity-90 sm:w-52"
      />
      <FloralSpray
        asset={WATERCOLOR.jasmine}
        motion="sway"
        rotate={24}
        className="top-[38%] -left-16 w-32 opacity-80 sm:w-40"
        style={{ ['--inv-sway-delay' as string]: '-5s' }}
      />

      <div className="relative mx-auto flex max-w-xl flex-col items-center px-6 pt-24 text-center sm:pt-28">
        <p className="inv-rise m-0 text-[13px] tracking-[0.14em] text-inv-bg/90 uppercase sm:text-[14px]">
          {content.dateLabel}
          {hasText(content.city) && <> &nbsp;—&nbsp; {content.city}</>}
        </p>

        {hasText(content.intro) && (
          <p className="inv-rise mt-4 mb-0 max-w-xs font-inv-display text-[14px] tracking-[0.12em] text-inv-bg/80">
            {content.intro}
          </p>
        )}

        <h1 className="inv-rise mt-5 mb-0 flex flex-col items-center font-inv-script text-[clamp(3.6rem,19vw,5.4rem)] leading-[1.02] font-normal text-inv-bg">
          {!couple && <DoodleHeart className="mb-2 w-24 sm:w-28" />}
          <span>{names[0]}</span>
          {couple && (
            <>
              <DoodleHeart className="my-1 w-24 sm:w-28" />
              <span className="sr-only"> y </span>
              <span>{names[1]}</span>
            </>
          )}
        </h1>

        {hasText(content.celebrantLastName) && (
          <p className="mt-3 mb-0 font-inv-display text-[13px] tracking-[0.22em] text-inv-bg/80 uppercase">
            {content.celebrantLastName}
          </p>
        )}

        {hasText(content.tagline) && (
          <p className="inv-rise mx-auto mt-7 mb-0 max-w-sm text-[16px] leading-relaxed text-inv-bg/85">
            {content.tagline}
          </p>
        )}

        {content.showCountdown && (
          <Countdown startsAt={content.startsAt} variant="colon" tone="onImage" className="mt-9" />
        )}

        {/* La luna. Sin foto queda el círculo del celeste del tema con el corazón dentro. */}
        <div className="relative mt-12 aspect-square w-[min(86vw,23rem)] overflow-hidden rounded-full bg-inv-surface shadow-inv-soft">
          {content.image ? (
            <BlockImage image={content.image} priority sizes="(min-width: 640px) 368px, 86vw" />
          ) : (
            <div className="grid h-full place-items-center">
              <DoodleHeart className="w-24 opacity-60" />
            </div>
          )}
        </div>
      </div>

      <div aria-hidden="true" className="h-12" />
    </section>
  );
}
