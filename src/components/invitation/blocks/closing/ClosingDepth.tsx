'use client';

import { ActionLink } from '../../shared/ActionLink';
import { hasText } from '../../shared/has-text';
import { DepthPhoto, DepthRule } from '../../shared/mirador-parts';
import { ParallaxLayer, ParallaxScene } from '../../shared/Parallax';
import { Reveal } from '../../shared/Reveal';
import type { ClosingVariantProps } from './closing-parts';

/**
 * `closing.depth` — la despedida de `mirador`: una última ventana casi a pantalla completa.
 *
 * Es la imagen especular de la portada. Allí el texto se va desvaneciendo al salir; aquí entra
 * y se queda, así que no lleva `ParallaxFade`: solo planos. El agradecimiento sube con la página
 * y la firma, en caligrafía grande, va en su propio plano más rápido, de modo que se acerca al
 * título a medida que se baja y termina asentándose debajo de él.
 *
 * No usa `ClosingMessage` porque esa pieza pinta la firma en el mismo plano que el texto, y aquí
 * la firma es justamente la capa que se mueve aparte.
 */
export function ClosingDepth({ content }: ClosingVariantProps) {
  return (
    <ParallaxScene
      block="closing"
      variant="depth"
      className="inv-on-photo flex min-h-[calc(var(--inv-viewport,100svh)*0.9)] items-center bg-inv-ink py-[var(--inv-space-block)] font-inv-body"
    >
      <DepthPhoto image={content.image} />

      <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center px-6 text-center sm:px-10">
        <ParallaxLayer depth={-0.06} className="flex flex-col items-center">
          <Reveal className="flex flex-col items-center">
            {hasText(content.eyebrow) && (
              <p className="m-0 flex items-center justify-center gap-3 text-[11px] tracking-[0.32em] uppercase opacity-85">
                <span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />
                {content.eyebrow}
                <span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />
              </p>
            )}
            <h2 className="mx-auto mt-5 mb-0 max-w-[16ch] font-inv-display text-[clamp(2.4rem,9.5vw,4.5rem)] leading-[1.04] font-normal italic">
              {content.title}
            </h2>
            {hasText(content.message) && (
              <p className="mx-auto mt-7 mb-0 max-w-md text-[16px] leading-relaxed opacity-90">{content.message}</p>
            )}
          </Reveal>
        </ParallaxLayer>

        {hasText(content.signature) && (
          <ParallaxLayer depth={-0.2} className="mt-10 flex flex-col items-center">
            <DepthRule tone="photo" className="h-10" />
            <p className="mt-5 mb-0 font-inv-script text-[clamp(3rem,13vw,5.5rem)] leading-none text-inv-accent">
              {content.signature}
            </p>
          </ParallaxLayer>
        )}

        {content.action && (
          <ActionLink
            label={content.action.label}
            href={content.action.href}
            tone="onImage"
            className="mt-12"
          />
        )}
      </div>
    </ParallaxScene>
  );
}
