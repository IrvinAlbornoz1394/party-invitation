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
 * `gallery.plates` — las fotografías montadas como láminas, con filete y pie grabado.
 *
 * Es la novena galería y, como `story.pressed`, existe porque `botanical` no tenía este bloque y
 * al añadírselo ninguna de las libres servía. Quedaban cuatro —`parallax`, `carousel`, `masonry` y
 * `mosaic`—, y las cuatro son retículas de interfaz: correctas en cualquier plantilla y ajenas a
 * la única cuyo argumento es que todo parece papel de algodón. Junto a `hero.framed` y
 * `location.single-plate`, una mampostería se lee como la sección que se coló de otra invitación.
 *
 * ## En qué se diferencia de la polaroid, que es la que más se le parece
 *
 * Las dos montan la fotografía sobre algo en lugar de recortarla a una celda, y ahí se separan:
 *
 *   `polaroid`  marco blanco, **torcida**, a distinta altura que sus vecinas, pie manuscrito.
 *               Es papel de mesa: instantáneas que alguien fue dejando caer.
 *   `plates`    montura de cartulina, **a escuadra**, alineada en su fila, pie en versalitas
 *               grabadas. Es papel de archivo: láminas pegadas y rotuladas.
 *
 * La rotación es la diferencia que se ve a un metro de la pantalla, y es deliberado que aquí no
 * exista. `botanical` es papelería precisa —filetes, versalitas, retículas— y una lámina en ángulo
 * ahí no se lee como un gesto hecho a mano, se lee como un error de montaje.
 *
 * ## El pie va a la vista, y es la segunda excepción del bloque
 *
 * `domain/invitation/blocks/gallery.ts` dice que el pie vive en el visor y no sobre la retícula,
 * «donde convertiría un mosaico en una lista de pies de foto», y `polaroid` era la única excepción.
 * Ahora son dos, y por el mismo motivo que aquella: el rótulo **es** parte de la pieza. Una lámina
 * de archivo sin su versalita al pie está a medio montar, igual que una polaroid sin su franja
 * escrita.
 *
 * La diferencia con `polaroid` es que aquí el pie **no se reserva cuando no existe**. Aquella pinta
 * la franja blanca vacía porque la franja es lo que hace que una polaroid sea una polaroid; una
 * lámina sin rotular sigue siendo una lámina, y una fila de versalitas en blanco solo dejaría
 * huecos desalineados. Se ve en el escaparate: la demo de boda trae pies y la de XV no —a
 * propósito, ver `demo/gallery-samples.ts`— así que las dos composiciones tienen que sostenerse.
 *
 * ## Dos columnas, y verticales
 *
 * `aspect-[4/5]` y no cuadrado: una lámina de archivo es un retrato, y es además la proporción con
 * la que llegan la mayoría de las fotos de una sesión. Dos columnas en móvil y tres desde `sm`,
 * como la rejilla — por debajo de unos 150px de lado dejan de reconocerse las caras, que es lo
 * único que se está mirando.
 */
export function GalleryPlates({ content }: GalleryVariantProps) {
  const lightbox = useLightbox(content.items.length);

  return (
    <BlockSection block="gallery" variant="plates">
      <BlockContainer>
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleCase="caps"
        />

        <div className="mt-12 grid grid-cols-2 gap-5 sm:gap-7 lg:grid-cols-3">
          {content.items.map((item, index) => (
            // El índice como clave es correcto aquí: las fotos no se reordenan ni se insertan
            // en caliente, se renderizan una vez desde contenido guardado.
            <Reveal key={index} delay={staggerDelay(index)}>
              {/*
                `figure` con su `figcaption`: el pie es el pie de esta fotografía y no un párrafo
                que quedó debajo. Es lo que hace que un lector de pantalla los anuncie juntos.
              */}
              <figure className="m-0">
                {/* La montura: filete fino y margen de papel alrededor de la lámina. El borde va
                    aquí y no en el botón porque el botón recorta la imagen al ampliarla con el
                    ratón (`overflow-hidden`), y un filete dentro de la zona recortada se pierde
                    justo en el gesto que lo tendría que enseñar. */}
                <div className="border border-inv-line bg-inv-surface p-1.5 shadow-inv-soft">
                  <PhotoButton
                    item={item}
                    index={index}
                    total={content.items.length}
                    onOpen={lightbox.open}
                    className="aspect-[4/5]"
                    sizes="(min-width: 1024px) 30vw, 50vw"
                  />
                </div>

                {item.caption && (
                  <figcaption className="mt-2.5 text-center text-[8.5px] tracking-[0.18em] text-inv-ink-soft uppercase sm:text-[9.5px] sm:tracking-[0.22em]">
                    {item.caption}
                  </figcaption>
                )}
              </figure>
            </Reveal>
          ))}
        </div>

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
