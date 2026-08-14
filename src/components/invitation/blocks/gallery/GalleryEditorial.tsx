'use client';

import clsx from 'clsx';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { Lightbox } from '../../shared/Lightbox';
import { Reveal } from '../../shared/Reveal';
import { staggerDelay } from '../../shared/stagger';
import { useLightbox } from '../../shared/useLightbox';
import { PhotoButton, type GalleryVariantProps } from './gallery-parts';

/**
 * `gallery.editorial` — el pliego de una revista.
 *
 * Es la galería de la plantilla editorial, y lo que la distingue no es el color: es que **está
 * maquetada**. Las fotos no se reparten en una retícula regular, se colocan en un ritmo de
 * pliego —una ancha, una vertical descolgada, una entrada desde el margen— y cada una lleva su
 * **folio y su pie a la vista**, como en una publicación impresa.
 *
 * ## Qué la separa de la mampostería
 *
 * `gallery.masonry` respeta la proporción de cada foto y las reparte en columnas iguales: manda
 * el material. Aquí manda **la página**. Las proporciones se imponen —ancha, vertical, ancha— y
 * las fotos se recortan para entrar en ellas, que es exactamente lo que hace un director de arte
 * al cerrar un pliego.
 *
 * Por eso las dos existen y ninguna sobra: una es para enseñar fotos, la otra para componer una
 * página con fotos.
 *
 * ## El pie de foto, visible
 *
 * En las otras cinco galerías el pie vive en el visor ampliado. Aquí está en la página, en
 * versalitas y precedido del folio, porque en una revista el pie **es parte de la maqueta**: es
 * lo que convierte una foto en un reportaje. Cuando una foto no lo trae, queda el folio solo, y
 * eso también es lenguaje de revista.
 */

/**
 * El ritmo del pliego, en una retícula de doce columnas.
 *
 * Cuatro posiciones que se repiten, con anchos y proporciones distintos y un descuelgue vertical
 * en dos de ellas. Escrito como una lista y no como una regla algorítmica porque una maqueta
 * editorial es una decisión, no un cálculo: estas cuatro se eligieron para que ninguna foto caiga
 * a la misma altura que su vecina.
 */
const SPREAD = [
  'md:col-span-7 aspect-[4/3]',
  'md:col-span-5 md:mt-20 aspect-[3/4]',
  'md:col-span-5 md:col-start-2 aspect-[3/4]',
  'md:col-span-6 md:col-start-7 md:-mt-12 aspect-[4/3]',
] as const;

export function GalleryEditorial({ content }: GalleryVariantProps) {
  const lightbox = useLightbox(content.items.length);

  return (
    <BlockSection block="gallery" variant="editorial">
      <BlockContainer>
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
        />

        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-12 md:gap-y-16">
          {content.items.map((item, index) => (
            // El índice como clave es correcto aquí: las fotos no se reordenan ni se insertan
            // en caliente, se renderizan una vez desde contenido guardado.
            <Reveal
              key={index}
              delay={staggerDelay(index, 0.06)}
              className={clsx('col-span-1', SPREAD[index % SPREAD.length])}
            >
              <figure className="m-0 flex h-full flex-col">
                <PhotoButton
                  item={item}
                  index={index}
                  total={content.items.length}
                  onOpen={lightbox.open}
                  className="h-full grow"
                  sizes="(min-width: 768px) 50vw, 100vw"
                  priority={index === 0}
                />

                {/* El folio y el pie, en la página. Filete arriba: es lo que ata el texto a la
                    imagen y lo separa de la siguiente, como en un pliego impreso. */}
                <figcaption className="mt-4 flex items-baseline gap-3 border-t border-inv-line pt-3">
                  <span className="font-inv-display text-[13px] tabular-nums text-inv-accent">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {item.caption && (
                    <span className="text-[12px] leading-relaxed tracking-[0.14em] text-inv-ink-soft uppercase">
                      {item.caption}
                    </span>
                  )}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        {content.note && <BlockNote note={content.note} className="mt-14" />}
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
