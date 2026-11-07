'use client';

import { hasText } from '../../shared/has-text';
import { DepthWord } from '../../shared/mirador-parts';
import { ParallaxLayer, ParallaxScene } from '../../shared/Parallax';
import { FooterCredits, FooterLinks, FooterMonogram, FooterTopLink, type FooterVariantProps } from './footer-parts';

/**
 * `footer.depth` — el pie de `mirador`: la noche después de la última ventana.
 *
 * El fondo es la tinta del tema y, detrás de todo, los nombres en filete a tamaño de cartel que
 * se deslizan a otra velocidad, así que el pie también tiene profundidad aunque no lleve foto.
 * Delante, lo de siempre en un pie: monograma, nombres, fecha, enlaces y créditos, en claro.
 */
export function FooterDepth({ content }: FooterVariantProps) {
  return (
    <ParallaxScene
      as="footer"
      block="footer"
      variant="depth"
      className="bg-inv-ink py-20 text-center font-inv-body text-inv-on-primary sm:py-24"
    >
      <DepthWord tone="photo" depth={-0.22} className="top-1/2 -translate-y-1/2">
        {content.names}
      </DepthWord>

      <ParallaxLayer depth={-0.05} className="mx-auto flex w-full max-w-xl flex-col items-center px-6 sm:px-10">
        {hasText(content.monogram) && <FooterMonogram monogram={content.monogram} tone="inverse" />}

        <p className="mt-6 mb-0 font-inv-display text-[clamp(2.2rem,10vw,3.4rem)] leading-[1.05] italic">
          {content.names}
        </p>

        {(hasText(content.dateLabel) || hasText(content.city)) && (
          <p className="mt-5 mb-0 text-[12px] tracking-[0.28em] uppercase opacity-80">
            {content.dateLabel}
            {hasText(content.dateLabel) && hasText(content.city) && (
              <span aria-hidden="true" className="mx-3 opacity-60">
                ·
              </span>
            )}
            {content.city}
          </p>
        )}

        {hasText(content.message) && (
          <p className="mt-7 mb-0 max-w-sm text-[15px] leading-relaxed opacity-80">{content.message}</p>
        )}

        <FooterLinks links={content.links} tone="inverse" className="mt-9 justify-center" />

        {(hasText(content.credits) || content.topAction) && (
          <div className="mt-12 flex w-full flex-col items-center gap-4 border-t border-current/15 pt-7">
            {hasText(content.credits) && <FooterCredits credits={content.credits} tone="inverse" />}
            {content.topAction && (
              <FooterTopLink label={content.topAction.label} href={content.topAction.href} tone="inverse" />
            )}
          </div>
        )}
      </ParallaxLayer>
    </ParallaxScene>
  );
}
