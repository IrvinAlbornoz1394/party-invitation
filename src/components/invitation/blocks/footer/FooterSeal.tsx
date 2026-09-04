import { BlockOrnament } from '../../shared/BlockOrnament';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import {
  FooterCredits,
  FooterLinks,
  FooterMonogram,
  FooterTopLink,
  type FooterVariantProps,
} from './footer-parts';

/**
 * `footer.seal` — el pie como el lacre del final: una lámina del color principal, el monograma
 * cercado por un doble filete y todo lo demás debajo, en un solo eje.
 *
 * Es el sexto pie del catálogo y el de `silk`. Los cinco anteriores reparten:
 *
 *   `centered`  clásico, todo en un eje sobre el papel del tema.
 *   `ribbon`    una cinta de color de un solo renglón, con la onda arriba.
 *   `marquee`   el nombre cruzando la pantalla en movimiento.
 *   `colophon`  doble filete, mancheta y corondeles: el final de una revista.
 *   `sprig`     otra hoja, rasgada, con el monograma entre dos ramitas.
 *
 * Este es el único que **cierra en oscuro y centrado**. `ribbon` también se tiñe del color
 * principal, pero es una cinta de una línea con el contenido repartido a los dos lados: dice «se
 * acabó la página». Aquí la lámina es alta y todo cae en el eje central bajo el sello, que dice
 * otra cosa —«se acabó la carta»—, y es el remate que pide una invitación cuya referencia termina
 * en un plano oscuro a pantalla completa.
 *
 * ## El doble filete no es adorno repetido
 *
 * `FooterMonogram` ya dibuja un círculo con su filete y lo usan los otros pies. Aquí se envuelve
 * en un segundo cerco separado por un pelo de aire, y esa separación es todo el gesto: un anillo
 * dentro de otro es un **sello**, mientras que un solo círculo es un botón o una viñeta. Es la
 * misma diferencia que el doble filete de `story.pressed`, y la razón por la que se compone
 * envolviendo la pieza compartida en vez de escribir otro monograma: lo que cambia es el cerco,
 * no la letra.
 *
 * Sin monograma —que es un caso real: la boda del catálogo no lo trae— el sello se sustituye por
 * el ornamento del tema. Un cerco doble vacío se lee como una imagen que no cargó, y dejar el
 * hueco descuadraría el eje del que cuelga todo lo demás.
 *
 * ## Los colores no se eligen aquí
 *
 * La lámina es `primary` y la tinta `onPrimary`, que es la pareja de contraste que el tema
 * garantiza (`withReadableText`, en `domain/invitation/theme.ts`). Los filetes van con
 * `current/…` y no con `line`: ese token está calculado contra el papel claro y sobre el color
 * principal desaparecería — el mismo motivo por el que `footer.ribbon` no lo usa.
 */
export function FooterSeal({ content }: FooterVariantProps) {
  return (
    <BlockSection
      block="footer"
      variant="seal"
      className="bg-inv-primary py-16 text-center text-inv-on-primary sm:py-20"
    >
      <BlockContainer className="flex max-w-xl flex-col items-center">
        {content.monogram ? (
          /* El segundo cerco: el relleno es el aire entre los dos filetes, y es lo que convierte
             un medallón en un sello. */
          <span className="rounded-full border border-current/25 p-2">
            <FooterMonogram monogram={content.monogram} tone="inverse" />
          </span>
        ) : (
          <BlockOrnament />
        )}

        <p className="mt-8 mb-0 font-inv-display text-[clamp(1.6rem,4.5vw,2.3rem)] leading-tight font-light">
          {content.names}
        </p>

        {(content.dateLabel || content.city) && (
          <p className="mt-4 mb-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] tracking-[0.24em] uppercase opacity-80">
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
          <p className="mt-8 mb-0 max-w-sm text-[14px] leading-relaxed opacity-85">
            {content.message}
          </p>
        )}

        <FooterLinks links={content.links} tone="inverse" className="mt-9 justify-center" />

        {(content.credits || content.topAction) && (
          <div className="mt-12 flex w-full flex-col items-center gap-4 border-t border-current/20 pt-7">
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
