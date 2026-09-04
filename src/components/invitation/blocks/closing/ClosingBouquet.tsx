import { ActionLink } from '../../shared/ActionLink';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { Bouquet } from '../../shared/doodle-ornaments';
import type { ClosingVariantProps } from './closing-parts';

/**
 * `closing.bouquet` — la despedida entre dos ramilletes dibujados, con la firma en manuscrita a
 * cuerpo grande.
 *
 * Es el octavo cierre y el único **simétrico por composición**: dos dibujos iguales y espejados a
 * los lados del texto. Los otros siete resuelven el remate con una pieza —un sobre, una carta, un
 * álbum, una tarjeta— o quitándolas todas; este lo resuelve con un par, que es como se cierra una
 * invitación ilustrada y como termina la referencia de `sketch`.
 *
 * ## El espejo es de verdad, y por eso hay que forzarlo
 *
 * El de la derecha es el mismo dibujo con `-scale-x-100`. Dibujar un segundo ramillete «parecido»
 * habría dado dos ilustraciones distintas —el ojo lo nota enseguida en una composición
 * centrada— y dos veces el mismo sin espejar deja los dos tallos inclinados hacia el mismo lado,
 * que se lee como un error de montaje.
 *
 * ## La firma manda sobre la frase
 *
 * Al revés que en la mayoría: aquí lo grande es `signature` —«Con cariño, Ana y Diego»— y la
 * frase de despedida va encima, más pequeña. Es lo que hace la referencia y tiene su lógica: en
 * una invitación ilustrada el último gesto es la rúbrica, no el mensaje. Cuando no hay firma, el
 * título ocupa su sitio y su cuerpo, así que la composición no se queda coja.
 */
export function ClosingBouquet({ content }: ClosingVariantProps) {
  return (
    <BlockSection block="closing" variant="bouquet">
      <BlockContainer className="max-w-2xl">
        <div className="flex items-end justify-center gap-5 sm:gap-10">
          <Bouquet className="w-14 shrink-0 text-inv-primary sm:w-20" />

          <div className="min-w-0 flex-1 pb-2 text-center">
            {content.eyebrow && (
              <p className="m-0 text-[10.5px] tracking-[0.26em] text-inv-accent uppercase">
                {content.eyebrow}
              </p>
            )}

            <p className="mt-5 mb-0 text-[15px] leading-relaxed text-inv-ink-soft">
              {content.title}
            </p>

            {content.signature ? (
              <p className="mt-6 mb-0 font-inv-script text-[clamp(2rem,8vw,3rem)] leading-[1.05] text-inv-primary">
                {content.signature}
              </p>
            ) : null}
          </div>

          {/* El mismo dibujo, espejado. Ver la cabecera. */}
          <Bouquet className="w-14 shrink-0 -scale-x-100 text-inv-primary sm:w-20" />
        </div>

        {content.message && (
          <p className="mx-auto mt-8 mb-0 max-w-md text-center text-[14px] leading-relaxed text-inv-ink-soft">
            {content.message}
          </p>
        )}

        {content.action && (
          <div className="mt-10 text-center">
            <ActionLink label={content.action.label} href={content.action.href} tone="onSurface" />
          </div>
        )}
      </BlockContainer>
    </BlockSection>
  );
}
