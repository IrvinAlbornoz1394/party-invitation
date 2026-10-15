import type { ReactNode } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Una ventana de medio punto: lo que hay dentro se recorta en arco y lleva un filete fino por
 * fuera, separado unos píxeles.
 *
 * Es la pieza de la estructura `arbor`, donde todo lo que se mira —el retrato, la galería, la
 * lámina de la historia, la foto del cierre— va dentro de un arco. Está aquí y no repetida en
 * cada variante porque el arco tiene dos decisiones que tienen que coincidir siempre: el radio
 * (`rounded-t-full`, que con una caja más alta que ancha da el semicírculo exacto) y la
 * separación del filete. Escritas cuatro veces, la cuarta acabaría con un filete pegado.
 *
 * El filete va **fuera** de la imagen y no como borde suyo: pegado a la fotografía se lee como
 * el canto de la foto; separado, como el marco de una ventana. Por eso quien coloca el arco
 * tiene que dejarle sitio alrededor.
 *
 * La proporción y el ancho los pone quien lo usa (`aspect-[3/4] w-64`): un retrato y una
 * viñeta no piden el mismo arco.
 */
export function ArchFrame({
  children,
  outline = true,
  className,
}: {
  readonly children: ReactNode;
  /** Si lleva el filete exterior. Sin él queda solo el recorte. */
  readonly outline?: boolean;
  readonly className?: string;
}) {
  return (
    <div className={twMerge(clsx('relative', className))}>
      {outline && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[7px] rounded-t-full border border-inv-accent/45"
        />
      )}
      <div className="relative isolate h-full w-full overflow-hidden rounded-t-full bg-inv-primary/5">
        {children}
      </div>
    </div>
  );
}
