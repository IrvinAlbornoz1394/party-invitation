import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { CrownGlyph } from '../../shared/paper-ornaments';
import {
  FooterCredits,
  FooterLinks,
  FooterTopLink,
  type FooterVariantProps,
} from './footer-parts';

/**
 * `footer.frame` — el pie dentro de un cartucho: un doble filete que encierra el nombre, los
 * contactos y los créditos, con la corona coronándolo.
 *
 * Es el noveno pie y el único **enmarcado por los cuatro lados**. Los ocho anteriores cierran con
 * una línea, una franja, una cinta, una hoja o una lámina; este dibuja un recuadro y mete dentro
 * todo lo que queda por decir. Es el colofón de una participación grabada: donde en una impresa
 * irían los datos de la imprenta, aquí van el nombre y el teléfono.
 *
 * Con `footer.colophon` —el de `editorial`— comparte el doble filete y no la forma: aquel son dos
 * líneas **horizontales** con la mancheta entre ellas, la retórica de una revista; este es un
 * rectángulo cerrado, la de un grabado. Y con `footer.seal`, la corona hace lo que allí hace el
 * monograma, con una diferencia que importa: el monograma es contenido —lo escribe el
 * organizador— y la corona es la firma de la plantilla, como en su portada.
 *
 * ## La corona se monta sobre el filete
 *
 * Encabalgada en el canto de arriba y con el fondo de la sección detrás, así el recuadro parece
 * abrirse para dejarla pasar. Es el mismo recurso del medallón de `closing.note`, y aquí resuelve
 * además un problema real: una corona **dentro** del recuadro, con el nombre debajo, deja el pie
 * con dos piezas centradas y mucho aire muerto arriba.
 */
export function FooterFrame({ content }: FooterVariantProps) {
  return (
    <BlockSection block="footer" variant="frame" className="pb-16 sm:pb-20">
      <BlockContainer className="max-w-md">
        <div className="border border-inv-accent/50 p-1.5">
          <div className="flex flex-col items-center border border-inv-accent/30 px-6 pt-0 pb-11 text-center sm:px-10">
            {/* La corona, montada sobre el filete: el margen negativo la saca del recuadro y el
                fondo de la sección tapa el trozo de línea que cruza. */}
            <span className="-mt-5 bg-inv-bg px-4">
              <CrownGlyph className="h-8 w-14 text-inv-accent" />
            </span>

            <p className="mt-7 mb-0 font-inv-script text-[clamp(1.9rem,7vw,2.6rem)] leading-none text-inv-accent">
              {content.names}
            </p>

            {(content.dateLabel || content.city) && (
              <p className="mt-5 mb-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10.5px] tracking-[0.24em] text-inv-ink-soft uppercase">
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
              <p className="mt-6 mb-0 max-w-xs text-[13px] leading-relaxed text-inv-ink-soft">
                {content.message}
              </p>
            )}

            <FooterLinks links={content.links} className="mt-7 justify-center" />

            {(content.credits || content.topAction) && (
              <div className="mt-9 flex w-full flex-col items-center gap-3 border-t border-inv-accent/25 pt-6">
                {content.topAction && (
                  <FooterTopLink label={content.topAction.label} href={content.topAction.href} />
                )}
                {content.credits && <FooterCredits credits={content.credits} />}
              </div>
            )}
          </div>
        </div>
      </BlockContainer>
    </BlockSection>
  );
}
