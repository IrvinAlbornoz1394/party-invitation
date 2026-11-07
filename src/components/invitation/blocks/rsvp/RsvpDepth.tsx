'use client';

import { hasText } from '../../shared/has-text';
import { DepthCard, DepthHeading, DepthPhoto } from '../../shared/mirador-parts';
import { ParallaxLayer, ParallaxScene } from '../../shared/Parallax';
import { Reveal } from '../../shared/Reveal';
import { RsvpAction, RsvpDeadline, type RsvpVariantProps } from './rsvp-parts';

/**
 * `rsvp.depth` — la confirmación de `mirador`: una ventana a sangre y, encima, la tarjeta de papel
 * que flota un poco más rápido que la página.
 *
 * Son tres planos: la foto se queda atrás, la sección avanza con la página y la tarjeta se
 * adelanta. La tarjeta lleva el papel del tema, así que el botón, la fecha límite y el formulario
 * gestionado (`RsvpAction`) se pintan en su tono de superficie de siempre, sin velo.
 *
 * Sin foto, la ventana es el campo de color del tema (ver `DepthPhoto`).
 */
export function RsvpDepth({ content }: RsvpVariantProps) {
  return (
    <ParallaxScene
      block="rsvp"
      variant="depth"
      className="flex min-h-[var(--inv-viewport,100svh)] items-center bg-inv-ink py-[var(--inv-space-block)] font-inv-body"
    >
      <DepthPhoto image={content.image} />

      <div className="relative mx-auto w-full max-w-lg px-5 sm:px-8">
        <ParallaxLayer depth={-0.08}>
          <Reveal>
            <DepthCard className="text-center">
              <DepthHeading eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />

              {hasText(content.deadlineLabel) && (
                <RsvpDeadline deadlineLabel={content.deadlineLabel} className="mt-7" />
              )}

              <RsvpAction content={content} className="mt-8" />

              {hasText(content.note) && (
                <p className="mx-auto mt-7 mb-0 max-w-xs text-[14px] leading-relaxed text-inv-ink-soft">
                  {content.note}
                </p>
              )}
            </DepthCard>
          </Reveal>
        </ParallaxLayer>
      </div>
    </ParallaxScene>
  );
}
