import clsx from 'clsx';
import { visibleHighlight } from '@/domain/invitation/blocks/story';
import { requireDesignAsset } from '@/lib/design-assets';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockImage } from '../../shared/BlockImage';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DesignAsset } from '../../shared/DesignAsset';
import { PolaroidFrame } from '../../shared/PolaroidFrame';
import { RedThread } from '../../shared/RedThread';
import { StoryHighlight, StoryProse, StorySignature } from './story-parts';
import type { StoryVariantProps } from './story-variant';
import { hasText } from '../../shared/has-text';

const SCRAP = requireDesignAsset('sticker-paper-scrap-001');
const TAPE = requireDesignAsset('sticker-tape-001');

/**
 * `story.taped` — una carta centrada: el saludo a pincel, los párrafos en columna estrecha, y un
 * recorte de periódico pegado con cinta al canto izquierdo, medio fuera de la página. El hilo
 * rojo cruza por detrás.
 *
 * Es la historia de `scrapbook`, la segunda pantalla de la referencia («¡Queridos invitados!»).
 * Las otras historias componen el texto **con** una foto —al lado, encima, en una tarjeta—; esta
 * es la única donde el texto va solo, como una carta, y lo que la vuelve álbum son los recortes
 * pegados alrededor, no un marco.
 *
 * El recorte es decoración y nunca lleva texto legible: las letras que tenga el dibujo son
 * textura. Va por detrás del texto y en el móvil apenas asoma un dedo, para no pisar los
 * renglones en 360 px. Se sale del canto a propósito —un recorte pegado al borde de la hoja— y
 * la sección lo recorta (`overflow-x-clip`), así que no añade desplazamiento lateral.
 *
 * Con foto, va en una instantánea pequeña sujeta con cinta debajo del texto, como una foto
 * pegada al final de la carta. Sin ella, la carta acaba en la firma.
 */
export function StoryTaped({ content }: StoryVariantProps) {
  const highlight = visibleHighlight(content);

  return (
    <BlockSection block="story" variant="taped" className="relative isolate">
      <RedThread
        shape="swag"
        flip
        className="absolute inset-x-0 bottom-[14%] -z-10 h-24 w-full text-inv-primary opacity-80 sm:h-32"
      />
      <DesignAsset
        asset={SCRAP}
        rotate={-8}
        className="pointer-events-none absolute top-[18%] -left-11 -z-10 w-24 sm:-left-6 sm:w-40"
      />
      <DesignAsset
        asset={TAPE}
        rotate={-30}
        className="pointer-events-none absolute top-[calc(18%-0.75rem)] left-3 -z-10 w-12 opacity-90 sm:left-24 sm:w-16"
      />

      <BlockContainer className="relative max-w-xl text-center">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          titleFont="script"
          align="center"
        />

        <StoryProse
          body={content.body}
          className="mx-auto mt-8 max-w-[22rem] text-[15px] leading-[1.7] text-pretty"
        />

        {highlight && <StoryHighlight highlight={highlight} align="center" className="mt-9" />}

        {hasText(content.signature) && (
          <StorySignature
            signature={content.signature}
            className={clsx(highlight ? 'mt-7' : 'mt-8', 'text-inv-primary')}
          />
        )}

        {content.image && (
          <div className="relative mx-auto mt-12 w-[min(56vw,13rem)]">
            <PolaroidFrame className="rotate-[3deg]" photoClassName="aspect-[4/5]">
              <BlockImage image={content.image} sizes="(min-width: 640px) 13rem, 56vw" />
            </PolaroidFrame>
            <DesignAsset
              asset={TAPE}
              rotate={-6}
              className="pointer-events-none absolute -top-4 left-1/2 w-20 -translate-x-1/2 opacity-90"
            />
          </div>
        )}
      </BlockContainer>
    </BlockSection>
  );
}
