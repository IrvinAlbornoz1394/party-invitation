'use client';

import clsx from 'clsx';
import { BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { Lightbox } from '../../shared/Lightbox';
import { LeafBackdrop, NocturneHeading } from '../../shared/nocturne-ornaments';
import { ShowOnView } from '../../shared/ShowOnView';
import { useLightbox } from '../../shared/useLightbox';
import { PhotoButton, type GalleryVariantProps } from './gallery-parts';

/**
 * El ritmo de la columna: una apaisada a lo ancho y dos verticales en pareja, y vuelta a empezar.
 * Se deriva de la posición —nunca del azar— para que servidor y navegador pinten lo mismo.
 */
const SHAPES = ['col-span-2 aspect-[4/3]', 'aspect-[3/4]', 'aspect-[3/4]'] as const;

/**
 * `gallery.inset` — la galería de `nocturne`: un panel del azul medianoche encajado en el papel
 * con margen a los lados, hojas de línea blanca casi transparentes al fondo y las fotos entrando
 * con un zoom suave al llegar, una detrás de otra.
 *
 * El panel no va a sangre a propósito: con margen se lee como una lámina apoyada en la página
 * —el mismo recurso del marco de las sedes— y no como un cambio de sección. Es la sección
 * «Memories» de su referencia, recompuesta para el teléfono: allí las fotos van de una en una a lo
 * ancho y aquí alternan una apaisada y dos verticales, que caben el doble en la misma pantalla.
 */
export function GalleryInset({ content }: GalleryVariantProps) {
  const lightbox = useLightbox(content.items.length);

  return (
    <BlockSection block="gallery" variant="inset" className="py-0">
      <div className="relative isolate mx-3 overflow-hidden bg-inv-ink px-5 py-[var(--inv-space-block)] sm:mx-6 sm:px-8">
        <LeafBackdrop tone="light" />

        <NocturneHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          inverse
          flourish="none"
        />

        <ShowOnView className="mx-auto mt-10 grid max-w-xl grid-cols-2 gap-3 sm:gap-4">
          {content.items.map((item, index) => (
            <div
              key={index}
              className={clsx('inv-zoom-in', SHAPES[index % SHAPES.length])}
              style={{ ['--inv-zoom-delay' as string]: `${Math.min(index, 8) * 0.09}s` }}
            >
              <PhotoButton
                item={item}
                index={index}
                total={content.items.length}
                onOpen={lightbox.open}
                className="h-full w-full"
                sizes={index % 3 === 0 ? '(min-width: 640px) 576px, 90vw' : '(min-width: 640px) 288px, 45vw'}
              />
            </div>
          ))}
        </ShowOnView>

        {hasText(content.note) && (
          <p className="mx-auto mt-8 mb-0 max-w-sm text-center text-[14.5px] leading-relaxed text-inv-bg/80">
            {content.note}
          </p>
        )}
      </div>

      <Lightbox
        items={content.items}
        index={lightbox.index}
        onClose={lightbox.close}
        onMove={lightbox.move}
      />
    </BlockSection>
  );
}
