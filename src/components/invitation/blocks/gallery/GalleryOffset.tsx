'use client';

import { aspectRatioOf, type GalleryItem } from '@/domain/invitation/blocks/gallery';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { Lightbox } from '../../shared/Lightbox';
import { Reveal } from '../../shared/Reveal';
import { staggerDelay } from '../../shared/stagger';
import { useLightbox } from '../../shared/useLightbox';
import { PhotoButton, type GalleryVariantProps } from './gallery-parts';

/**
 * `gallery.offset` — el collage a dos columnas desfasadas, rematado por una fotografía a todo el
 * ancho.
 *
 * Es la décima galería y sustituye al mosaico en `silk`. Las diez se distinguen por **cómo
 * reparten el ancho**, que es lo único que de verdad separa a una galería de otra:
 *
 *   `grid`       rejilla cuadrada, todas iguales.
 *   `mosaic`     una destacada grande y el resto alrededor.
 *   `masonry`    mampostería: cada foto con su proporción, columnas a ras.
 *   `polaroid`   instantáneas torcidas con su franja blanca.
 *   `plates`     láminas a escuadra, con filete y rotuladas.
 *   `editorial`  maqueta de pliego con folios y pies.
 *   `cinematic`  planos a pantalla completa.
 *   `carousel`   una tira continua que cruza la pantalla.
 *   `parallax`   fotos flotando a distinta velocidad.
 *   `offset`     **dos columnas a distinta altura y un remate a todo el ancho.**
 *
 * La diferencia con `masonry` —la más cercana— es que allí las dos columnas empiezan a la misma
 * altura y lo que las descuadra es el azar de las proporciones. Aquí el desfase es **deliberado y
 * constante**: la columna derecha arranca caída, así que ninguna pareja de fotos forma un renglón
 * y el ojo baja en zigzag en lugar de por filas. Es lo que hace que un puñado de fotos se lea
 * como un collage montado a mano y no como una cuadrícula.
 *
 * ## El remate a todo el ancho no es decorativo
 *
 * Dos columnas desfasadas terminan por fuerza a distinta altura, y sin nada debajo la sección
 * acaba en un escalón — se lee como si faltara una foto. La última se saca de las columnas y
 * cruza el ancho completo: cierra el bloque en horizontal y devuelve el eje. Se hace desde tres
 * fotografías; con dos, dos columnas y nada más ya es una composición cerrada.
 *
 * ## Cada foto conserva su proporción
 *
 * Con `aspectRatioOf`, igual que la mampostería: una vertical se ve vertical. Recortarlas todas a
 * la misma caja convertiría el collage en una rejilla con las columnas movidas, que es
 * exactamente lo que no es. El remate sí va recortado a apaisado —es el suelo de la composición y
 * tiene que ser una banda—.
 *
 * ## Es cliente, como las otras nueve
 *
 * Por el visor: ampliar una foto necesita estado y teclado. Ver `docs/COMPONENTES.md`.
 */
export function GalleryOffset({ content }: GalleryVariantProps) {
  const lightbox = useLightbox(content.items.length);

  /* El remate solo cuando sobra una foto de verdad. Con dos, sacar una dejaría una columna
     huérfana al lado de otra vacía. */
  const hasFooter = content.items.length >= 3;
  const columnItems = hasFooter ? content.items.slice(0, -1) : content.items;
  const footerItem = hasFooter ? (content.items.at(-1) as GalleryItem) : null;
  const footerIndex = content.items.length - 1;

  return (
    <BlockSection block="gallery" variant="offset">
      <BlockContainer className="max-w-3xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />

        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4">
          {[0, 1].map((column) => (
            <div
              key={column}
              /*
                El desfase. Va como margen superior de la segunda columna y en `rem`, no en
                porcentaje: un porcentaje se mide contra el **ancho** del contenedor, así que en
                un móvil estrecho el desfase se encogería justo donde más se nota. En escritorio
                crece un poco porque las fotos también son más altas.
              */
              className={column === 1 ? 'grid gap-3 mt-8 sm:gap-4 sm:mt-14' : 'grid gap-3 sm:gap-4'}
            >
              {columnItems
                .map((item, index) => ({ item, index }))
                .filter(({ index }) => index % 2 === column)
                .map(({ item, index }) => (
                  <Reveal key={index} delay={staggerDelay(index)}>
                    <PhotoButton
                      item={item}
                      index={index}
                      total={content.items.length}
                      onOpen={lightbox.open}
                      priority={index < 2}
                      style={{ aspectRatio: aspectRatioOf(item, index) }}
                      className="rounded-inv-md shadow-inv-soft"
                      sizes="(min-width: 768px) 22rem, 45vw"
                    />
                  </Reveal>
                ))}
            </div>
          ))}
        </div>

        {footerItem && (
          <Reveal delay={staggerDelay(footerIndex)} className="mt-3 sm:mt-4">
            <PhotoButton
              item={footerItem}
              index={footerIndex}
              total={content.items.length}
              onOpen={lightbox.open}
              className="aspect-[16/9] rounded-inv-md shadow-inv-soft"
              sizes="(min-width: 768px) 46rem, 92vw"
            />
          </Reveal>
        )}

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
