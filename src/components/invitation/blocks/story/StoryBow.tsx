import { visibleHighlight } from '@/domain/invitation/blocks/story';
import { BlockCurve } from '../../shared/BlockCurve';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockImage } from '../../shared/BlockImage';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { RibbonBow } from '../../shared/doodle-ornaments';
import { StoryHighlight, StoryProse, StorySignature } from './story-parts';
import type { StoryVariantProps } from './story-variant';

/**
 * `story.bow` — el saludo con el lazo: la fotografía en una banda de canto ondulado, el lazo
 * atado debajo y el texto centrado.
 *
 * Es la octava historia. Con `story.greeting` —la de `monochrome`— comparte el papel (las dos son
 * una alocución centrada y no un relato) y se separa en las dos cosas que definen a esta
 * estructura:
 *
 *   `greeting`  no pinta la fotografía. El silencio es la composición.
 *   `bow`       la pinta **de banda a sangre y con el canto ondulado**, y ata un lazo entre la
 *               foto y el texto. El adorno es la composición.
 *
 * Y con `story.centered`, que también pone la foto de banda arriba, la diferencia es el canto: allí
 * la imagen es un rectángulo y aquí el papel la muerde con una onda. Esa onda es del **tema**
 * (`--inv-edge-height`), así que en un tema de canto recto esta variante enseña la banda plana y
 * sigue teniendo su lazo — no se rompe, se calma.
 *
 * ## El lazo va entre la foto y el texto, no encima del rótulo
 *
 * Es donde en la referencia está la cinta: cierra la fotografía y abre la carta. Puesto sobre el
 * título competiría con él, y el título de esta estructura ya es una pieza gráfica —el rótulo
 * vaciado—. Dos adornos en la misma línea son uno de más.
 */
export function StoryBow({ content }: StoryVariantProps) {
  const highlight = visibleHighlight(content);

  return (
    <BlockSection block="story" variant="bow" className="pt-0">
      {content.image && (
        /*
          La banda. Va fuera del contenedor —a sangre— y con la onda pintada **dentro** de su
          caja, del color del papel: una figura que sobresaliera quedaría tapada por el fondo de
          la sección siguiente, que es el mismo razonamiento de `CalendarMonth` con su rasgadura.
        */
        <figure className="relative isolate m-0 aspect-[16/10] w-full overflow-hidden sm:aspect-[21/9]">
          <BlockImage image={content.image} sizes="100vw" />
          <BlockCurve edge="bottom" className="text-inv-bg" />
        </figure>
      )}

      <BlockContainer className="max-w-xl pt-[var(--inv-space-block)] text-center">
        {content.image && (
          <RibbonBow className="mx-auto mb-8 w-10 text-inv-accent sm:w-12" />
        )}

        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          align="center"
          titleFill="outline"
          titleCase="caps"
        />

        {content.subtitle && (
          <p className="mt-7 mb-0 text-[15.5px] leading-snug font-medium text-inv-ink">
            {content.subtitle}
          </p>
        )}

        <StoryProse body={content.body} className="mx-auto mt-6 max-w-[48ch] text-center" />

        {highlight && <StoryHighlight highlight={highlight} align="center" className="mt-10" />}

        {content.signature && <StorySignature signature={content.signature} className="mt-8" />}
      </BlockContainer>
    </BlockSection>
  );
}
