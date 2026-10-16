import clsx from 'clsx';
import { Heart } from 'lucide-react';
import { visibleHighlight } from '@/domain/invitation/blocks/story';
import { requireDesignAsset } from '@/lib/design-assets';
import { BlockImage } from '../../shared/BlockImage';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DesignAsset } from '../../shared/DesignAsset';
import { PolaroidFrame } from '../../shared/PolaroidFrame';
import { StoryProse, StorySignature } from './story-parts';
import type { StoryVariantProps } from './story-variant';
import { hasText } from '../../shared/has-text';

const FLOWER = requireDesignAsset('symbol-flower-pink-001');

/**
 * `story.quote` — la frase destacada como una cita entre comillas grandes, encerrada entre dos
 * filetes que se cierran con un corazón, y la historia a su alrededor.
 *
 * Es la historia de `blush`. La referencia no cuenta una historia: escribe una sola frase de
 * agradecimiento entre comillas, con un filete y un corazón debajo. Esta variante la hace pieza
 * central —el título y el cuerpo quedan alrededor, a cuerpo menor— porque en unos XV la frase
 * suele ser lo único que se lee dos veces. Las otras historias usan la cita como un inciso en
 * medio del texto; aquí es el texto.
 *
 * La foto, si la hay, va en una polaroid girada al otro lado que la de la portada, con la flor
 * en la esquina contraria: la misma pieza, sin repetir el gesto.
 *
 * Sin cita, el título ocupa su sitio entre los filetes, y la sección no deja un hueco.
 */
export function StoryQuote({ content }: StoryVariantProps) {
  const highlight = visibleHighlight(content);

  return (
    <BlockSection block="story" variant="quote">
      <BlockContainer className="max-w-md text-center">
        {hasText(content.eyebrow) && (
          <p className="m-0 text-[10.5px] tracking-[0.32em] text-inv-ink-soft uppercase">
            {content.eyebrow}
          </p>
        )}
        <h2
          className={
            highlight
              ? clsx(
                  hasText(content.eyebrow) ? 'mt-3' : 'mt-0',
                  'mb-0 font-inv-script text-[clamp(2.5rem,11vw,3.4rem)] leading-[1.1] font-normal text-inv-accent',
                )
              : 'sr-only'
          }
        >
          {content.title}
        </h2>

        {content.image && (
          <div className="relative mx-auto mt-10 w-[min(66vw,16rem)]">
            <PolaroidFrame className="rotate-[2.5deg]" photoClassName="aspect-[4/5]">
              <BlockImage image={content.image} sizes="16rem" />
            </PolaroidFrame>
            <DesignAsset
              asset={FLOWER}
              rotate={24}
              className="pointer-events-none absolute -bottom-14 -left-10 w-20 drop-shadow-[0_8px_8px_rgba(120,60,75,0.2)] sm:w-24"
            />
          </div>
        )}

        {/* Con el título solo para lectores de pantalla, sin rótulo ni foto, la cita abre la sección. */}
        <figure
          className={clsx(
            'm-0',
            hasText(content.eyebrow) || highlight || content.image ? 'mt-12' : null,
          )}
        >
          <span
            aria-hidden="true"
            className="block font-inv-display text-[3.5rem] leading-[0.6] text-inv-accent/70"
          >
            &ldquo;
          </span>
          <blockquote className="m-0 mt-3 text-balance font-inv-display text-[clamp(1.25rem,5.6vw,1.6rem)] leading-[1.35] text-inv-ink">
            {highlight ? highlight.quote : content.title}
          </blockquote>
          {highlight && hasText(highlight.author) && (
            <figcaption className="mt-4 text-[10.5px] tracking-[0.26em] text-inv-ink-soft uppercase">
              {highlight.author}
            </figcaption>
          )}
        </figure>
        <p aria-hidden="true" className="mt-7 mb-0 flex items-center justify-center gap-3 text-inv-accent">
          <span className="h-px w-16 bg-current opacity-45" />
          <Heart size={11} strokeWidth={0} className="fill-current" />
          <span className="h-px w-16 bg-current opacity-45" />
        </p>

        {hasText(content.subtitle) && (
          <p className="mx-auto mt-9 mb-0 max-w-xs text-[11px] leading-relaxed tracking-[0.2em] text-inv-primary uppercase">
            {content.subtitle}
          </p>
        )}
        <StoryProse body={content.body} className="mx-auto mt-5 max-w-sm" />

        {hasText(content.signature) && <StorySignature signature={content.signature} className="mt-9" />}
      </BlockContainer>
    </BlockSection>
  );
}
