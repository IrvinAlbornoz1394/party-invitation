import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import {
  FooterCredits,
  FooterLinks,
  FooterTopLink,
  type FooterVariantProps,
} from './footer-parts';

/**
 * `footer.marquee` — el nombre cruzando la pantalla, en grande y sin parar.
 *
 * El pie deja de ser un bloque de datos y pasa a ser un rótulo: los nombres se repiten en
 * tipografía de titulares dentro de una cinta que se desplaza despacio, y debajo quedan la
 * fecha, los contactos y los créditos en cuerpo pequeño. Es lo que hace un cartel de festival o
 * la contraportada de un disco, y en una invitación cierra con una firma visual en lugar de con
 * un formulario de contacto.
 *
 * Conviene con nombres cortos —«Ana & Diego», «Kamilah»— que es cuando un rótulo funciona. Con
 * un nombre completo de cinco palabras la cinta se convierte en un texto corriendo, que es otra
 * cosa y peor.
 *
 * ## Sin JavaScript
 *
 * La tira lleva dos copias del contenido y se desplaza exactamente la mitad, así que el
 * reinicio cae donde la pantalla enseña lo mismo. Igual que la pasarela de la galería, pero aquí
 * no hay que arrastrar ni medir, así que lo hace CSS: cero peso, cero hidratación y el pie sigue
 * siendo un componente de servidor.
 *
 * ## Lo que se lee y lo que se ve
 *
 * La cinta está marcada como decorativa. Un lector de pantalla anunciando ocho veces el mismo
 * nombre no informa, entorpece; el nombre se expone una sola vez, para lectura asistida, junto
 * a la fecha. Es la diferencia entre repetir por diseño y repetir por descuido.
 */

/** Cuántas veces se repite el nombre en cada copia de la tira. */
const REPEATS = 4;

export function FooterMarquee({ content }: FooterVariantProps) {
  const copy = Array.from({ length: REPEATS }, (_, index) => index);

  return (
    <BlockSection block="footer" variant="marquee" className="py-0">
      <div
        aria-hidden="true"
        className="overflow-hidden border-y border-inv-line py-8 select-none sm:py-10"
      >
        <div className="inv-marquee flex w-max">
          {[0, 1].map((track) => (
            <div key={track} className="flex">
              {copy.map((index) => (
                <span
                  key={index}
                  className="flex items-center gap-8 pr-8 font-inv-display text-[clamp(2.2rem,6vw,4.5rem)] leading-none font-light whitespace-nowrap text-inv-primary"
                >
                  {content.names}
                  <span className="text-inv-accent opacity-60">·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <BlockContainer className="py-12">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            {/* El nombre, una sola vez y solo para lectura asistida: en pantalla ya está en la
                cinta, ocho veces y en cuerpo de cartel. */}
            <span className="sr-only">{content.names}</span>

            {(content.dateLabel || content.city) && (
              <p className="m-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12.5px] tracking-[0.2em] text-inv-ink-soft uppercase sm:justify-start">
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
              <p className="mt-3 mb-0 max-w-sm text-[14px] leading-relaxed text-inv-ink-soft">
                {content.message}
              </p>
            )}
          </div>

          <FooterLinks links={content.links} className="justify-center sm:justify-end" />
        </div>

        {(content.credits || content.topAction) && (
          <div className="mt-10 flex flex-col items-center gap-4 border-t border-inv-line pt-6 sm:flex-row sm:justify-between">
            {content.credits && <FooterCredits credits={content.credits} />}
            {content.topAction && (
              <FooterTopLink label={content.topAction.label} href={content.topAction.href} />
            )}
          </div>
        )}
      </BlockContainer>
    </BlockSection>
  );
}
