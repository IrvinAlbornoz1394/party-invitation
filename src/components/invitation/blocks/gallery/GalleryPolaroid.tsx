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
 * `gallery.polaroid` — las fotos como instantáneas repartidas sobre la mesa.
 *
 * Es la más cálida de las seis y la que menos parece una página web: cada foto va en su marco
 * blanco, ligeramente torcida y a distinta altura que sus vecinas, como si alguien las hubiera
 * ido dejando encima de una mesa. Es la que conviene en una fiesta infantil, una despedida o
 * cualquier evento donde la invitación deba sentirse hecha a mano y no diseñada.
 *
 * ## La franja blanca está siempre, aunque no haya pie
 *
 * Es la parte que hace que una polaroid sea una polaroid, así que se pinta también cuando la
 * foto no tiene texto: en blanco, como la instantánea que nadie llegó a rotular. Ocultarla en
 * ese caso dejaría unas fotos con faldón y otras sin él, y la mesa se vería descuadrada.
 *
 * Es además el único sitio de toda la invitación donde el pie de foto se lee **sin ampliar** —en
 * las otras cinco galerías vive en el visor—, y por eso va con la tipografía manuscrita del
 * tema: es una anotación a mano sobre la foto, no un texto de la página.
 *
 * ## El desorden es deliberado y es siempre el mismo
 *
 * Los ángulos y las alturas salen de la posición de cada foto, no de un número al azar. Con
 * azar de verdad, la composición cambiaría en cada recarga —y daría distinto en el servidor y
 * en el cliente, que es un error de hidratación—. Derivado de la posición, el desorden es
 * estable: la misma invitación se ve igual cada vez que se abre.
 *
 * Al pasar el ratón o al enfocar con el teclado, la foto **se endereza y sube**. Es el gesto de
 * coger una de la mesa para mirarla de cerca, y de paso deja claro cuál está a punto de
 * ampliarse.
 */

/**
 * Los ángulos del desorden, en grados.
 *
 * Se escriben como clases completas y no se calculan: Tailwind genera el CSS leyendo el código
 * fuente, y una clase compuesta al vuelo —`rotate-[${angle}deg]`— no aparece en ningún sitio que
 * pueda leer, así que no se generaría y las fotos saldrían todas rectas.
 *
 * Son cinco y ninguno pasa de tres grados: por encima, las fotos se pisan entre ellas y el
 * conjunto pasa de «dejadas sobre la mesa» a «tiradas de cualquier manera».
 */
const TILTS = [
  'rotate-[-2.5deg]',
  'rotate-[1.8deg]',
  'rotate-[-1.2deg]',
  'rotate-[2.6deg]',
  'rotate-[-3deg]',
] as const;

/** Las alturas, para que las columnas no queden alineadas como una rejilla. */
const OFFSETS = ['sm:mt-0', 'sm:mt-10', 'sm:mt-4', 'sm:mt-12', 'sm:mt-2'] as const;

export function GalleryPolaroid({ content }: GalleryVariantProps) {
  const lightbox = useLightbox(content.items.length);

  return (
    <BlockSection block="gallery" variant="polaroid">
      <BlockContainer>
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3">
          {content.items.map((item, index) => (
            // El índice como clave es correcto aquí: las fotos no se reordenan ni se insertan
            // en caliente, se renderizan una vez desde contenido guardado.
            <Reveal
              key={index}
              delay={staggerDelay(index, 0.07)}
              className={OFFSETS[index % OFFSETS.length]}
            >
              {/*
                El giro va en una capa distinta de la animación de entrada. Tailwind v4 usa la
                propiedad `rotate` y Motion escribe `transform`, así que conviven; aun así se
                separan, porque la entrada anima y el giro es un estado — mezclarlos haría que
                cada retoque de uno se notara en el otro.
              */}
              <figure
                className={clsx(
                  'group/foto m-0 bg-inv-surface p-3 pb-0 shadow-inv-soft',
                  'transition-[rotate,translate] duration-500 ease-out',
                  'hover:rotate-0 hover:-translate-y-2 focus-within:rotate-0 focus-within:-translate-y-2',
                  TILTS[index % TILTS.length],
                )}
              >
                <PhotoButton
                  item={item}
                  index={index}
                  total={content.items.length}
                  onOpen={lightbox.open}
                  className="aspect-square"
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 88vw"
                />

                <figcaption className="flex h-16 items-center justify-center px-3 text-center font-inv-script text-[1.4rem] leading-none text-inv-ink">
                  {item.caption}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        {content.note && <BlockNote note={content.note} className="mt-12 text-center" />}
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
