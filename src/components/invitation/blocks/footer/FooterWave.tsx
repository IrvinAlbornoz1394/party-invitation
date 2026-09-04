import { BlockCurve } from '../../shared/BlockCurve';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import {
  FooterCredits,
  FooterLinks,
  FooterTopLink,
  type FooterVariantProps,
} from './footer-parts';

/**
 * `footer.wave` — el pie bajo una onda: la franja del color principal mordida por el papel, y el
 * nombre en letras vaciadas.
 *
 * Es el octavo pie. Con `footer.ribbon` comparte el fondo teñido y la onda de arriba, y se separa
 * en las dos cosas que hacen a esta estructura:
 *
 *   `ribbon`  una cinta de **un renglón**, con el contenido repartido a izquierda y derecha. Es
 *             interfaz: el pie de una página que se acaba.
 *   `wave`    una franja **alta y centrada**, con el nombre a cuerpo de cartel y vaciado. Es la
 *             última ilustración de la invitación, no el final de un documento.
 *
 * El nombre vaciado sobre el color principal es el mismo recurso que los rótulos de sección de
 * esta plantilla —`.inv-outline-text`—, y aquí hace algo más: sobre una franja teñida, una letra
 * hueca deja ver el color a través, así que el pie se lee como parte de la franja y no como texto
 * puesto encima.
 *
 * ## La onda solo arriba
 *
 * Igual que en `footer.ribbon` y por lo mismo: el canto de abajo del pie es el final de la
 * página, y una onda ahí no se lee como papel troquelado sino como una franja a medio pintar.
 *
 * Y como allí, el hueco de la onda va en el relleno del **contenedor** y no en el de la sección:
 * `BlockSection` ya trae su `py-…`, y `twMerge` no lo retira cuando llega un `pt-…`, así que
 * quedarían dos declaraciones peleándose por el orden de la hoja.
 */
export function FooterWave({ content }: FooterVariantProps) {
  return (
    <BlockSection
      block="footer"
      variant="wave"
      className="relative bg-inv-primary py-14 text-center text-inv-on-primary sm:py-16"
    >
      <BlockCurve edge="top" className="text-inv-bg" />

      <BlockContainer className="flex flex-col items-center pt-[var(--inv-edge-height,0px)]">
        {content.monogram && (
          <p className="m-0 font-inv-script text-[2rem] leading-none opacity-90">
            {content.monogram}
          </p>
        )}

        <p className="inv-outline-text mt-6 mb-0 font-inv-display text-[clamp(1.9rem,8vw,3.2rem)] leading-[1.05] font-bold tracking-[0.04em] uppercase">
          {content.names}
        </p>

        {(content.dateLabel || content.city) && (
          <p className="mt-5 mb-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11.5px] tracking-[0.2em] uppercase opacity-85">
            {content.dateLabel && <span>{content.dateLabel}</span>}
            {content.dateLabel && content.city && (
              <span aria-hidden="true" className="opacity-60">
                ·
              </span>
            )}
            {content.city && <span>{content.city}</span>}
          </p>
        )}

        {content.message && (
          <p className="mt-7 mb-0 max-w-sm text-[14px] leading-relaxed opacity-90">
            {content.message}
          </p>
        )}

        <FooterLinks links={content.links} tone="inverse" className="mt-8 justify-center" />

        {(content.credits || content.topAction) && (
          <div className="mt-11 flex w-full flex-col items-center gap-4 border-t border-current/20 pt-6">
            {content.topAction && (
              <FooterTopLink
                label={content.topAction.label}
                href={content.topAction.href}
                tone="inverse"
              />
            )}
            {content.credits && <FooterCredits credits={content.credits} tone="inverse" />}
          </div>
        )}
      </BlockContainer>
    </BlockSection>
  );
}
