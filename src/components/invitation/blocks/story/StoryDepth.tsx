'use client';

import { BlockImage } from '../../shared/BlockImage';
import { hasText } from '../../shared/has-text';
import { DepthHeading, DepthRule, DepthWash, DepthWord } from '../../shared/mirador-parts';
import { ParallaxLayer, ParallaxScene } from '../../shared/Parallax';
import { StoryHighlight, StoryProse, StorySignature } from './story-parts';
import type { StoryVariantProps } from './story-variant';

/**
 * `story.depth` — la historia de `mirador`, sobre papel.
 *
 * El campo de color se queda atrás y una comilla gigante en filete se adelanta: el texto queda
 * entre los dos planos. Si hay foto, va en una ventana pequeña cuya imagen se desplaza dentro del
 * marco a su propia velocidad —el mismo gesto de las secciones a sangre, en miniatura—.
 */
export function StoryDepth({ content }: StoryVariantProps) {
  return (
    <ParallaxScene
      block="story"
      variant="depth"
      className="bg-inv-bg py-[var(--inv-space-block)] font-inv-body text-inv-ink"
    >
      <DepthWash />
      <DepthWord className="top-[6%]">“</DepthWord>

      <div className="mx-auto w-full max-w-2xl px-6 sm:px-10">
        <DepthHeading eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        <DepthRule className="mt-8" />

        {content.image && (
          <ParallaxLayer depth={-0.06} className="mx-auto mt-10 w-[min(72vw,20rem)]">
            {/* La ventana: la foto se mueve por dentro con otra profundidad que el marco. */}
            <div className="relative isolate aspect-[4/5] overflow-hidden rounded-inv-lg bg-inv-surface shadow-inv-soft">
              <ParallaxLayer depth={0.08} fill>
                <BlockImage image={content.image} sizes="(min-width: 640px) 320px, 72vw" />
              </ParallaxLayer>
            </div>
          </ParallaxLayer>
        )}

        <StoryProse body={content.body} className="mx-auto mt-12 max-w-xl text-center" />

        {content.highlight && (
          <StoryHighlight highlight={content.highlight} align="center" className="mt-12" />
        )}

        {hasText(content.signature) && (
          <StorySignature signature={content.signature} className="mt-10 text-center" />
        )}
      </div>
    </ParallaxScene>
  );
}
