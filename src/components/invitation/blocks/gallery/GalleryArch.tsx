'use client';

import {
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { requireDesignAsset } from '@/lib/design-assets';
import { ArchFrame } from '../../shared/ArchFrame';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { hasText } from '../../shared/has-text';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DesignAsset } from '../../shared/DesignAsset';
import { Lightbox } from '../../shared/Lightbox';
import { useLightbox } from '../../shared/useLightbox';
import { PhotoButton, type GalleryVariantProps } from './gallery-parts';

const FAN = requireDesignAsset('botanical-corner-bottom-001');

/** Lo que tiene que recorrer el dedo para que cuente como pasar de foto y no como un toque. */
const SWIPE_THRESHOLD = 40;

/**
 * `gallery.arch` — una sola fotografía cada vez, dentro de un arco, y se pasa con las flechas,
 * con el dedo o con los puntos de abajo.
 *
 * Es la galería de `arbor` y la única del catálogo que **enseña una foto y esconde las demás**.
 * Las otras diez las ponen todas a la vista —rejilla, mosaico, pasarela, pliego— y por eso
 * funcionan como un contacto de la sesión. Esta funciona como el visor de un álbum: cada foto
 * ocupa el arco entero, con la rama brotando del pie, y la siguiente espera. Es la composición de
 * la referencia, y es la que respeta el arco: en una rejilla de arcos pequeños cada uno se leería
 * como una lápida.
 *
 * Pulsar la foto la amplía en el visor común (`Lightbox`), igual que en las demás.
 *
 * ## El cambio de foto es un fundido, no un deslizamiento
 *
 * Las fotos están apiladas en el mismo hueco y la visible sube de opacidad. Deslizar obligaría a
 * recortar por el arco una tira en movimiento y, con proporciones distintas, a saltos de altura;
 * el fundido mantiene el arco quieto, que es la pieza fija de la sección.
 *
 * Las ocultas llevan `invisible` además de la opacidad: así no reciben el foco del tabulador ni
 * las lee un lector de pantalla, que oiría seis botones de «ampliar» para una sola foto visible.
 */
export function GalleryArch({ content }: GalleryVariantProps) {
  const total = content.items.length;
  const lightbox = useLightbox(total);
  const [current, setCurrent] = useState(0);
  const pointerStart = useRef<number | null>(null);
  /* Un deslizamiento que termina encima de la foto dispara además su clic, y la abriría en el
     visor justo cuando se quería pasar a la siguiente. */
  const swiped = useRef(false);

  const move = (delta: number) => setCurrent((index) => (index + delta + total) % total);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointerStart.current = event.clientX;
    swiped.current = false;
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerStart.current === null) return;

    const distance = event.clientX - pointerStart.current;

    pointerStart.current = null;
    if (Math.abs(distance) < SWIPE_THRESHOLD) return;

    swiped.current = true;
    move(distance < 0 ? 1 : -1);
  };

  const onClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!swiped.current) return;

    swiped.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const caption = content.items[current]?.caption;

  return (
    <BlockSection block="gallery" variant="arch">
      <BlockContainer className="max-w-md">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleFont="script"
        />

        <div
          className="relative mx-auto mt-12 w-[min(76vw,20rem)] touch-pan-y"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (pointerStart.current = null)}
          onClickCapture={onClickCapture}
        >
          <ArchFrame className="aspect-[3/4] w-full">
            {content.items.map((item, index) => (
              <PhotoButton
                key={index}
                item={item}
                index={index}
                total={total}
                onOpen={lightbox.open}
                sizes="(min-width: 640px) 20rem, 76vw"
                className={clsx(
                  'absolute inset-0 h-full transition-[opacity,visibility] duration-700 ease-out',
                  index === current ? 'visible opacity-100' : 'invisible opacity-0',
                )}
              />
            ))}
          </ArchFrame>

          <ArrowButton direction="previous" onClick={() => move(-1)} />
          <ArrowButton direction="next" onClick={() => move(1)} />

          <DesignAsset
            asset={FAN}
            flip="x"
            className="pointer-events-none absolute -right-9 -bottom-6 w-32 text-inv-primary opacity-90 sm:-right-12 sm:w-36"
          />
        </div>

        {hasText(caption) && (
          <p className="mt-8 mb-0 text-center text-[10px] tracking-[0.22em] text-inv-ink-soft uppercase">
            {caption}
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {content.items.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrent(index)}
              aria-label={`Ver la fotografía ${index + 1} de ${total}`}
              aria-current={index === current ? 'true' : undefined}
              className={clsx(
                'size-2 cursor-pointer appearance-none rounded-full border-0 p-0 transition-colors',
                'focus-visible:ring-2 focus-visible:ring-inv-accent focus-visible:ring-offset-2 focus-visible:outline-none',
                index === current ? 'bg-inv-primary!' : 'bg-inv-accent/30!',
              )}
            />
          ))}
        </div>

        <p className="sr-only" aria-live="polite">
          {`Fotografía ${current + 1} de ${total}`}
        </p>

        {hasText(content.note) && <BlockNote note={content.note} className="mt-10 text-center" />}
      </BlockContainer>

      <Lightbox
        items={content.items}
        index={lightbox.index}
        onClose={lightbox.close}
        onMove={lightbox.move}
      />
    </BlockSection>
  );
}

/**
 * La flecha de un lado del arco.
 *
 * Con fondo propio y explícito: sin preflight, un `<button>` sin fondo se queda con el gris del
 * sistema (ver `WelcomeOpenButton`). El papel del tema al 80 % hace que se lea sobre cualquier
 * fotografía sin taparla.
 */
function ArrowButton({
  direction,
  onClick,
}: {
  readonly direction: 'previous' | 'next';
  readonly onClick: () => void;
}) {
  const previous = direction === 'previous';
  const Icon = previous ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={previous ? 'Fotografía anterior' : 'Fotografía siguiente'}
      className={clsx(
        'absolute top-[58%] z-10 grid size-9 -translate-y-1/2 cursor-pointer appearance-none place-items-center rounded-full border-0 p-0',
        'bg-inv-bg/80! text-inv-primary! shadow-inv-soft transition-colors hover:bg-inv-bg!',
        'focus-visible:ring-2 focus-visible:ring-inv-accent focus-visible:outline-none',
        previous ? 'left-2.5' : 'right-2.5',
      )}
    >
      <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
    </button>
  );
}
