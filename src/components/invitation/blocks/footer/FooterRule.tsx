import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import {
  FooterCredits,
  FooterLinks,
  FooterTopLink,
  type FooterVariantProps,
} from './footer-parts';

/**
 * `footer.rule` — el pie de un filete: una línea fina, los nombres en versalitas espaciadas y
 * todo lo demás diminuto y centrado.
 *
 * Es el séptimo pie y el más callado. Los otros seis rematan con algo —medallón, cinta de color,
 * rótulo en movimiento, doble filete con corondeles, hoja rasgada con ramitas, lámina oscura con
 * sello—, y este remata con **el mismo filete que ya separa las secciones de la estructura**. No
 * hay pieza final: la invitación se acaba como se ha leído entera.
 *
 * ## Sin monograma, y es la diferencia con `footer.centered`
 *
 * Aquel también centra todo en un eje, pero abre con `FooterMonogram`: las iniciales dentro de un
 * círculo de filete. Aquí el círculo no cabe —es la forma geométrica que esta estructura no
 * tiene— y las iniciales tampoco hacen falta: la firma de la invitación ya está dos pantallas
 * antes, en la despedida manuscrita de `closing.script`, y repetirla en un medallón la abarata.
 *
 * Lo que queda es el nombre en versalitas muy espaciadas, que es como se compone el pie de una
 * papelería impresa cuando el nombre ya se ha dicho en grande en la portada.
 *
 * ## Por qué el nombre no va en la caligrafía
 *
 * Sería lo fácil —la estructura la usa en todos sus rótulos— y sería un error. La caligrafía
 * aparece tres veces con un papel claro: los nombres de la portada, los rótulos de sección y la
 * despedida. Una cuarta, ochenta píxeles debajo de la tercera, convierte la firma en un patrón
 * decorativo. El pie es el sitio donde esta estructura deja de adornar.
 */
export function FooterRule({ content }: FooterVariantProps) {
  return (
    <BlockSection block="footer" variant="rule" className="py-14 sm:py-16">
      <BlockContainer className="flex max-w-xl flex-col items-center text-center">
        <span aria-hidden="true" className="block h-px w-full bg-inv-line" />

        <p className="mt-12 mb-0 text-[12px] tracking-[0.34em] text-inv-ink uppercase sm:text-[13px]">
          {content.names}
        </p>

        {(content.dateLabel || content.city) && (
          <p className="mt-4 mb-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] tracking-[0.18em] text-inv-ink-soft">
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
          <p className="mt-7 mb-0 max-w-sm text-[13.5px] leading-relaxed text-inv-ink-soft">
            {content.message}
          </p>
        )}

        <FooterLinks links={content.links} className="mt-8 justify-center" />

        {(content.credits || content.topAction) && (
          <div className="mt-12 flex flex-col items-center gap-4">
            {content.topAction && (
              <FooterTopLink label={content.topAction.label} href={content.topAction.href} />
            )}
            {content.credits && <FooterCredits credits={content.credits} />}
          </div>
        )}
      </BlockContainer>
    </BlockSection>
  );
}
