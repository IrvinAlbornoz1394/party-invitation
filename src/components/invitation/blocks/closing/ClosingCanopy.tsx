import { requireDesignAsset } from '@/lib/design-assets';
import { ArchFrame } from '../../shared/ArchFrame';
import { BlockImage } from '../../shared/BlockImage';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DesignAsset } from '../../shared/DesignAsset';
import { ClosingMessage, type ClosingVariantProps } from './closing-parts';

const EUCALYPTUS = requireDesignAsset('botanical-eucalyptus-001');
const FERN = requireDesignAsset('botanical-fern-001');
const BRANCH = requireDesignAsset('botanical-branch-vertical-001');

/**
 * `closing.canopy` — la despedida bajo un dosel: ramas que cuelgan desde el canto de arriba, a
 * distintas alturas, y debajo la frase, la firma y —si la hay— la foto en una viñeta de medio
 * punto.
 *
 * Los otros nueve cierres ponen la vegetación **alrededor** del texto (`wreath`), a sus lados
 * (`bouquet`) o no la ponen. Aquí cae desde arriba, que es el gesto con el que la referencia de
 * `arbor` abre y que la portada repite: la invitación se cierra igual que empezó, mirada desde
 * debajo de las ramas.
 *
 * Las tres ramas tienen largos distintos y ninguna está centrada: colgadas a la misma altura se
 * leerían como una cenefa, y una cenefa es un borde, no un árbol.
 */
export function ClosingCanopy({ content }: ClosingVariantProps) {
  return (
    <BlockSection block="closing" variant="canopy" className="relative isolate">
      <DesignAsset
        asset={EUCALYPTUS}
        rotate={180}
        className="pointer-events-none absolute top-0 left-[6%] -z-10 w-16 text-inv-primary opacity-65 sm:left-[14%] sm:w-20"
      />
      <DesignAsset
        asset={BRANCH}
        rotate={180}
        className="pointer-events-none absolute top-0 left-[30%] -z-10 w-5 text-inv-primary opacity-50 sm:w-7"
      />
      <DesignAsset
        asset={FERN}
        rotate={186}
        className="pointer-events-none absolute top-0 right-[9%] -z-10 w-10 text-inv-primary opacity-60 sm:right-[16%] sm:w-12"
      />

      {/* El aire de más para las ramas va en el contenedor y no en la sección: ahí `twMerge` no
          retira el `py-…` de `BlockSection` con un `pt-…`, y las dos declaraciones se pelearían
          por el orden de la hoja (ver `FooterRibbon`). */}
      <BlockContainer className="max-w-lg pt-16 sm:pt-20">
        {content.image && (
          <ArchFrame className="mx-auto mb-12 aspect-[3/4] w-36 sm:w-44">
            <BlockImage image={content.image} sizes="11rem" />
          </ArchFrame>
        )}
        <ClosingMessage content={content} />
      </BlockContainer>
    </BlockSection>
  );
}
