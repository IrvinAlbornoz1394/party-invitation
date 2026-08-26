import { BlockImage } from '../../shared/BlockImage';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { BlockHeading } from '../../shared/BlockHeading';
import { StoryHighlight, StoryProse, StorySignature } from './story-parts';
import { visibleHighlight } from '@/domain/invitation/blocks/story';
import type { StoryVariantProps } from './story-variant';

/**
 * `story.overlay` — la historia en una tarjeta sobre la fotografía.
 *
 * Es la variante de respiro: la foto ocupa el ancho completo de la pantalla y el texto se
 * apoya encima en una tarjeta del papel del tema. Puesta entre dos bloques a dos columnas,
 * rompe la retícula y hace que la invitación deje de parecer una plantilla; puesta en una
 * invitación entera de bloques así, cansa. Como todo lo demás, eso se decide desde el panel.
 *
 * ## El texto va en tarjeta y no directamente sobre la foto
 *
 * Es la diferencia con la portada, y es deliberada. En la portada son seis palabras en cuerpo
 * grande, que aguantan un velo y se leen sobre casi cualquier imagen. Aquí son cuatro párrafos
 * en cuerpo de lectura: sobre una fotografía —que además el organizador sube sin que nadie la
 * revise— el contraste dejaría de estar garantizado en la primera nube clara. La tarjeta lo
 * garantiza siempre, porque el tema ya asegura que `ink` se lee sobre `surface`.
 *
 * ## Sin fotografía
 *
 * Queda la tarjeta sobre el papel del tema, con su sombra. No se ve rota ni a medias: se ve
 * como una nota, que es exactamente lo que es.
 */
export function StoryOverlay({ content }: StoryVariantProps) {
  const highlight = visibleHighlight(content);

  return (
    <BlockSection block="story" variant="overlay" className="relative isolate py-24 sm:py-32">
      {content.image && (
        <>
          <BlockImage image={content.image} className="-z-20" />
          {/* El velo aquí no es para leer —el texto va en tarjeta— sino para que la foto no
              compita con ella. Por eso usa el color de velo del tema y no un negro fijo. */}
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-inv-overlay" />
        </>
      )}

      <BlockContainer>
        {/* Márgenes explícitos y no `space-y`, por lo mismo que en `StorySplit`: el hueco que va
            bien entre encabezado y cuerpo deja la cita y la firma apretadas contra el texto. */}
        <article className="mx-auto max-w-2xl rounded-inv-lg bg-inv-surface p-8 shadow-inv-soft sm:p-12">
          <BlockHeading eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
          <StoryProse body={content.body} className="mt-7" />
          {highlight && <StoryHighlight highlight={highlight} className="mt-9" />}
          {content.signature && (
            <StorySignature signature={content.signature} className={highlight ? 'mt-8 pl-5' : 'mt-8'} />
          )}
        </article>
      </BlockContainer>
    </BlockSection>
  );
}
