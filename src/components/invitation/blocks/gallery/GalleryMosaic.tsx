'use client';

import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { Lightbox } from '../../shared/Lightbox';
import { Reveal } from '../../shared/Reveal';
import { staggerDelay } from '../../shared/stagger';
import { useLightbox } from '../../shared/useLightbox';
import { PhotoButton, type GalleryVariantProps } from './gallery-parts';

/**
 * `gallery.mosaic` — una fotografía manda y el resto la acompañan.
 *
 * Es la única de las cinco que **jerarquiza**. Las otras cuatro tratan todas las fotos por
 * igual —y esa es su virtud—; esta le da a la primera cuatro veces el tamaño de las demás,
 * porque casi siempre hay una foto que vale por todas y enseñarla del tamaño de un sello es
 * desperdiciarla.
 *
 * Tiene una consecuencia práctica que conviene tener presente al configurar: **el orden importa
 * de verdad**. La primera del contenido es la destacada, así que cambiar la galería de sitio en
 * la lista cambia la composición. En las otras cuatro, reordenar es cosmética.
 *
 * ## La retícula
 *
 * Filas de alto medido (`auto-rows`) y no proporciones: es lo que permite que la foto grande
 * ocupe exactamente dos filas y dos columnas y encaje sin huecos con las pequeñas. Con alturas
 * automáticas, una foto más alta que otra desplazaría la columna entera y el mosaico dejaría de
 * ser un mosaico.
 *
 * El alto es un `clamp` ligado al ancho de la ventana y no tres valores por punto de ruptura: el
 * mosaico tiene que mantener su proporción **entre** los saltos, no solo en ellos. Con valores
 * escalonados, en una tableta de 800px las celdas se veían achatadas hasta el siguiente salto.
 *
 * La destacada se marca con `priority`: es la imagen más grande del bloque y la primera que se
 * ve al llegar. Las demás se cargan cuando toca.
 */
export function GalleryMosaic({ content }: GalleryVariantProps) {
  const lightbox = useLightbox(content.items.length);

  return (
    <BlockSection block="gallery" variant="mosaic">
      <BlockContainer>
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />

        <div className="mt-12 grid auto-rows-[clamp(6.5rem,24vw,11.5rem)] grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {content.items.map((item, index) => (
            // El índice como clave es correcto aquí: las fotos no se reordenan ni se insertan
            // en caliente, se renderizan una vez desde contenido guardado.
            /* La retícula la lleva `Reveal` y no el botón: las clases de tramo (`col-span`) solo
               funcionan en un hijo directo de la rejilla, y el contenedor de la animación pasa a
               serlo en cuanto se envuelve. */
            <Reveal
              key={index}
              delay={staggerDelay(index)}
              className={index === 0 ? 'col-span-2 row-span-2 h-full' : 'h-full'}
            >
              <PhotoButton
                item={item}
                index={index}
                total={content.items.length}
                onOpen={lightbox.open}
                priority={index === 0}
                className={
                  index === 0
                    ? 'h-full rounded-inv-lg shadow-inv-soft'
                    : 'h-full rounded-inv-md'
                }
                sizes={
                  index === 0 ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 25vw, 50vw'
                }
              />
            </Reveal>
          ))}
        </div>

        {content.note && <BlockNote note={content.note} className="mt-8 text-center" />}
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
