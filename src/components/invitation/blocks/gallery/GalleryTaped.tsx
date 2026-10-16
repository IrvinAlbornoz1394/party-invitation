'use client';

import clsx from 'clsx';
import { requireDesignAsset } from '@/lib/design-assets';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { hasText } from '../../shared/has-text';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DesignAsset } from '../../shared/DesignAsset';
import { Lightbox } from '../../shared/Lightbox';
import { PolaroidFrame } from '../../shared/PolaroidFrame';
import { RedThread } from '../../shared/RedThread';
import { Reveal } from '../../shared/Reveal';
import { staggerDelay } from '../../shared/stagger';
import { useLightbox } from '../../shared/useLightbox';
import { PhotoButton, type GalleryVariantProps } from './gallery-parts';

const HEART = requireDesignAsset('symbol-heart-solid-001');
const TAPE = requireDesignAsset('sticker-tape-001');
const SCRAP = requireDesignAsset('sticker-paper-scrap-001');

/**
 * Los giros de las instantáneas. Clases completas y no calculadas, por lo mismo que en
 * `gallery.polaroid`: Tailwind no genera una clase que solo existe al ejecutarse.
 */
const TILTS = [
  'rotate-[-3deg]',
  'rotate-[2.5deg]',
  'rotate-[1.5deg]',
  'rotate-[-2deg]',
  'rotate-[-1deg]',
  'rotate-[3deg]',
] as const;

/** El giro de la cinta, que va siempre al contrario que el de su foto, como se pega a mano. */
const TAPE_TILTS = [9, -8, -6, 7, 5, -9] as const;

/**
 * `gallery.taped` — las fotos como instantáneas pegadas al álbum con cinta: dos columnas
 * sueltas, cada foto torcida a su manera y sujeta por una tira de washi arriba, con el hilo rojo
 * pasando por detrás y algún corazón suelto.
 *
 * Es la galería de `scrapbook`, que la referencia no tiene: se dibuja con sus piezas —la
 * polaroid de la portada y la sede, la cinta, el hilo— para que las fotos se lean como otra
 * página del mismo álbum. Se diferencia de `gallery.polaroid` en que aquella deja las fotos
 * **sobre la mesa**, en tres columnas y sin nada que las sujete; aquí están **pegadas**: la
 * cinta es la que dice que son un recuerdo guardado y no una pila por mirar.
 *
 * ## Dos columnas siempre, y la segunda más baja
 *
 * En el móvil, que es donde se mira, dos columnas dejan cada foto a unos 150px: lo justo para
 * reconocer a alguien y querer ampliarla. La columna derecha baja media foto para que las dos
 * no formen filas —un álbum pegado a mano no tiene renglones—. Con un número impar de fotos, la
 * última se centra sola debajo en lugar de quedarse colgando a la izquierda.
 *
 * ## El desorden es siempre el mismo
 *
 * Giros, cintas y corazones salen de la posición de cada foto y no del azar, que cambiaría en
 * cada recarga y daría distinto en el servidor y en el cliente.
 *
 * El pie de foto, cuando lo hay, va escrito a mano en el faldón de la instantánea (`PolaroidFrame`);
 * sin pie, el faldón se queda en blanco. Pulsar una foto la abre en el visor, como en todas las
 * galerías; al pasar por encima se endereza, el gesto de despegarla para mirarla.
 */
export function GalleryTaped({ content }: GalleryVariantProps) {
  const lightbox = useLightbox(content.items.length);
  const total = content.items.length;

  return (
    <BlockSection block="gallery" variant="taped">
      <BlockContainer className="max-w-2xl">
        <div className="relative">
          {/* El recorte de periódico detrás del título, asomando por el canto izquierdo. */}
          <DesignAsset
            asset={SCRAP}
            rotate={-8}
            className="pointer-events-none absolute -top-4 -left-12 w-24 opacity-90 sm:-left-20 sm:w-32"
          />
          <BlockHeading
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.subtitle}
            align="center"
            titleFont="script"
            className="relative"
          />
        </div>

        <div className="relative mt-14">
          <RedThread
            shape="wave"
            className="absolute -top-8 left-1/2 h-[calc(100%+4rem)] w-40 -translate-x-1/2 text-inv-primary opacity-75 sm:w-64"
          />

          <ul
            className={clsx(
              'relative m-0 grid list-none grid-cols-2 gap-x-4 gap-y-10 p-0 sm:gap-x-10 sm:gap-y-14',
              // Lo que baja la última foto de la derecha, para que no pise lo que venga después.
              total % 2 === 0 && 'pb-16 sm:pb-20',
            )}
          >
            {content.items.map((item, index) => {
              const alone = total % 2 === 1 && index === total - 1;
              const lowered = !alone && index % 2 === 1;
              const tapeTilt = TAPE_TILTS[index % TAPE_TILTS.length];

              return (
                // El índice como clave es correcto: las fotos se pintan una vez desde contenido
                // guardado, no se reordenan en caliente.
                <li
                  key={index}
                  className={clsx(
                    alone && 'col-span-2 mx-auto w-1/2',
                    // La sola de abajo deja sitio a la de la derecha de encima, que baja.
                    alone && total > 1 && 'mt-10 sm:mt-14',
                  )}
                >
                  <Reveal delay={staggerDelay(index, 0.07)}>
                    {/* El descenso va en su propia capa: la entrada anima `transform` y esto no
                        debe moverse con ella. */}
                    <div className={clsx('relative', lowered && 'translate-y-16 sm:translate-y-20')}>
                      <PolaroidFrame
                        caption={hasText(item.caption) ? item.caption : null}
                        className={clsx(
                          'transition-[rotate,translate] duration-500 ease-out',
                          'hover:-translate-y-1 hover:rotate-0 focus-within:-translate-y-1 focus-within:rotate-0',
                          TILTS[index % TILTS.length],
                        )}
                      >
                        <PhotoButton
                          item={item}
                          index={index}
                          total={total}
                          onOpen={lightbox.open}
                          /* El marco recorta la foto, así que el anillo de foco va por dentro: por
                             fuera quedaría cortado. */
                          className="absolute inset-0 h-full focus-visible:ring-inset focus-visible:ring-offset-0"
                          sizes="(min-width: 640px) 18rem, 45vw"
                        />
                      </PolaroidFrame>

                      <DesignAsset
                        asset={TAPE}
                        rotate={tapeTilt}
                        className="pointer-events-none absolute -top-3 left-1/2 w-16 -translate-x-1/2 sm:w-20"
                      />

                      {index % 3 === 1 && (
                        <DesignAsset
                          asset={HEART}
                          rotate={index % 2 === 0 ? -14 : 12}
                          className="absolute -right-2 -bottom-2 w-5 text-inv-primary sm:w-6"
                        />
                      )}
                      {index % 4 === 0 && index > 0 && (
                        <DesignAsset
                          asset={HEART}
                          rotate={-8}
                          className="absolute top-1/3 -left-3 w-3.5 text-inv-primary"
                        />
                      )}
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </div>

        {hasText(content.note) && <BlockNote note={content.note} className="mt-12 text-center" />}
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
