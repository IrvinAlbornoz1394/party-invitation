import { BlockImage } from '../../shared/BlockImage';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { BlockHeading } from '../../shared/BlockHeading';
import { StoryHighlight, StoryProse, StorySignature } from './story-parts';
import { visibleHighlight } from '@/domain/invitation/blocks/story';
import type { StoryVariantProps } from './story-variant';

/**
 * `story.centered` — la historia en una sola columna, con la foto de banda.
 *
 * Es la variante para cuando el texto es lo importante y la foto acompaña, al revés que las
 * partidas. También es la que mejor sostiene una historia sin fotografía: sin imagen no queda
 * un hueco ni una columna coja, queda una página de texto compuesta a propósito.
 *
 * La foto va en 16:9 y a todo el ancho de la columna en lugar de en vertical. No es un capricho
 * de encuadre: una imagen apaisada corta el texto en dos mitades legibles, mientras que una
 * vertical en el centro de una columna deja dos franjas de aire a los lados que parecen un
 * error de maquetación.
 *
 * ## El cuerpo centrado
 *
 * Centrar párrafos empeora la lectura —el ojo pierde el inicio del renglón siguiente porque el
 * margen izquierdo no es recto— y aquí se hace de todos modos: es la composición de una
 * participación, y en este bloque son tres o cuatro párrafos cortos. El daño se acota con la
 * medida, más estrecha que en las variantes partidas; si una historia crece hasta seis
 * párrafos, la variante que le toca es otra.
 */
export function StoryCentered({ content }: StoryVariantProps) {
  const highlight = visibleHighlight(content);

  return (
    <BlockSection block="story" variant="centered">
      <BlockContainer className="max-w-3xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />

        {content.image && (
          <figure className="relative isolate m-0 mt-10 aspect-[16/9] w-full overflow-hidden rounded-inv-lg shadow-inv-soft">
            <BlockImage image={content.image} sizes="(min-width: 1024px) 768px, 100vw" />
          </figure>
        )}

        <StoryProse body={content.body} className="mx-auto mt-10 max-w-[54ch] text-center" />

        {highlight && <StoryHighlight highlight={highlight} align="center" className="mt-10" />}

        {content.signature && (
          <StorySignature signature={content.signature} className="mt-10 text-center" />
        )}
      </BlockContainer>
    </BlockSection>
  );
}
