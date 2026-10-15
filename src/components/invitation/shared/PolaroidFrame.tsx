import type { ReactNode } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Una instantánea: la foto con su marco blanco, el faldón más ancho abajo y una sombra corta,
 * como si estuviera apoyada sobre el papel.
 *
 * Es la pieza de la estructura `blush`, donde todo lo que se mira —el retrato, las sedes, la
 * galería, la historia— va en una polaroid ligeramente girada, con una flor o un corazón
 * asomando por una esquina. Está aquí y no repetida en cada variante por lo mismo que
 * `ArchFrame`: el marco tiene medidas que tienen que coincidir siempre —el canto, el faldón, la
 * sombra—, y una polaroid con el faldón del mismo ancho que los lados se lee como una foto con
 * borde, no como una instantánea.
 *
 * El blanco es blanco de verdad y no la superficie del tema: el marco es papel fotográfico, no
 * parte de la invitación, y sobre un fondo rosado es justamente el contraste lo que lo despega.
 *
 * El giro, el ancho y la proporción de la foto los pone quien la coloca (`rotate-[-3deg] w-64`,
 * `aspect` en `photoClassName`); los adornos que asoman, también, por fuera de este componente.
 */
export function PolaroidFrame({
  children,
  caption,
  className,
  photoClassName,
}: {
  readonly children: ReactNode;
  /** Lo que va escrito a mano en el faldón. Sin él, el faldón queda en blanco, como en una de verdad. */
  readonly caption?: string | null;
  readonly className?: string;
  /** La caja de la foto. Por defecto, cuadrada. */
  readonly photoClassName?: string;
}) {
  return (
    <figure
      className={twMerge(
        clsx(
          'relative m-0 bg-white p-2.5 pb-10 shadow-[0_18px_36px_-22px_rgba(90,48,58,0.55)] sm:p-3 sm:pb-12',
          className,
        ),
      )}
    >
      <div
        className={twMerge(
          clsx('relative isolate aspect-square w-full overflow-hidden bg-inv-primary/10', photoClassName),
        )}
      >
        {children}
      </div>
      {caption && (
        <figcaption className="absolute inset-x-3 bottom-2.5 truncate text-center font-inv-script text-[1.15rem] leading-tight text-inv-ink-soft sm:bottom-3.5">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
