import { Heart } from 'lucide-react';
import { BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { FooterCredits, FooterLinks, FooterTopLink, type FooterVariantProps } from './footer-parts';

/**
 * `footer.numeral` — el nombre a pincel, grande, escrito encima de un «15» enorme y pálido, y
 * debajo, en pequeño, la fecha, el mensaje y los contactos.
 *
 * Es el pie de `coquette`, y el final de la referencia: la firma sobre el número. Cierra con el
 * mismo gesto con el que la portada abrió —el «15» del acento a poca opacidad—, solo que allí el
 * número sostiene el rótulo y aquí sostiene el nombre. Los otros pies cierran con un monograma,
 * un sello o una franja; este, con **la firma**.
 *
 * El «15», como en la portada, no es contenido: es la marca de la celebración, y la plantilla solo
 * se ofrece para XV. Es decoración (`aria-hidden`), y el monograma del contenido no se pinta: el
 * nombre a pincel ya es la firma, y unas iniciales encima la repetirían.
 */
export function FooterNumeral({ content }: FooterVariantProps) {
  return (
    <BlockSection block="footer" variant="numeral" className="px-6 pt-16 pb-12 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <div className="relative grid w-full place-items-center">
          <span
            aria-hidden="true"
            className="font-inv-display text-[clamp(8rem,46vw,12rem)] leading-[0.8] text-inv-primary opacity-20 select-none"
          >
            15
          </span>
          <p className="absolute inset-x-0 top-1/2 m-0 -translate-y-1/2 px-4 font-inv-script text-[clamp(2.4rem,10.5vw,4rem)] leading-[1] text-balance text-inv-primary">
            {content.names}
          </p>
        </div>

        {(hasText(content.dateLabel) || hasText(content.city)) && (
          <p className="mt-8 mb-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-inv-display text-[11.5px] tracking-[0.22em] text-inv-ink-soft uppercase">
            {hasText(content.dateLabel) && <span>{content.dateLabel}</span>}
            {hasText(content.dateLabel) && hasText(content.city) && (
              <Heart size={8} strokeWidth={0} aria-hidden="true" className="fill-current text-inv-accent" />
            )}
            {hasText(content.city) && <span>{content.city}</span>}
          </p>
        )}
        {hasText(content.message) && (
          <p className="mt-5 mb-0 max-w-xs font-inv-display text-[15px] leading-relaxed text-inv-accent">
            {content.message}
          </p>
        )}

        <FooterLinks links={content.links} className="mt-7 justify-center" />

        {(hasText(content.credits) || content.topAction) && (
          <div className="mt-10 flex w-full flex-col items-center gap-4 border-0 border-t border-solid border-inv-primary/20 pt-7">
            {hasText(content.credits) && <FooterCredits credits={content.credits} />}
            {content.topAction && (
              <FooterTopLink label={content.topAction.label} href={content.topAction.href} />
            )}
          </div>
        )}
      </div>
    </BlockSection>
  );
}
