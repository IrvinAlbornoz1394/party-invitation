import { ActionLink } from '../../shared/ActionLink';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { paletteIsNamed } from '@/domain/invitation/blocks/dresscode';
import { Swatch } from './dresscode-parts';
import type { DresscodeVariantProps } from './dresscode-variant';

/**
 * `dresscode.bands` — los colores como franjas verticales a sangre, y el texto encima.
 *
 * Es la de `cinematic`, y cumple sus dos reglas: todo a pantalla completa y muy poco texto por
 * vista. Las otras cuatro enseñan la paleta **dentro** de la página —una fila, una rejilla, una
 * carta, un hilo—; esta la convierte en la página. No hay contenedor, no hay filete y no hay
 * muestra: hay color de canto a canto, que es lo que hace esa plantilla con la fotografía en la
 * portada y con el cierre.
 *
 * ## El texto va sobre las franjas, y por eso lleva velo
 *
 * Es el mismo problema que una portada sobre fotografía y se resuelve igual: los colores de una
 * paleta de boda son claros —marfiles, arenas, lavandas— y un texto claro encima desaparecería. Va
 * `inv-scrim` con `data-from="center"`, que es el velo para cuando el texto ocupa el medio, más
 * `inv-on-photo` sobre el propio texto para el píxel suelto. Ni un color escrito a mano: el velo
 * sale de `overlay`, que lo decide el tema.
 *
 * Y por eso el encabezado va en `tone="inverse"`. La pareja `primary`/`onPrimary` del tema existe
 * justamente para esto; la variante solo dice sobre cuál de los dos se apoya.
 *
 * ## Las franjas son verticales
 *
 * Horizontales serían un degradado de bandas —una tarta de capas— y en un móvil, con seis colores,
 * cada una mediría dieciséis píxeles de alto. Verticales, la altura es la de la sección entera y lo
 * que se reparte es el ancho: seis franjas de cincuenta píxeles en un móvil siguen siendo seis
 * columnas de color legibles de arriba abajo, que es como se lee un cartel.
 *
 * ## El rótulo va al pie de su franja
 *
 * En vertical y en versalitas diminutas, apoyado en el borde inferior. Es el sitio donde no
 * estorba al texto del centro y donde sigue perteneciendo a su color. Sin nombres —lo normal en
 * una papelería— la sección se queda en las franjas y no abre ningún hueco.
 */
export function DresscodeBands({ content }: DresscodeVariantProps) {
  const named = paletteIsNamed(content.palette);

  return (
    <BlockSection
      block="dresscode"
      variant="bands"
      /* `py-0`: el ritmo vertical de `BlockSection` es para bloques sobre papel, y aquí no hay
         papel — la sección **es** el color. El alto lo pone el contenido con su propio aire. */
      className="relative isolate py-0 text-inv-on-primary inv-on-photo"
    >
      {/* Las franjas, de fondo. `grid-flow-col` con columnas iguales: se reparten el ancho a
          partes iguales sean dos o seis, sin una calle entre ellas. */}
      <ul
        aria-hidden={named ? undefined : 'true'}
        className="absolute inset-0 -z-20 grid list-none auto-cols-fr grid-flow-col p-0"
      >
        {content.palette.map((swatch, index) => (
          // El índice como clave es correcto aquí: la paleta no se reordena ni se inserta en
          // caliente, se renderiza una vez desde contenido guardado.
          <li key={index} className="relative flex min-w-0 items-end justify-center pb-5">
            <Swatch swatch={swatch} shape="block" className="absolute inset-0 -z-10" />

            {swatch.label && (
              /* Girado noventa grados: en una franja de cincuenta píxeles, «Azul noche» en
                 horizontal no cabe ni partido en dos. En vertical cabe cualquiera. */
              <span className="[writing-mode:vertical-rl] rotate-180 text-[8.5px] tracking-[0.22em] whitespace-nowrap text-inv-on-primary uppercase opacity-80">
                {swatch.label}
              </span>
            )}
          </li>
        ))}
      </ul>

      {/* El velo, centrado: es donde va el texto. Ver `globals.css`. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 inv-scrim" data-from="center" />

      <BlockContainer className="max-w-xl py-[var(--inv-space-block)]">
        <div className="flex flex-col items-center text-center">
          <BlockHeading
            eyebrow={content.eyebrow}
            title={content.title}
            align="center"
            tone="inverse"
          />

          {content.description && (
            <p className="mt-7 mb-0 max-w-md text-[15px] leading-relaxed opacity-90">
              {content.description}
            </p>
          )}

          {content.action && (
            <ActionLink
              label={content.action.label}
              href={content.action.href}
              tone="onImage"
              className="mt-10"
            />
          )}

          {content.note && (
            <p className="mt-8 mb-0 max-w-sm text-[13px] leading-relaxed opacity-80">
              {content.note}
            </p>
          )}
        </div>
      </BlockContainer>
    </BlockSection>
  );
}
