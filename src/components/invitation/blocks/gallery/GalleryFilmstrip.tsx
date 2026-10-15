'use client';

import clsx from 'clsx';
import { requireDesignAsset } from '@/lib/design-assets';
import { actionClasses } from '../../shared/action-styles';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DesignAsset } from '../../shared/DesignAsset';
import { Lightbox } from '../../shared/Lightbox';
import { useLightbox } from '../../shared/useLightbox';
import { PhotoButton, type GalleryVariantProps } from './gallery-parts';

const TIARA = requireDesignAsset('tiara-filigree-001');
const ROSES = requireDesignAsset('corner-rose-line-001');

/** Cuántas fotos caben en la tira. Las demás se ven en el visor. */
const STRIP_LENGTH = 3;

/**
 * `gallery.filmstrip` — una tira de fotomatón: tres fotos una encima de otra en una banda blanca,
 * un poco girada, con el título escrito en vertical a su lado, la tiara de línea asomando por la
 * esquina de arriba y un ramillete de rosas por la de abajo.
 *
 * Es la galería de `coquette`, y la mitad izquierda de la segunda pantalla de la referencia: la
 * tira con «MIS QUINCEAÑOS» subiendo por el margen. Las otras galerías reparten las fotos en una
 * retícula, un carrusel o un montón; esta las pone **en fila de a una y de canto**, que es como
 * sale una tira de fotomatón y lo que la hace leerse como un recuerdo de la fiesta y no como un
 * álbum.
 *
 * ## Tres fotos, y el resto en el visor
 *
 * La tira es de tres, como las de verdad: con doce sería una columna que no se acaba. Si hay más,
 * debajo va un botón que abre el visor común (`Lightbox`) en la cuarta, y desde ahí se recorren
 * todas. Cada foto de la tira también se amplía al pulsarla.
 *
 * El título en vertical se lee de abajo arriba, como el lomo de un libro en español. Para un
 * lector de pantalla es un encabezado normal: el giro es solo de la vista.
 */
export function GalleryFilmstrip({ content }: GalleryVariantProps) {
  const total = content.items.length;
  const lightbox = useLightbox(total);
  const strip = content.items.slice(0, STRIP_LENGTH);
  const rest = total - strip.length;

  return (
    <BlockSection block="gallery" variant="filmstrip" className="relative isolate">
      <DesignAsset
        asset={ROSES}
        className="pointer-events-none absolute bottom-0 left-0 -z-10 w-40 text-inv-primary opacity-50 sm:w-52"
      />

      <BlockContainer className="max-w-md">
        {content.eyebrow && (
          <p className="m-0 text-center font-inv-display text-[11px] tracking-[0.32em] text-inv-ink-soft uppercase">
            {content.eyebrow}
          </p>
        )}

        <div className="relative mx-auto mt-6 flex w-fit items-center gap-3 sm:gap-5">
          <h2 className="m-0 font-inv-display text-[clamp(1.6rem,8vw,2.3rem)] leading-none font-normal tracking-[0.06em] whitespace-nowrap text-inv-primary uppercase [writing-mode:vertical-rl] rotate-180">
            {content.title}
          </h2>

          <div className="relative">
            <DesignAsset
              asset={TIARA}
              rotate={12}
              className="pointer-events-none absolute -top-12 -right-14 z-10 w-32 text-inv-primary opacity-75 sm:w-36"
            />
            <ul className="m-0 flex w-[min(52vw,13.5rem)] rotate-[-1.5deg] list-none flex-col gap-2 bg-white p-2 pb-6 shadow-[0_20px_38px_-24px_rgba(90,40,50,0.6)] sm:gap-2.5 sm:p-2.5 sm:pb-7">
              {strip.map((item, index) => (
                <li key={index}>
                  <PhotoButton
                    item={item}
                    index={index}
                    total={total}
                    onOpen={lightbox.open}
                    sizes="(min-width: 640px) 13rem, 52vw"
                    className="aspect-[4/5]"
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {(content.subtitle || rest > 0) && (
          <div className="mt-10 flex flex-col items-center text-center">
            {content.subtitle && (
              <p className="m-0 max-w-xs font-inv-display text-[15px] leading-snug text-inv-accent">
                {content.subtitle}
              </p>
            )}
            {rest > 0 && (
              <button
                type="button"
                onClick={() => lightbox.open(STRIP_LENGTH)}
                className={clsx(actionClasses('onSurface'), 'cursor-pointer', content.subtitle && 'mt-6')}
              >
                {rest === 1 ? 'Ver 1 foto más' : `Ver ${rest} fotos más`}
              </button>
            )}
          </div>
        )}

        {content.note && <BlockNote note={content.note} className="mt-10 text-center" />}
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
