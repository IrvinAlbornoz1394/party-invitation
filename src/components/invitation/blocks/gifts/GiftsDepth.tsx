'use client';

import { ActionLink } from '../../shared/ActionLink';
import { BlockImage } from '../../shared/BlockImage';
import { hasText } from '../../shared/has-text';
import { DepthHeading, DepthRule, DepthWash, DepthWord } from '../../shared/mirador-parts';
import { ParallaxLayer, ParallaxScene } from '../../shared/Parallax';
import { Reveal } from '../../shared/Reveal';
import type { GiftsVariantProps } from './gifts-variant';

/**
 * `gifts.depth` — la mesa de regalos de `mirador`, sobre papel.
 *
 * El fondo es el campo de color que se aleja y una palabra gigante —«Regalo»— que se cruza por
 * delante. Si hay foto va en una ventana enmarcada: el marco sube con la página y la foto, dentro,
 * se queda atrás, así que se ve el mismo gesto de las secciones a sangre en pequeño.
 *
 * Sin mesas (`registries: []`) queda el mensaje solo, que es lo que piden muchas parejas:
 * «su presencia es nuestro regalo».
 */
export function GiftsDepth({ content }: GiftsVariantProps) {
  return (
    <ParallaxScene
      block="gifts"
      variant="depth"
      className="bg-inv-bg py-[var(--inv-space-block)] font-inv-body text-inv-ink"
    >
      <DepthWash flip />
      <DepthWord className="top-[18%]">Regalo</DepthWord>

      <div className="relative mx-auto w-full max-w-3xl px-6 sm:px-10">
        <Reveal>
          <DepthHeading eyebrow={content.eyebrow} title={content.title} />
        </Reveal>

        {content.image && (
          <Reveal delay={0.05} className="mx-auto mt-12 w-full max-w-md">
            {/* La ventana: el marco es fijo y la foto, dentro, avanza más despacio. Es su propia
                escena para que el recorrido se mida contra el marco y no contra toda la sección —
                medido contra la sección, la foto se estiraba casi al doble y salía borrosa. */}
            <ParallaxScene as="div" className="aspect-[4/5] rounded-inv-lg bg-inv-surface shadow-inv-soft">
              <ParallaxLayer depth={0.18} fill className="-z-10">
                <BlockImage image={content.image} sizes="(min-width: 640px) 448px, 90vw" />
              </ParallaxLayer>
            </ParallaxScene>
          </Reveal>
        )}

        {hasText(content.message) && (
          <Reveal delay={0.08}>
            <p className="mx-auto mt-10 mb-0 max-w-md text-center text-[16px] leading-relaxed text-inv-ink-soft">
              {content.message}
            </p>
          </Reveal>
        )}

        {content.registries.length > 0 && (
          <>
            <DepthRule className="mt-10" />
            <ul className="m-0 mt-10 grid list-none gap-4 p-0 sm:grid-cols-2">
              {content.registries.map((registry, index) => (
                // El índice es estable: las mesas se pintan una vez desde contenido guardado.
                <li key={`${registry.label}-${index}`}>
                  <Reveal delay={0.06 * index} className="h-full">
                    <article className="flex h-full flex-col items-center rounded-inv-lg border border-inv-line bg-inv-bg/80 px-6 py-8 text-center">
                      <p className="m-0 font-inv-display text-[1.5rem] leading-tight italic text-inv-ink">
                        {registry.label}
                      </p>
                      {hasText(registry.detail) && (
                        <p className="mt-3 mb-0 max-w-xs text-[15px] leading-relaxed break-words text-inv-ink-soft">
                          {registry.detail}
                        </p>
                      )}
                      {registry.action && (
                        <ActionLink
                          label={registry.action.label}
                          href={registry.action.href}
                          className="mt-6"
                        />
                      )}
                    </article>
                  </Reveal>
                </li>
              ))}
            </ul>
          </>
        )}

        {hasText(content.note) && (
          <p className="mx-auto mt-10 mb-0 max-w-sm text-center text-[14px] leading-relaxed text-inv-ink-soft">
            {content.note}
          </p>
        )}
      </div>
    </ParallaxScene>
  );
}
