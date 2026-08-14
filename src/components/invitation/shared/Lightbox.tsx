'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { GalleryItem } from '@/domain/invitation/blocks/gallery';

/**
 * La fotografía ampliada, sobre el resto de la invitación.
 *
 * Se pinta solo cuando hay una foto abierta; el estado y el teclado los lleva `useLightbox`.
 *
 * ## Por qué no usa el color del tema
 *
 * El velo es negro y los controles blancos en los cinco temas, incluido «Marfil y oro». Es la
 * única parte de la invitación que se sale del tema a propósito: aquí lo que se está mirando es
 * **la fotografía**, y un velo color ciruela le cambia el color a la piel de la gente que sale
 * en ella. Los visores de fotos son negros por la misma razón desde hace cien años.
 *
 * ## El foco
 *
 * Al abrir, el foco salta al botón de cerrar. Sin eso, quien navega con teclado sigue con el
 * foco en la miniatura de detrás: pulsa Tab y recorre la invitación entera sin ver dónde está,
 * mientras la pantalla enseña una foto que no puede cerrar.
 */
export function Lightbox({
  items,
  index,
  onClose,
  onMove,
}: {
  readonly items: readonly GalleryItem[];
  /** La foto abierta, o `null` si no hay ninguna. */
  readonly index: number | null;
  readonly onClose: () => void;
  readonly onMove: (delta: number) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (index !== null) closeRef.current?.focus();
  }, [index]);

  if (index === null) return null;

  const item = items[index];

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Fotografía ampliada"
      className="inv-fade fixed inset-0 z-50 flex flex-col bg-black/92 backdrop-blur-sm"
      /* El clic en el fondo cierra, que es lo que todo el mundo intenta primero. El de la foto
         no: `stopPropagation` en la figura evita cerrar justo al intentar mirarla de cerca. */
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-5 py-4 text-white/85">
        <span className="text-[13px] tracking-[0.18em] tabular-nums">
          {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
        </span>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Cerrar la fotografía"
          className="grid size-11 place-items-center rounded-full transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          <X size={22} strokeWidth={1.7} aria-hidden="true" />
        </button>
      </div>

      <figure
        className="relative m-0 flex min-h-0 flex-1 items-center justify-center px-3 pb-3"
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      >
        <div className="relative h-full w-full">
          {/*
            `object-contain` y no `cover`: aquí se está mirando la foto entera, y recortarla para
            llenar la pantalla es exactamente lo contrario de lo que se pidió al ampliarla.
          */}
          <Image
            src={item.url}
            alt={item.alt}
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />
        </div>

        {item.caption && (
          <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-6 pt-10 pb-5 text-center text-[13.5px] text-white/90">
            {item.caption}
          </figcaption>
        )}
      </figure>

      {items.length > 1 && (
        <div className="flex items-center justify-center gap-4 pb-6 text-white/85">
          <LightboxArrow label="Foto anterior" onClick={() => onMove(-1)}>
            <ChevronLeft size={24} strokeWidth={1.7} aria-hidden="true" />
          </LightboxArrow>
          <LightboxArrow label="Foto siguiente" onClick={() => onMove(1)}>
            <ChevronRight size={24} strokeWidth={1.7} aria-hidden="true" />
          </LightboxArrow>
        </div>
      )}
    </div>
  );
}

function LightboxArrow({
  label,
  onClick,
  children,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      /* Los controles están dentro del velo, que cierra al pulsarlo: sin detener la propagación,
         pasar a la foto siguiente cerraría el visor en el mismo clic. */
      onClick={(clickEvent) => {
        clickEvent.stopPropagation();
        onClick();
      }}
      className="grid size-12 place-items-center rounded-full border border-white/25 transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
    >
      {children}
    </button>
  );
}
