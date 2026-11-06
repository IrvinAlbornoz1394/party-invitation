'use client';

import { BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { Lightbox } from '../../shared/Lightbox';
import { ShowOnView } from '../../shared/ShowOnView';
import { Blob, CLAY_TAN, Squiggle, TerracottaHeading } from '../../shared/terracotta-ornaments';
import { useLightbox } from '../../shared/useLightbox';
import { PhotoButton, type GalleryVariantProps } from './gallery-parts';

/**
 * `gallery.squircle` — la galería de `terracota`, como «Photo Gallery» de la referencia: una
 * rejilla de fotos cuadradas, dos por fila en el teléfono y tres desde tableta, cada una en el
 * marco abombado de la plantilla. Entran creciendo una tras otra cuando la sección llega a la
 * pantalla, y se abren a pantalla completa.
 */
export function GallerySquircle({ content }: GalleryVariantProps) {
  const lightbox = useLightbox(content.items.length);

  return (
    <BlockSection block="gallery" variant="squircle" className="relative isolate overflow-hidden">
      <Blob shape="wave" outline className={`-top-12 -right-16 -z-10 h-36 w-44 sm:-top-4 sm:h-44 sm:w-52 ${CLAY_TAN}`} />
      <Squiggle className="top-24 -left-16 -z-10 hidden w-44 lg:block" />

      <div className="mx-auto max-w-4xl px-5">
        <TerracottaHeading eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />

        <ShowOnView className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {content.items.map((item, index) => (
            <div
              key={index}
              className="inv-zoom-in inv-squircle aspect-square overflow-hidden"
              style={{ ['--inv-zoom-delay' as string]: `${Math.min(index, 8) * 0.08}s` }}
            >
              <PhotoButton
                item={item}
                index={index}
                total={content.items.length}
                onOpen={lightbox.open}
                className="h-full w-full"
                sizes="(min-width: 640px) 300px, 45vw"
              />
            </div>
          ))}
        </ShowOnView>

        {hasText(content.note) && (
          <p className="mx-auto mt-8 mb-0 max-w-sm text-center text-[15px] leading-relaxed text-inv-ink-soft">
            {content.note}
          </p>
        )}
      </div>

      <Lightbox items={content.items} index={lightbox.index} onClose={lightbox.close} onMove={lightbox.move} />
    </BlockSection>
  );
}
