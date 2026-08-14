'use client';

import { aspectRatioOf } from '@/domain/invitation/blocks/gallery';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { Lightbox } from '../../shared/Lightbox';
import { Reveal } from '../../shared/Reveal';
import { staggerDelay } from '../../shared/stagger';
import { useLightbox } from '../../shared/useLightbox';
import { PhotoButton, type GalleryVariantProps } from './gallery-parts';

/**
 * `gallery.masonry` — la mampostería: cada foto con su propia proporción.
 *
 * Es la opuesta a la rejilla. Allí manda la retícula y las fotos se recortan; aquí mandan las
 * fotos y la retícula se acomoda. Conviene cuando el material es bueno y variado —verticales de
 * retrato junto a apaisadas de salón— porque no recorta nada: ninguna cabeza se queda fuera del
 * cuadro por un encuadre que decidió el CSS.
 *
 * ## Columnas de CSS y no una retícula
 *
 * `columns` reparte las fotos en columnas verticales y respeta su alto natural, que es
 * literalmente la definición de mampostería. Con `grid` habría que calcular en JavaScript
 * cuántas filas ocupa cada foto y volver a hacerlo en cada cambio de tamaño; con columnas lo
 * hace el navegador y funciona sin una línea de código.
 *
 * El precio es el orden: las columnas se llenan **de arriba abajo**, así que la lectura visual
 * es por columnas y no por filas. En una galería de recuerdos da igual —no hay un orden que
 * seguir—; en un cronograma sería inaceptable, y por eso este recurso vale aquí y no allí.
 *
 * `break-inside-avoid` es obligatorio: sin él, el navegador parte una foto por la mitad entre el
 * final de una columna y el principio de la siguiente.
 *
 * ## Las proporciones
 *
 * Salen de `width`/`height` de cada foto, que la base de datos ya guarda. Cuando faltan, el
 * dominio reparte cuatro proporciones típicas de móvil por posición: la mampostería sigue
 * pareciendo una mampostería, y —esto es lo importante— la reserva de espacio es la misma en el
 * servidor y en el cliente, así que la página no salta al cargar.
 */
export function GalleryMasonry({ content }: GalleryVariantProps) {
  const lightbox = useLightbox(content.items.length);

  return (
    <BlockSection block="gallery" variant="masonry">
      <BlockContainer>
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />

        <div className="mt-12 columns-2 gap-3 sm:gap-4 lg:columns-3">
          {content.items.map((item, index) => (
            // El índice como clave es correcto aquí: las fotos no se reordenan ni se insertan
            // en caliente, se renderizan una vez desde contenido guardado.
            <Reveal
              key={index}
              delay={staggerDelay(index)}
              className="mb-3 break-inside-avoid sm:mb-4"
            >
              <PhotoButton
                item={item}
                index={index}
                total={content.items.length}
                onOpen={lightbox.open}
                className="rounded-inv-md"
                style={{ aspectRatio: aspectRatioOf(item, index) }}
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
