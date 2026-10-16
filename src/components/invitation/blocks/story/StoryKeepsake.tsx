import clsx from 'clsx';
import { visibleHighlight } from '@/domain/invitation/blocks/story';
import { requireDesignAsset } from '@/lib/design-assets';
import { BlockImage } from '../../shared/BlockImage';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { BowCard } from '../../shared/BowCard';
import { DesignAsset } from '../../shared/DesignAsset';
import { StoryProse, StorySignature } from './story-parts';
import type { StoryVariantProps } from './story-variant';
import { hasText } from '../../shared/has-text';

const TIARA = requireDesignAsset('tiara-filigree-001');
const ROSES = requireDesignAsset('corner-rose-line-001');

/**
 * `story.keepsake` — el retrato en una copia de bordes blancos, un poco girada, y encima de su
 * esquina la tarjeta del moño con la frase y la historia, como una nota prendida a una foto. La
 * tiara de línea corona el conjunto.
 *
 * Es la historia de `coquette`, y la mitad derecha de la segunda pantalla de la referencia: la
 * foto a un lado, la tarjeta solapándola al otro y la tiara asomando por arriba. La otra mitad
 * —la tira de tres fotos con el rótulo en vertical— es la galería (`gallery.filmstrip`), que en
 * el catálogo es otro bloque.
 *
 * Las otras historias ponen la foto al lado del texto, detrás o enmarcada aparte; esta es la
 * única donde **se tocan**: la tarjeta pisa la foto, y eso es lo que hace que se lean como un
 * recuerdo guardado y no como una maqueta de dos columnas.
 *
 * El texto va en la tarjeta tal cual lo escribe la referencia: la frase entre comillas, en el
 * principal, y la historia debajo. Sin frase, la historia ocupa la tarjeta entera.
 *
 * Sin foto, la tarjeta se centra sola, con la tiara encima.
 */
export function StoryKeepsake({ content }: StoryVariantProps) {
  const highlight = visibleHighlight(content);
  const withImage = content.image !== null;

  return (
    <BlockSection block="story" variant="keepsake" className="relative isolate">
      <DesignAsset
        asset={ROSES}
        flip="x"
        className="pointer-events-none absolute right-0 bottom-0 -z-10 w-40 text-inv-primary opacity-50 sm:w-56"
      />

      <BlockContainer className="max-w-xl">
        <div className="text-center">
          {hasText(content.eyebrow) && (
            <p className="m-0 font-inv-display text-[11px] tracking-[0.32em] text-inv-ink-soft uppercase">
              {content.eyebrow}
            </p>
          )}
          <h2
            className={clsx(
              hasText(content.eyebrow) ? 'mt-2' : 'mt-0',
              'mb-0 font-inv-script text-[clamp(2.8rem,12vw,3.8rem)] leading-[1.1] font-normal text-inv-primary',
            )}
          >
            {content.title}
          </h2>
          {hasText(content.subtitle) && (
            <p className="mx-auto mt-3 mb-0 max-w-xs font-inv-display text-[15px] leading-snug text-inv-accent">
              {content.subtitle}
            </p>
          )}
        </div>

        <div className={clsx('relative mt-10', withImage ? 'pt-6' : 'pt-12')}>
          <DesignAsset
            asset={TIARA}
            className={clsx(
              'pointer-events-none absolute top-0 z-20 text-inv-primary opacity-75',
              withImage ? 'right-0 w-36 sm:w-44' : 'left-1/2 w-40 -translate-x-1/2',
            )}
          />

          {content.image && (
            <div className="relative z-0 w-[50%] max-w-[14rem] rotate-[-2.5deg] bg-white p-2 shadow-[0_18px_34px_-22px_rgba(90,40,50,0.55)] sm:p-2.5">
              <div className="relative aspect-[3/4] overflow-hidden">
                <BlockImage image={content.image} sizes="(min-width: 640px) 14rem, 50vw" />
              </div>
            </div>
          )}

          <BowCard
            className={clsx(
              'relative z-10',
              withImage
                ? 'mt-[-28%] ml-auto w-[76%] max-w-[22rem] sm:mt-[-9rem]'
                : 'mx-auto mt-8 w-[min(86vw,22rem)]',
            )}
            innerClassName="px-4 pt-12 pb-7 sm:px-6"
          >
            {highlight && (
              <blockquote className="m-0 font-inv-display text-[clamp(0.95rem,3.9vw,1.08rem)] leading-[1.45] text-pretty text-inv-primary">
                &ldquo;{highlight.quote}&rdquo;
                {hasText(highlight.author) && (
                  <footer className="mt-2 text-[10px] tracking-[0.22em] text-inv-ink-soft uppercase not-italic">
                    {highlight.author}
                  </footer>
                )}
              </blockquote>
            )}
            <StoryProse
              body={content.body}
              className={clsx(
                'text-[13.5px] leading-[1.65] text-pretty',
                highlight ? 'mt-4 space-y-3' : 'space-y-3',
              )}
            />
            {hasText(content.signature) && (
              <StorySignature signature={content.signature} className="mt-5 text-inv-primary" />
            )}
          </BowCard>
        </div>
      </BlockContainer>
    </BlockSection>
  );
}
