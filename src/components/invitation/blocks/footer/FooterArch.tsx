import { requireDesignAsset } from '@/lib/design-assets';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { DesignAsset } from '../../shared/DesignAsset';
import {
  FooterCredits,
  FooterLinks,
  FooterTopLink,
  type FooterVariantProps,
} from './footer-parts';

const DIVIDER = requireDesignAsset('botanical-divider-002');

/**
 * `footer.arch` — el monograma en manuscrita dentro de un arco pequeño, y debajo el nombre,
 * también a mano.
 *
 * Es el pie de `arbor`. Los otros nueve encierran el monograma en un círculo, en un doble cerco o
 * en un cartucho, o lo omiten; este lo pone en la misma ventana de medio punto que la invitación
 * ha repetido en cada sección, a tamaño de sello. Es la firma de la plantilla en su última
 * línea.
 *
 * El arco crece en ancho con el monograma: una inicial queda esbelta y «A&D» lo ensancha, en vez
 * de apretarse dentro de un ancho fijo. Sin monograma, el arco no se dibuja vacío: queda la
 * ramita.
 */
export function FooterArch({ content }: FooterVariantProps) {
  return (
    <BlockSection block="footer" variant="arch" className="py-16 sm:py-20">
      <BlockContainer className="max-w-xl">
        <div className="flex flex-col items-center text-center">
          {hasText(content.monogram) ? (
            <span className="flex h-24 min-w-[4.5rem] items-end justify-center rounded-t-full border border-inv-accent/50 px-4 pb-3.5 font-inv-script text-[2.4rem] leading-none text-inv-accent">
              {content.monogram}
            </span>
          ) : (
            <DesignAsset asset={DIVIDER} className="w-28 text-inv-primary opacity-85" />
          )}

          <p className="mt-6 mb-0 font-inv-script text-[clamp(1.9rem,7vw,2.5rem)] leading-[1.15] text-inv-accent">
            {content.names}
          </p>
          {(hasText(content.dateLabel) || hasText(content.city)) && (
            <p className="mt-3 mb-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] tracking-[0.22em] text-inv-ink-soft uppercase">
              {hasText(content.dateLabel) && <span>{content.dateLabel}</span>}
              {hasText(content.dateLabel) && hasText(content.city) && (
                <span aria-hidden="true" className="opacity-50">
                  ·
                </span>
              )}
              {hasText(content.city) && <span>{content.city}</span>}
            </p>
          )}
          {hasText(content.message) && (
            <p className="mt-6 mb-0 max-w-sm text-[14px] leading-relaxed text-inv-ink">
              {content.message}
            </p>
          )}

          <FooterLinks links={content.links} className="mt-8 justify-center" />

          {(hasText(content.credits) || content.topAction) && (
            <div className="mt-10 flex w-full flex-col items-center gap-4 border-t border-inv-line pt-7">
              {hasText(content.credits) && <FooterCredits credits={content.credits} />}
              {content.topAction && (
                <FooterTopLink label={content.topAction.label} href={content.topAction.href} />
              )}
            </div>
          )}
        </div>
      </BlockContainer>
    </BlockSection>
  );
}
