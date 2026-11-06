'use client';

import { useCallback, useRef, useState } from 'react';
import clsx from 'clsx';
import { BlockImage } from '../../shared/BlockImage';
import { hasText } from '../../shared/has-text';
import { Reveal } from '../../shared/Reveal';
import {
  Blob,
  CLAY_TAN,
  Confetti,
  DoodleHearts,
  Feather,
  LaurelSprig,
} from '../../shared/terracotta-ornaments';
import type { StoryVariantProps } from './story-variant';

/**
 * `story.slides` — la historia de `terracota`: la foto a todo lo ancho y, encima, una tarjeta
 * blanca de lados abombados con el título a pincel, los dos corazones y el relato pasando párrafo
 * a párrafo, como el carrusel «First Meet Each Other» de la referencia. Debajo, la frase
 * destacada —«¡Sí! ¡Claro que sí!»— con el laurel.
 *
 * ## El carrusel
 *
 * Es un desplazamiento horizontal con ajuste (`scroll-snap`), no una animación: se pasa con el
 * dedo, con la rueda o con los puntos, y sin JavaScript sigue pasándose con el dedo. Los puntos
 * solo saben en qué párrafo se está. Con un solo párrafo no hay puntos.
 */
export function StorySlides({ content }: StoryVariantProps) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const many = content.body.length > 1;

  const onScroll = useCallback(() => {
    const element = track.current;

    if (!element) return;
    setActive(Math.round(element.scrollLeft / Math.max(1, element.clientWidth)));
  }, []);

  const goTo = (index: number) => {
    const element = track.current;

    element?.scrollTo({ left: index * element.clientWidth, behavior: 'smooth' });
  };

  return (
    <section
      data-block="story"
      data-variant="slides"
      className="relative w-full overflow-x-clip bg-inv-bg pb-[var(--inv-space-block)] font-inv-body text-inv-ink"
    >
      <div className="relative isolate overflow-hidden bg-inv-line px-5 py-16 sm:px-8 lg:py-24">
        {content.image && <BlockImage image={content.image} sizes="100vw" className="-z-20" />}
        <Blob shape="slab" className={`-top-10 -left-12 -z-10 h-56 w-28 ${content.image ? 'hidden' : 'text-inv-accent'}`} />

        <Reveal className="relative mx-auto max-w-md lg:mr-auto lg:ml-[8%]">
          <Feather className="-top-6 -left-5 z-10 w-14" rotate={-28} />
          <Confetti className="-top-8 -right-6 z-10 w-24" />
          <article className="inv-squircle bg-inv-bg px-6 pt-12 pb-10 text-center sm:px-10">
            {hasText(content.eyebrow) && (
              <p className="m-0 text-[12.5px] font-semibold tracking-[0.2em] text-inv-primary uppercase">
                {content.eyebrow}
              </p>
            )}
            <h2 className="mt-2 mb-0 font-inv-display text-[clamp(1.8rem,8vw,2.4rem)] leading-[1.15] font-normal text-inv-ink">
              {content.title}
            </h2>
            {hasText(content.subtitle) && (
              <p className="mx-auto mt-2 mb-0 max-w-xs text-[15px] leading-relaxed text-inv-ink-soft">
                {content.subtitle}
              </p>
            )}
            <DoodleHearts className="mt-4" />

            <div
              ref={track}
              onScroll={onScroll}
              className="mt-5 flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {content.body.map((paragraph, index) => (
                <p
                  key={index}
                  className="m-0 w-full shrink-0 snap-center px-0.5 text-[15.5px] leading-[1.75] text-inv-ink-soft"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {many && (
              <div className="mt-7 inline-flex items-center gap-1 rounded-inv-md bg-inv-primary px-4 py-2.5">
                {content.body.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => goTo(index)}
                    aria-label={`Párrafo ${index + 1} de ${content.body.length}`}
                    aria-current={active === index ? 'true' : undefined}
                    className="grid size-6 cursor-pointer place-items-center border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-inv-on-primary"
                  >
                    <span
                      className={clsx(
                        'block rounded-full bg-inv-on-primary transition-all duration-300',
                        active === index ? 'h-2 w-4' : 'size-2 opacity-60',
                      )}
                    />
                  </button>
                ))}
              </div>
            )}
          </article>
        </Reveal>
      </div>

      {(content.highlight || hasText(content.signature)) && (
        <div className="relative isolate mx-auto max-w-xl px-6 pt-[var(--inv-space-block)] text-center">
          <Blob shape="pebble" className={`-top-6 -right-40 -z-10 h-48 w-48 sm:-right-28 ${CLAY_TAN}`} />
          {content.highlight && (
            <Reveal>
              <DoodleHearts />
              <blockquote className="mt-5 mb-0 font-inv-display text-[clamp(1.6rem,7vw,2.2rem)] leading-snug text-inv-ink">
                “{content.highlight.quote}”
              </blockquote>
              {hasText(content.highlight.author) && (
                <p className="mt-3 mb-0 text-[13px] font-semibold tracking-[0.18em] text-inv-primary uppercase">
                  {content.highlight.author}
                </p>
              )}
            </Reveal>
          )}
          {hasText(content.signature) && (
            <p className="mt-6 mb-0 font-inv-script text-[2rem] leading-none text-inv-primary">{content.signature}</p>
          )}
          <LaurelSprig className="mt-6" />
        </div>
      )}
    </section>
  );
}
