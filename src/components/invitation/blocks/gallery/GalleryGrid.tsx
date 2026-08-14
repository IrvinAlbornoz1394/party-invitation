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
 * `gallery.grid` — la rejilla cuadrada, sin trucos.
 *
 * Es la que hay que elegir cuando las fotos no son homogéneas. Al recortarlas todas a cuadrado,
 * una selfie vertical y un paisaje apaisado ocupan el mismo sitio y la retícula se ve limpia:
 * el orden lo pone la rejilla y no las fotos, que es exactamente lo contrario de lo que hace la
 * mampostería.
 *
 * Dos columnas en móvil y tres en escritorio. No cuatro: en una invitación las fotos son de
 * personas, y por debajo de unos 150px de lado dejan de reconocerse las caras — que es lo único
 * que se está mirando.
 *
 * ## Por qué es un componente de cliente
 *
 * Por el visor: ampliar una foto necesita estado y teclado. Los cinco componentes de galería lo
 * son, y es una diferencia real con el resto de bloques —portada, historia, detalles y
 * cronograma se renderizan en el servidor—. Aquí el coste está justificado: en un móvil las
 * fotos se ven a 160px, y poder ampliarlas es la mitad del bloque.
 */
export function GalleryGrid({ content }: GalleryVariantProps) {
  const lightbox = useLightbox(content.items.length);

  return (
    <BlockSection block="gallery" variant="grid">
      <BlockContainer>
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />

        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {content.items.map((item, index) => (
            // El índice como clave es correcto aquí: las fotos no se reordenan ni se insertan
            // en caliente, se renderizan una vez desde contenido guardado.
            <Reveal key={index} delay={staggerDelay(index)}>
              <PhotoButton
                item={item}
                index={index}
                total={content.items.length}
                onOpen={lightbox.open}
                className="aspect-square rounded-inv-md"
                sizes="(min-width: 1024px) 33vw, 50vw"
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
