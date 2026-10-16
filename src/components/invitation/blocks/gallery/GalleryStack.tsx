'use client';

import {
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { requireDesignAsset } from '@/lib/design-assets';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { hasText } from '../../shared/has-text';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DesignAsset } from '../../shared/DesignAsset';
import { Lightbox } from '../../shared/Lightbox';
import { PolaroidFrame } from '../../shared/PolaroidFrame';
import { useLightbox } from '../../shared/useLightbox';
import { PhotoButton, type GalleryVariantProps } from './gallery-parts';

const FLOWER = requireDesignAsset('symbol-flower-pink-001');

/** Lo que tiene que recorrer el dedo para que cuente como pasar de foto y no como un toque. */
const SWIPE_THRESHOLD = 40;

/**
 * Dónde queda cada instantánea según lo lejos que esté de la de encima: la de encima casi recta,
 * las dos siguientes asomando giradas por detrás, y el resto apiladas y ocultas.
 *
 * Clases completas y no calculadas, por lo mismo que en `GalleryPolaroid`: Tailwind no genera
 * una clase que no aparece escrita en el código.
 */
const DEPTHS = [
  'z-30 rotate-[-2deg] visible opacity-100',
  'z-20 translate-x-3 translate-y-2 rotate-[4deg] visible opacity-100',
  'z-10 -translate-x-3 translate-y-3 rotate-[-6deg] visible opacity-100',
] as const;
const HIDDEN = 'z-0 rotate-[-6deg] invisible opacity-0';

/**
 * `gallery.stack` — las fotos como un montón de polaroids: la de encima se ve entera, con un
 * corazón prendido en la esquina y una flor apoyada en el pie, y dos más asoman torcidas por
 * debajo. Se pasa con las flechas o con el dedo, y la de encima se va al fondo del montón.
 *
 * Es la galería de `blush`. `gallery.polaroid` reparte las instantáneas **sobre la mesa**, todas a
 * la vista; esta las deja **en la mano**, una encima de otra, que es como la referencia enseña la
 * suya: una foto con su corazón, y debajo se adivinan más. Por eso se parece a `gallery.arch` en
 * el mecanismo —una foto a la vez, flechas, deslizamiento— y no en lo que se ve: allí las fotos
 * se funden en el mismo hueco; aquí siguen ahí, debajo, y se nota cuántas quedan.
 *
 * Pulsar la de encima la amplía en el visor común (`Lightbox`).
 *
 * ## Las de debajo no se pueden pulsar
 *
 * Asoman, pero van con `inert`: si no, el tabulador pasaría por tres botones de «ampliar» para
 * una sola foto visible, y un toque en el canto de la de debajo abriría una foto que no se ve.
 */
export function GalleryStack({ content }: GalleryVariantProps) {
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

  return (
    <BlockSection block="gallery" variant="stack">
      <BlockContainer className="max-w-md">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleFont="script"
        />

        <div
          className="relative mx-auto mt-12 w-[min(72vw,18rem)] touch-pan-y"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (pointerStart.current = null)}
          onClickCapture={onClickCapture}
        >
          {/* Una caja invisible con la medida de una polaroid: las de verdad van todas en
              absoluto, apiladas, y sin ella el montón no ocuparía sitio. */}
          <div aria-hidden="true" className="invisible">
            <PolaroidFrame photoClassName="aspect-[4/5]">{null}</PolaroidFrame>
          </div>

          {content.items.map((item, index) => {
            const depth = (index - current + total) % total;
            const onTop = depth === 0;

            return (
              <div
                key={index}
                inert={!onTop}
                aria-hidden={onTop ? undefined : 'true'}
                className={clsx(
                  'absolute inset-0 transition-[transform,translate,rotate,opacity,visibility] duration-500 ease-out',
                  DEPTHS[depth] ?? HIDDEN,
                )}
              >
                <PolaroidFrame caption={item.caption} photoClassName="aspect-[4/5]">
                  <PhotoButton
                    item={item}
                    index={index}
                    total={total}
                    onOpen={lightbox.open}
                    sizes="(min-width: 640px) 18rem, 72vw"
                    className="absolute inset-0 h-full"
                  />
                </PolaroidFrame>
              </div>
            );
          })}

          {/* El corazón prendido en la esquina, encima del montón y no de una foto: se queda
              quieto mientras pasan las fotos, como el clip de un álbum. */}
          <span
            aria-hidden="true"
            className="absolute -top-4 -right-4 z-40 grid size-11 place-items-center rounded-full bg-white text-inv-primary shadow-[0_8px_16px_-8px_rgba(120,60,75,0.55)]"
          >
            <Heart size={18} strokeWidth={0} className="fill-current" />
          </span>
          <DesignAsset
            asset={FLOWER}
            rotate={-34}
            className="pointer-events-none absolute -right-10 -bottom-14 z-40 w-20 drop-shadow-[0_8px_8px_rgba(120,60,75,0.2)] sm:w-24"
          />
        </div>

        <div className="mt-12 flex items-center justify-center gap-5">
          <ArrowButton direction="previous" onClick={() => move(-1)} />
          <p className="m-0 min-w-14 text-center font-inv-display text-[13px] tracking-[0.2em] text-inv-ink-soft tabular-nums">
            {current + 1} / {total}
          </p>
          <ArrowButton direction="next" onClick={() => move(1)} />
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
 * La flecha de un lado del contador: un círculo de filete rosado.
 *
 * Con fondo propio y explícito: sin preflight, un `<button>` sin fondo se queda con el gris del
 * sistema (ver `WelcomeOpenButton`).
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
        'grid size-10 cursor-pointer appearance-none place-items-center rounded-full border border-solid p-0',
        'border-inv-primary/40! bg-transparent! text-inv-primary! transition-colors hover:bg-inv-primary/10!',
        'focus-visible:ring-2 focus-visible:ring-inv-accent focus-visible:outline-none',
      )}
    >
      <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
    </button>
  );
}
