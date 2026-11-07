'use client';

import clsx from 'clsx';
import type { GalleryItem } from '@/domain/invitation/blocks/gallery';
import { BlockNote } from '../../shared/BlockNote';
import { hasText } from '../../shared/has-text';
import { Lightbox } from '../../shared/Lightbox';
import { DEPTH, DepthHeading } from '../../shared/mirador-parts';
import { ParallaxLayer, ParallaxScene } from '../../shared/Parallax';
import { Reveal } from '../../shared/Reveal';
import { useLightbox } from '../../shared/useLightbox';
import { PhotoButton, type GalleryVariantProps } from './gallery-parts';

/**
 * Las proporciones de las ventanas. Se repiten cada cuatro fotos y ninguna coincide con su
 * vecina de columna, así que las dos columnas nunca quedan a la misma altura.
 */
const ASPECTS = ['aspect-[4/5]', 'aspect-[3/4]', 'aspect-square', 'aspect-[4/5]'] as const;

/** Cuánto se queda atrás la foto dentro de su ventana. */
const WINDOW_DEPTH = 0.2;

/**
 * `gallery.depth` — la galería de `mirador`: una sección oscura donde **cada foto es una ventana
 * con su propio parallax**.
 *
 * La foto es más alta que su marco y se desplaza dentro de él más despacio que la página, como
 * mirar un paisaje por una ventana mientras se camina. En escritorio van dos columnas, la de la
 * derecha bajada media ventana; en el teléfono, una sola.
 *
 * ## Por qué la foto no va en una capa de relleno
 *
 * `ParallaxLayer fill` es decoración —sin eventos ni lectura— y aquí la foto es el botón que abre
 * el visor. Así que la capa se estira a mano lo mismo que recorre y lleva el botón dentro.
 */
export function GalleryDepth({ content }: GalleryVariantProps) {
  const lightbox = useLightbox(content.items.length);
  const total = content.items.length;

  return (
    <ParallaxScene block="gallery" variant="depth" className="bg-inv-ink py-[var(--inv-space-block)] font-inv-body">
      {/* El fondo de la sala: un resplandor del acento que se aleja despacio. */}
      <ParallaxLayer depth={DEPTH.wash} fill className="-z-20">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(70% 35% at 50% 8%, color-mix(in srgb, var(--inv-color-accent) 28%, transparent), transparent 70%), radial-gradient(60% 30% at 15% 92%, color-mix(in srgb, var(--inv-color-primary) 55%, transparent), transparent 75%)',
          }}
        />
      </ParallaxLayer>

      <div className="mx-auto w-full max-w-5xl px-6 sm:px-10">
        <Reveal className="inv-on-photo">
          <DepthHeading eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} tone="photo" />
        </Reveal>

        <ul className="m-0 mt-14 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 md:gap-8">
          {content.items.map((item, index) => (
            // El índice como clave es correcto: las fotos se pintan una vez desde contenido guardado.
            <li key={index} className={clsx(index % 2 === 1 && 'md:translate-y-[40%]')}>
              <Reveal>
                <DepthWindow item={item} index={index} total={total} onOpen={lightbox.open} />
              </Reveal>
            </li>
          ))}
        </ul>

        {/* Lo que baja la columna derecha, devuelto al final para que la nota no se le monte. */}
        {total > 1 && <div aria-hidden="true" className="hidden md:block md:h-[min(20vw,14rem)]" />}

        {hasText(content.note) && (
          <BlockNote note={content.note} tone="inverse" className="inv-on-photo mx-auto mt-14 max-w-sm text-center" />
        )}
      </div>

      <Lightbox items={content.items} index={lightbox.index} onClose={lightbox.close} onMove={lightbox.move} />
    </ParallaxScene>
  );
}

function DepthWindow({
  item,
  index,
  total,
  onOpen,
}: {
  readonly item: GalleryItem;
  readonly index: number;
  readonly total: number;
  readonly onOpen: (index: number) => void;
}) {
  const travel = `calc(var(--inv-px-h) * ${WINDOW_DEPTH} * -1px)`;

  return (
    <ParallaxScene as="div" className={clsx('rounded-inv-lg shadow-inv-soft', ASPECTS[index % ASPECTS.length])}>
      <ParallaxLayer depth={WINDOW_DEPTH} className="absolute inset-x-0" style={{ top: travel, bottom: travel }}>
        <PhotoButton
          item={item}
          index={index}
          total={total}
          onOpen={onOpen}
          className="h-full"
          sizes="(min-width: 768px) 45vw, 92vw"
        />
      </ParallaxLayer>
    </ParallaxScene>
  );
}
