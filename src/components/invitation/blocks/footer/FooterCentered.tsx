import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import {
  FooterCredits,
  FooterLinks,
  FooterMonogram,
  FooterTopLink,
  type FooterVariantProps,
} from './footer-parts';

/**
 * `footer.centered` — el pie clásico: todo al centro, en un solo eje.
 *
 * Monograma, nombres, fecha y ciudad, los contactos en fila y los créditos abajo. Es el que
 * cierra sin llamar la atención, y por eso es el que conviene después de un mensaje final que sí
 * la llamó: dos remates fuertes seguidos se anulan.
 *
 * Lleva un filete arriba y no un cambio de fondo. Es la señal mínima de que la invitación
 * terminó: con un bloque de color, el pie compite con el mensaje final que tiene justo encima.
 */
export function FooterCentered({ content }: FooterVariantProps) {
  return (
    <BlockSection
      block="footer"
      variant="centered"
      className="border-t border-inv-line py-14 sm:py-16"
    >
      <BlockContainer>
        <div className="flex flex-col items-center text-center">
          {content.monogram && <FooterMonogram monogram={content.monogram} className="mb-7" />}

          <p className="m-0 font-inv-display text-[clamp(1.35rem,3vw,1.8rem)] leading-tight font-light text-inv-primary">
            {content.names}
          </p>

          {(content.dateLabel || content.city) && (
            <p className="mt-3 mb-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12.5px] tracking-[0.2em] text-inv-ink-soft uppercase">
              {content.dateLabel && <span>{content.dateLabel}</span>}
              {content.dateLabel && content.city && (
                <span aria-hidden="true" className="opacity-50">
                  ·
                </span>
              )}
              {content.city && <span>{content.city}</span>}
            </p>
          )}

          {content.message && (
            <p className="mt-6 mb-0 max-w-md text-[14.5px] leading-relaxed text-inv-ink-soft">
              {content.message}
            </p>
          )}

          <FooterLinks links={content.links} className="mt-8 justify-center" />

          {(content.credits || content.topAction) && (
            <div className="mt-10 flex w-full flex-col items-center gap-4 border-t border-inv-line pt-7">
              {content.credits && <FooterCredits credits={content.credits} />}
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
