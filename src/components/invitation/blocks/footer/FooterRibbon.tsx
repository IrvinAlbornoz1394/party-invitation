import { BlockCurve } from '../../shared/BlockCurve';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import {
  FooterCredits,
  FooterLinks,
  FooterMonogram,
  FooterTopLink,
  type FooterVariantProps,
} from './footer-parts';

/**
 * `footer.ribbon` — el pie como una cinta del color principal, en una sola línea.
 *
 * Todo lo contrario del centrado: en lugar de apilar, reparte. El monograma y los nombres a la
 * izquierda, los contactos a la derecha, y el conjunto sobre una franja del color del tema. Es
 * un pie compacto —dos líneas de alto en escritorio— para invitaciones largas, donde un pie
 * centrado de seis líneas se siente como una sección más que hay que seguir bajando.
 *
 * En móvil se apila, porque en 360px una fila con cuatro cosas se convierte en cuatro
 * columnas de dos palabras.
 *
 * ## Lo que demuestra
 *
 * Es el tercer sitio de la biblioteca que se apoya en la pareja `primary`/`onPrimary` —con el
 * panel de detalles y el cierre a pantalla completa—, y aquí se nota especialmente porque va
 * pegado al final: si un tema tiene mal ese par, la invitación termina con la peor impresión
 * posible.
 */
export function FooterRibbon({ content }: FooterVariantProps) {
  return (
    <BlockSection
      block="footer"
      variant="ribbon"
      /* `relative` por la onda del canto; el relleno sigue siendo el del pie compacto. */
      className="relative bg-inv-primary py-12 text-inv-on-primary sm:py-14"
    >
      {/*
        Solo arriba. El canto de abajo del pie es el final de la página, y una onda ahí no se lee
        como papel troquelado sino como una franja que se quedó a medio pintar.
      */}
      <BlockCurve edge="top" className="text-inv-bg" />

      {/*
        El hueco de la onda va en el contenedor y no en el relleno de la sección, y la razón es
        de clases y no de gusto: la sección ya trae `py-…` de `BlockSection`, y `twMerge` no lo
        retira cuando lo que llega es un `pt-…` —solo lo cubre a medias—, así que quedarían dos
        declaraciones de relleno peleándose por el orden de la hoja. Aquí no hay conflicto: el
        contenedor no lleva relleno vertical de partida, y el pie conserva su canto de abajo
        compacto, que es lo que lo hace un pie de una línea.
      */}
      <BlockContainer className="pt-[var(--inv-edge-height,0px)]">
        <div className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between md:gap-14">
          <div className="flex items-center gap-5">
            {content.monogram && (
              <FooterMonogram monogram={content.monogram} tone="inverse" className="shrink-0" />
            )}

            <div>
              <p className="m-0 font-inv-display text-[clamp(1.3rem,2.6vw,1.7rem)] leading-tight font-light">
                {content.names}
              </p>

              {(content.dateLabel || content.city) && (
                <p className="mt-2 mb-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] tracking-[0.2em] uppercase opacity-80">
                  {content.dateLabel && <span>{content.dateLabel}</span>}
                  {content.dateLabel && content.city && (
                    <span aria-hidden="true" className="opacity-60">
                      ·
                    </span>
                  )}
                  {content.city && <span>{content.city}</span>}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-5 md:items-end">
            {content.message && (
              <p className="m-0 max-w-sm text-[14px] leading-relaxed opacity-85 md:text-right">
                {content.message}
              </p>
            )}

            <FooterLinks links={content.links} tone="inverse" className="md:justify-end" />
          </div>
        </div>

        {(content.credits || content.topAction) && (
          /* El filete que separa los créditos se saca del color del texto y no del filete del
             tema: `line` está calculado para el papel claro y sobre el color principal
             desaparecería. */
          <div className="mt-10 flex flex-col items-center gap-4 border-t border-current/20 pt-6 sm:flex-row sm:justify-between">
            {content.credits && <FooterCredits credits={content.credits} tone="inverse" />}
            {content.topAction && (
              <FooterTopLink
                label={content.topAction.label}
                href={content.topAction.href}
                tone="inverse"
              />
            )}
          </div>
        )}
      </BlockContainer>
    </BlockSection>
  );
}
