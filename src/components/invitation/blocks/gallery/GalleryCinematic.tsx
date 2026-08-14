'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import type { GalleryItem } from '@/domain/invitation/blocks/gallery';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { Lightbox } from '../../shared/Lightbox';
import { useLightbox } from '../../shared/useLightbox';
import { PhotoButton, type GalleryVariantProps } from './gallery-parts';

/**
 * `gallery.cinematic` — fotogramas a pantalla completa, uno detrás de otro.
 *
 * Es la galería de la plantilla cinematográfica. Cada fotografía ocupa el ancho entero en
 * formato panorámico y se recorre bajando, como una secuencia: no se ojea, se **pasa**. La
 * imagen se acerca despacio mientras entra en pantalla —el efecto de un travelling lento— y el
 * pie aparece abajo, como un subtítulo.
 *
 * ## Qué la separa de las otras seis
 *
 * De la rejilla y la mampostería, que se ojean de un vistazo: aquí solo se ve una foto a la vez
 * y eso obliga a mirarla. De la pasarela, que avanza sola de lado: aquí el que avanza es quien
 * lee. Y del parallax, que compone una banda de fotos pequeñas flotando: aquí no hay
 * composición, hay encuadre.
 *
 * Conviene con **pocas fotografías y buenas** —seis de un fotógrafo—, y no conviene con veinte:
 * veinte pantallas completas seguidas son una galería que nadie termina.
 *
 * ## El formato: panorámico en pantalla ancha, alto en el móvil
 *
 * En escritorio, 21:9. El recorte es la decisión: una invitación no es un álbum, y en formato de
 * cine la fotografía deja de ser un recuerdo y pasa a ser un plano.
 *
 * En un teléfono ese mismo 21:9 mide **ciento cincuenta píxeles de alto** —una tira, no un
 * plano—, así que ahí el fotograma se mide contra la pantalla: `58svh`, algo más de media vista.
 * Es el mismo lenguaje llevado al formato del dispositivo, que es lo que hace el cine cuando pasa
 * a vertical. Mantener el panorámico en móvil habría sido respetar la proporción y perder la
 * intención, que es justo al revés de lo que hay que hacer.
 *
 * ## El acercamiento
 *
 * Va de 1.06 a 1, ligado al desplazamiento. Es poco a propósito: un travelling se nota cuando
 * termina, no mientras ocurre. Con `prefers-reduced-motion` la imagen se queda quieta y el
 * bloque sigue siendo lo que es, una secuencia de planos.
 */
export function GalleryCinematic({ content }: GalleryVariantProps) {
  const lightbox = useLightbox(content.items.length);

  return (
    <BlockSection block="gallery" variant="cinematic" className="bg-inv-primary/5">
      <BlockContainer>
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />
      </BlockContainer>

      {/* Los fotogramas van fuera del contenedor: un plano con márgenes no es un plano. */}
      <div className="mt-14 flex flex-col gap-2">
        {content.items.map((item, index) => (
          // El índice como clave es correcto aquí: las fotos no se reordenan ni se insertan en
          // caliente, se renderizan una vez desde contenido guardado.
          <CinematicFrame
            key={index}
            item={item}
            index={index}
            total={content.items.length}
            onOpen={lightbox.open}
          />
        ))}
      </div>

      {content.note && (
        <BlockContainer>
          <BlockNote note={content.note} className="mt-14 text-center" />
        </BlockContainer>
      )}

      <Lightbox
        items={content.items}
        index={lightbox.index}
        onClose={lightbox.close}
        onMove={lightbox.move}
      />
    </BlockSection>
  );
}

function CinematicFrame({
  item,
  index,
  total,
  onOpen,
}: {
  readonly item: GalleryItem;
  readonly index: number;
  readonly total: number;
  readonly onOpen: (index: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1.06, 1]);

  return (
    <div ref={ref} className="relative isolate w-full overflow-hidden">
      {/*
        El acercamiento va en una capa propia y no en el botón: escalando el botón se escalaría
        también el anillo de foco, y en el borde del recorte se vería cortado.
      */}
      <motion.div style={reduced ? undefined : { scale }} className="w-full">
        <PhotoButton
          item={item}
          index={index}
          total={total}
          onOpen={onOpen}
          className="h-[58svh] w-full sm:h-auto sm:aspect-[21/9]"
          sizes="100vw"
          priority={index === 0}
        />
      </motion.div>

      {item.caption && (
        /* Subtítulo de cine: centrado abajo, sobre un degradado que solo oscurece lo justo para
           que se lea encima de cualquier fotograma. */
        <p className="pointer-events-none absolute inset-x-0 bottom-0 m-0 bg-linear-to-t from-black/55 to-transparent px-6 pt-14 pb-6 text-center text-[13px] tracking-[0.16em] text-white/90 uppercase">
          {item.caption}
        </p>
      )}
    </div>
  );
}
