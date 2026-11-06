import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { DoodleHeart, FloralSpray, Flourish } from '../../shared/nocturne-ornaments';
import { WATERCOLOR } from '../../shared/nocturne-assets';
import { FooterCredits, FooterLinks, FooterTopLink, type FooterVariantProps } from './footer-parts';

/**
 * `footer.midnight` — el pie de `nocturne`: la invitación termina donde empezó, en la noche. El
 * azul medianoche, una rama de lila colgando de una esquina, el monograma dentro del corazón
 * dorado de la portada, los nombres en inglesa y el florón en oro antes de la fecha.
 *
 * El corazón hace aquí de medallón: las iniciales van dentro de él, y así el dibujo que abrió la
 * portada cierra el pie. Sin monograma, el corazón va solo.
 */
export function FooterMidnight({ content }: FooterVariantProps) {
  return (
    <BlockSection
      block="footer"
      variant="midnight"
      className="relative isolate overflow-hidden bg-inv-ink py-20 text-center text-inv-bg"
    >
      <FloralSpray
        asset={WATERCOLOR.lilac}
        motion="sway"
        rotate={200}
        className="-top-8 -left-16 -z-10 w-40 opacity-90 sm:w-48"
      />
      <FloralSpray
        asset={WATERCOLOR.jasmine}
        motion="sway"
        rotate={-30}
        className="-right-14 -bottom-12 -z-10 w-32 opacity-75 sm:w-40"
        style={{ ['--inv-sway-delay' as string]: '-6s' }}
      />

      <BlockContainer className="flex max-w-xl flex-col items-center">
        <span className="relative grid w-28 place-items-center">
          <DoodleHeart className="w-full" />
          {hasText(content.monogram) && (
            <span className="absolute inset-0 grid place-items-center pt-3 pr-2 font-inv-display text-[1.35rem] font-semibold tracking-[0.06em] text-inv-bg">
              {content.monogram}
            </span>
          )}
        </span>

        <p className="mt-6 mb-0 font-inv-script text-[clamp(2.8rem,13vw,3.8rem)] leading-[1.05]">
          {content.names}
        </p>

        <Flourish className="mt-5 w-48 text-inv-accent" />

        {(hasText(content.dateLabel) || hasText(content.city)) && (
          <p className="mt-5 mb-0 text-[13px] tracking-[0.16em] uppercase text-inv-bg/85">
            {content.dateLabel}
            {hasText(content.dateLabel) && hasText(content.city) && <> · </>}
            {content.city}
          </p>
        )}

        {hasText(content.message) && (
          <p className="mt-7 mb-0 max-w-sm text-[15px] leading-relaxed text-inv-bg/80">{content.message}</p>
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
      </BlockContainer>
    </BlockSection>
  );
}
