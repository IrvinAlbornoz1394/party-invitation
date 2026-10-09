import clsx from 'clsx';
import { requireDesignAsset } from '@/lib/design-assets';
import { DesignAsset } from '../../shared/DesignAsset';

/**
 * Los dibujos de las puertas: filigrana, ramas y alianzas.
 *
 * Son SVG en línea y no archivos, y la razón es la misma que sostiene todo el catálogo: **el
 * color lo pone el tema**. Un PNG con la filigrana en dorado se vería mal en cuanto alguien
 * eligiera el tema verde, y habría que mantener una copia por tema. Dibujados con
 * `currentColor`, el mismo trazo sale marfil sobre una foto oscura y ciruela sobre papel.
 *
 * Van sin fondo y sin tamaño propio: el que los coloca decide cuánto miden con clases. Todos
 * llevan `aria-hidden`, porque un ornamento no dice nada que no diga el texto de al lado y
 * anunciarlo interrumpe la lectura.
 *
 * Aquí solo quedan los que **únicamente la bienvenida** usa. El canto rasgado se fue a
 * `shared/paper-ornaments.tsx` en cuanto lo pidieron también el calendario y la confirmación: un
 * ornamento compartido que vive en la carpeta de un bloque acaba retocado para ese bloque, y con
 * él se mueven los otros dos sin que nadie lo pida.
 */

/**
 * La esquina de filigrana: volutas que recorren los dos bordes, como el grabado de una
 * participación.
 *
 * El dibujo es `corner-filigree-001` de la biblioteca de recursos. Es **una sola** esquina —la
 * de arriba a la izquierda— y las otras tres son la misma girada con CSS (`rotate`).
 */
const FILIGREE_CORNER = requireDesignAsset('corner-filigree-001');

export function FiligreeCorner({ className }: { readonly className?: string }) {
  return <DesignAsset asset={FILIGREE_CORNER} className={clsx('pointer-events-none', className)} />;
}

/**
 * Las dos alianzas enlazadas.
 *
 * Dos circunferencias que se cruzan, sin más. Es un símbolo, no una ilustración: a los treinta
 * píxeles a los que se ve en un móvil, cualquier detalle de más se convierte en una mancha.
 */
export function RingsGlyph({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 64 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
      className={clsx('pointer-events-none', className)}
    >
      <circle cx="25" cy="22" r="14" />
      <circle cx="41" cy="22" r="14" />
      {/* El destello del engaste: lo único que distingue dos aros de dos círculos. */}
      <path d="M25 4.5 22.5 8h5L25 4.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

