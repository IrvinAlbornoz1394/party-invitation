import clsx from 'clsx';
import Image from 'next/image';
import { twMerge } from 'tailwind-merge';
import type { ComponentType, CSSProperties } from 'react';
import type { GalleryContent, GalleryItem } from '@/domain/invitation/blocks/gallery';

/**
 * Las piezas de una galería, compartidas por sus cinco componentes.
 *
 * Lo que cambia entre ellos es la retícula —escalonada, rejilla, carrusel, mampostería,
 * mosaico—; lo que hace cada fotografía cuando se pulsa, no. Y ahí es donde se acumulan los
 * descuidos: el cursor que no dice que se puede ampliar, la etiqueta que un lector de pantalla
 * necesita, el recorte que se sale del contenedor al ampliar en `hover`.
 */

export interface GalleryVariantProps {
  readonly content: GalleryContent;
}

/** El tipo con el que el registro guarda una galería, sea cual sea su forma. */
export type GalleryVariant = ComponentType<GalleryVariantProps>;

/**
 * Una fotografía que se puede ampliar.
 *
 * Es un `<button>` y no un `<div>` con `onClick`: así responde a Enter y a espacio, entra en el
 * recorrido del tabulador y un lector de pantalla la anuncia como algo que se puede activar.
 * Un `div` pulsable deja fuera a todo el que no use ratón, en un bloque cuya única interacción
 * es justamente esa.
 *
 * La etiqueta accesible lleva el número de foto además de su texto alternativo. En una rejilla
 * de doce, «Abrir la fotografía» repetido doce veces no le dice a nadie cuál está enfocando.
 */
export function PhotoButton({
  item,
  index,
  total,
  onOpen,
  className,
  style,
  sizes,
  priority = false,
}: {
  readonly item: GalleryItem;
  readonly index: number;
  readonly total: number;
  readonly onOpen: (index: number) => void;
  readonly className?: string;
  /** Para la proporción calculada de la mampostería, que no cabe en una clase fija. */
  readonly style?: CSSProperties;
  readonly sizes: string;
  readonly priority?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      style={style}
      aria-label={`Ampliar la fotografía ${index + 1} de ${total}: ${item.alt}`}
      /*
       * `twMerge` y no solo `clsx`: el ancho por defecto es `w-full` y la pasarela necesita
       * `w-auto` —su ancho lo decide la proporción de cada foto—. Concatenando, las dos clases
       * acaban en el atributo y gana la que Tailwind haya puesto después en la hoja, que no es
       * la que se escribió al final. `twMerge` resuelve el conflicto por familia de utilidad.
       */
      className={twMerge(
        clsx(
          'group relative isolate m-0 block w-full cursor-zoom-in overflow-hidden border-0 bg-inv-primary/5 p-0',
          'focus-visible:ring-2 focus-visible:ring-inv-accent focus-visible:ring-offset-2 focus-visible:outline-none',
          className,
        ),
      )}
    >
      {/*
        El zoom va en la imagen y el recorte en el botón. Al revés —escalando el botón— el
        contenedor crece y empuja a sus vecinos, que en una mampostería recoloca la columna
        entera con solo pasar el ratón por encima.
      */}
      <Image
        src={item.url}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
    </button>
  );
}
