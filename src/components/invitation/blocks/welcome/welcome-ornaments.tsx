import clsx from 'clsx';

/**
 * Los dibujos de las puertas: filigrana, ramas y el borde rasgado.
 *
 * Son SVG en línea y no archivos, y la razón es la misma que sostiene todo el catálogo: **el
 * color lo pone el tema**. Un PNG con la filigrana en dorado se vería mal en cuanto alguien
 * eligiera el tema verde, y habría que mantener una copia por tema. Dibujados con
 * `currentColor`, el mismo trazo sale marfil sobre una foto oscura y ciruela sobre papel.
 *
 * Van sin fondo y sin tamaño propio: el que los coloca decide cuánto miden con clases. Todos
 * llevan `aria-hidden`, porque un ornamento no dice nada que no diga el texto de al lado y
 * anunciarlo interrumpe la lectura.
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
 * La rama: hojas alternadas a lo largo de un tallo curvo, para las guirnaldas de acuarela.
 *
 * Es la traducción honesta de una acuarela a un trazo: una acuarela no se imita con vectores, y
 * el intento —degradados, manchas— sale peor que asumir que aquí el lenguaje es el dibujo a
 * línea. Lo que sí se conserva es la silueta, que es lo que hace que la esquina se lea como
 * botánica en un vistazo de medio segundo.
 */
export function BotanicalSpray({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 200 90"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      aria-hidden="true"
      className={clsx('pointer-events-none', className)}
    >
      {/* El tallo, de una esquina hacia el centro. */}
      <path d="M2 12C40 20 78 38 118 52c22 8 44 12 80 13" />
      {/* Las hojas: la misma elipse repetida con otra inclinación y otro tamaño. Se escriben a
          mano y no en un bucle porque una rama regular no parece una rama. */}
      <ellipse cx="24" cy="10" rx="12" ry="5" transform="rotate(-24 24 10)" />
      <ellipse cx="44" cy="26" rx="14" ry="6" transform="rotate(18 44 26)" />
      <ellipse cx="66" cy="24" rx="10" ry="4.5" transform="rotate(-30 66 24)" />
      <ellipse cx="88" cy="42" rx="15" ry="6" transform="rotate(14 88 42)" />
      <ellipse cx="112" cy="38" rx="11" ry="5" transform="rotate(-26 112 38)" />
      <ellipse cx="138" cy="56" rx="14" ry="5.5" transform="rotate(10 138 56)" />
      <ellipse cx="164" cy="52" rx="10" ry="4.5" transform="rotate(-20 164 52)" />
      <ellipse cx="186" cy="66" rx="12" ry="5" transform="rotate(8 186 66)" />
      {/* Tres capullos: los puntos que rompen la repetición de las hojas. */}
      <circle cx="58" cy="14" r="3.5" />
      <circle cx="126" cy="28" r="3" />
      <circle cx="176" cy="40" r="3.5" />
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

/**
 * El borde rasgado que separa el papel de la fotografía.
 *
 * Se pinta como una figura del color del papel encima de la foto, no como un recorte de la foto:
 * así el «papel» conserva su color aunque el tema cambie, y la irregularidad del canto queda del
 * lado correcto. `preserveAspectRatio="none"` deja que se estire a lo ancho —una rasgadura no
 * tiene proporción que respetar— manteniendo el alto en píxeles, que es lo que hace que en un
 * móvil no se convierta en una sierra gigante.
 */
export function TornEdge({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 40"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={clsx('pointer-events-none', className)}
    >
      <path
        /* Sube y baja sin ritmo: los picos regulares se leen como un zigzag decorativo y no como
           un papel roto. Cierra por arriba para que la figura tape todo lo que queda encima. */
        d="M0 0h1200v14l-38 7-52-9-46 12-61-6-49 11-58-8-44 10-63-5-51 12-47-9-56 7-42-11-64 6-53-10-45 9-57-4-48 12-41-8-62 5-53-11-40 9V0Z"
        fill="currentColor"
      />
    </svg>
  );
}
