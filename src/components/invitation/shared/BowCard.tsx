import type { ReactNode } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { requireDesignAsset } from '@/lib/design-assets';
import { DesignAsset } from './DesignAsset';

const BOW = requireDesignAsset('bow-ribbon-line-001');

/**
 * Una tarjeta de papelería: blanca, de cantos redondeados, con un filete del principal por fuera,
 * otro del acento por dentro y un moño de cinta dibujado que cuelga del canto de arriba.
 *
 * Es la pieza de la estructura `coquette`, donde casi todo lo que se lee —la historia, cada sede,
 * la vestimenta, la confirmación, los detalles— va en una de estas tarjetas sobre el papel rosado,
 * como fichas sueltas de una caja de recuerdos. Está aquí y no repetida en cada variante por lo
 * mismo que `ArchFrame` y `PolaroidFrame`: las medidas tienen que coincidir siempre —el hueco
 * entre los dos filetes, el sitio del moño, el corte del filete de dentro bajo el moño— y una
 * tarjeta con el filete un poco más abierto que su vecina se lee como un error de imprenta.
 *
 * ## El filete de dentro se corta bajo el moño
 *
 * En la referencia el moño no se pinta **encima** del filete dorado: el filete se interrumpe y el
 * moño ocupa el hueco. Se consigue con una pastilla del color de la superficie detrás del moño,
 * que tapa el tramo del filete; sin ella, la línea dorada atraviesa el nudo.
 *
 * El blanco es la superficie del tema (`bg-inv-surface`), no un blanco fijo como el de la
 * polaroid: aquí la tarjeta sí es parte de la invitación, y con otro tema tiene que cambiar con
 * ella.
 */
export function BowCard({
  children,
  bow = true,
  className,
  innerClassName,
}: {
  readonly children: ReactNode;
  /** Sin moño, la tarjeta queda con sus dos filetes. Para una segunda tarjeta junto a otra. */
  readonly bow?: boolean;
  readonly className?: string;
  /** El relleno del contenido. Por defecto, holgado y con sitio arriba para el moño. */
  readonly innerClassName?: string;
}) {
  return (
    <div
      className={twMerge(
        clsx(
          'relative rounded-[1.4rem] border border-solid border-inv-primary/30 bg-inv-surface p-2.5',
          'shadow-[0_22px_44px_-30px_rgba(120,50,60,0.45)]',
          className,
        ),
      )}
    >
      <div
        className={twMerge(
          clsx(
            'relative h-full rounded-[1rem] border border-solid border-inv-accent/55 px-5 pt-12 pb-8 text-center sm:px-7',
            !bow && 'pt-8',
            innerClassName,
          ),
        )}
      >
        {children}
      </div>

      {bow && (
        <>
          <span
            aria-hidden="true"
            className="absolute top-2 left-1/2 h-1.5 w-14 -translate-x-1/2 -translate-y-1/2 bg-inv-surface"
          />
          <DesignAsset
            asset={BOW}
            className="pointer-events-none absolute -top-1.5 left-1/2 w-12 -translate-x-1/2 text-inv-primary sm:w-14"
          />
        </>
      )}
    </div>
  );
}
