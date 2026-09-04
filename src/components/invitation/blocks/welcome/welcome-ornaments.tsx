import clsx from 'clsx';

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
 * La esquina de filigrana: rombos, hojas y puntos, como el grabado de una participación.
 *
 * Se dibuja **una sola** —la de arriba a la izquierda— y las otras tres son la misma girada con
 * CSS (`rotate`). Dibujar las cuatro a mano sería cuadruplicar un trazo que tiene que ser
 * idéntico, y a la tercera dejaría de serlo.
 */
export function FiligreeCorner({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden="true"
      className={clsx('pointer-events-none', className)}
    >
      {/* El vértice: un rombo pequeño del que arrancan los dos brazos. */}
      <path d="M10 10 3.5 16.5 10 23 16.5 16.5Z" />

      {/* Brazo horizontal: punto, hoja, punto, rombo. */}
      <circle cx="26" cy="16.5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="33" cy="16.5" r="1.2" fill="currentColor" stroke="none" />
      <path d="M40 16.5c6-9 16-9 22 0-6 9-16 9-22 0Z" />
      <path d="M51 8.5v16" strokeWidth="0.7" />
      <circle cx="69" cy="16.5" r="1.6" fill="currentColor" stroke="none" />
      <path d="M76 16.5h14" strokeWidth="0.7" />
      <path d="M97 10 90.5 16.5 97 23 103.5 16.5Z" />

      {/* Brazo vertical: el mismo repertorio, girado. */}
      <circle cx="16.5" cy="26" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="33" r="1.2" fill="currentColor" stroke="none" />
      <path d="M16.5 40c9 6 9 16 0 22-9-6-9-16 0-22Z" />
      <path d="M8.5 51h16" strokeWidth="0.7" />
      <circle cx="16.5" cy="69" r="1.6" fill="currentColor" stroke="none" />
      <path d="M16.5 76v14" strokeWidth="0.7" />
      <path d="M10 97 16.5 90.5 23 97 16.5 103.5Z" />
    </svg>
  );
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

