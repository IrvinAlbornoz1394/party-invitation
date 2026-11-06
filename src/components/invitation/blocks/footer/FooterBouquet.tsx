import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { Blob, CLAY_TAN, CupidArrow, DoodleBouquet, Squiggle } from '../../shared/terracotta-ornaments';
import { FooterCredits, FooterLinks, FooterTopLink, type FooterVariantProps } from './footer-parts';

/**
 * `footer.bouquet` — el pie de `terracota`: el ramo atado con lazo que hace de marca en la puerta,
 * los nombres a pincel en terracota dentro del mismo rótulo de filete de la portada, la fecha y la
 * ciudad, la flecha de Cupido y los enlaces. Manchas de barro en las esquinas, como al empezar.
 *
 * El monograma no se pinta: el rótulo con los nombres ya es la firma de esta plantilla.
 */
export function FooterBouquet({ content }: FooterVariantProps) {
  return (
    <BlockSection block="footer" variant="bouquet" className="relative isolate overflow-hidden bg-inv-bg py-20 text-center">
      <Blob shape="wave" outline className={`-top-4 -right-10 -z-10 h-40 w-48 ${CLAY_TAN}`} />
      <Blob shape="slab" className="top-1/3 -left-24 -z-10 h-56 w-32 text-inv-primary sm:-left-12" />
      <Squiggle className={`bottom-8 -right-8 -z-10 w-44 ${CLAY_TAN}`} />

      <BlockContainer className="flex max-w-xl flex-col items-center">
        <DoodleBouquet className="w-36" />

        <p className="mt-6 mb-0 border-2 border-solid border-inv-primary px-5 py-1.5 font-inv-display text-[clamp(1.8rem,8vw,2.4rem)] leading-[1.2] text-inv-primary">
          {content.names}
        </p>

        {(hasText(content.dateLabel) || hasText(content.city)) && (
          <p className="mt-5 mb-0 text-[15px] font-medium text-inv-ink">
            {content.dateLabel}
            {hasText(content.dateLabel) && hasText(content.city) && <> · </>}
            <span className="text-inv-ink-soft">{content.city}</span>
          </p>
        )}

        <CupidArrow className="mt-6" />

        {hasText(content.message) && (
          <p className="mt-6 mb-0 max-w-sm text-[15.5px] leading-relaxed text-inv-ink-soft">{content.message}</p>
        )}

        <FooterLinks links={content.links} className="mt-8 justify-center" />

        {(hasText(content.credits) || content.topAction) && (
          <div className="mt-12 flex w-full flex-col items-center gap-4 border-t border-solid border-inv-line pt-7">
            {hasText(content.credits) && <FooterCredits credits={content.credits} />}
            {content.topAction && <FooterTopLink label={content.topAction.label} href={content.topAction.href} />}
          </div>
        )}
      </BlockContainer>
    </BlockSection>
  );
}
