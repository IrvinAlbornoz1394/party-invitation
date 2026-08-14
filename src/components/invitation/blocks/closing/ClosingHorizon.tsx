import { BlockCurve } from '../../shared/BlockCurve';
import { BlockImage } from '../../shared/BlockImage';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { IconBadge } from '../../shared/IconBadge';
import { ClosingMessage, type ClosingVariantProps } from './closing-parts';

/**
 * `closing.horizon` — la despedida ocupando la pantalla entera.
 *
 * Es el cierre monumental: la frase sola, centrada, sobre la fotografía a sangre o sobre el
 * color principal del tema, sin nada más alrededor. Funciona como funciona el fundido a negro al
 * final de una película — lo que se recuerda de una invitación suele ser lo último que se vio,
 * y aquí lo último es una frase grande y silencio.
 *
 * Es la contraria de `closing.split`: aquella acompaña, esta remata. Conviene cuando la
 * invitación ha sido sobria y el final tiene que pesar; no conviene detrás de una portada a
 * sangre y una galería con parallax, donde sería la tercera pantalla completa seguida.
 *
 * ## Sin fotografía
 *
 * La sección se pinta con el color principal y todo el texto en `onPrimary`. No es un respaldo:
 * es la versión que muchos temas prefieren. En «Marfil y oro» sale una pantalla dorada con tinta
 * crema y en «Medianoche», dorada con tinta oscura, sin tocar este archivo — la misma pareja
 * `primary`/`onPrimary` que sostiene el panel de detalles.
 *
 * El velo lo pone el tema y no un negro fijo, por lo de siempre: sobre una foto que sube el
 * cliente, el contraste tiene que estar garantizado en cualquier tema.
 */
export function ClosingHorizon({ content }: ClosingVariantProps) {
  return (
    <BlockSection
      block="closing"
      variant="horizon"
      /* El mínimo se mide contra la pantalla y no en rem: el cierre tiene que llenar la vista,
         y 34rem en un móvil apaisado es más de lo que hay. */
      className="relative isolate flex min-h-[clamp(24rem,72svh,38rem)] items-center bg-inv-primary py-[calc(5rem+var(--inv-edge-height,0px))] sm:py-[calc(7rem+var(--inv-edge-height,0px))]"
    >
      {content.image && (
        <>
          <BlockImage image={content.image} className="-z-20" sizes="100vw" priority={false} />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-inv-overlay" />
        </>
      )}

      {/*
        El canto del tema, también aquí: es la pantalla completa, pero sigue siendo una franja
        entre el papel de antes y el pie de después. La onda va después del velo para morder la
        fotografía igual que el color. Ver `shared/BlockCurve.tsx`.
      */}
      <BlockCurve edge="top" className="text-inv-bg" />
      <BlockCurve edge="bottom" className="text-inv-bg" />

      <BlockContainer>
        <div className="flex flex-col items-center">
          {/* El medallón en su versión invertida: aquí el fondo es el color principal —o una
              foto velada— y el trazo tiene que ser el de encima, no el acento del papel. */}
          <IconBadge icon={content.icon} tone="inverse" size="lg" className="mb-10" />

          <ClosingMessage content={content} tone="onImage" />
        </div>
      </BlockContainer>
    </BlockSection>
  );
}
