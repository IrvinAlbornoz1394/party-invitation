import clsx from 'clsx';

/**
 * El hilo rojo de `scrapbook`: un trazo ondulado que cruza la sección de un canto a otro, como el
 * cordón que se pega a mano entre las fotos de un álbum.
 *
 * Es el gesto que define la plantilla, y por eso es una pieza compartida y no un dibujo de cada
 * variante: el hilo tiene que ser **el mismo** en la portada, el itinerario y la galería para
 * leerse como uno solo que recorre la invitación.
 *
 * Se estira a la caja que le den (`preserveAspectRatio="none"`) y el trazo no engorda al
 * estirarse (`vector-effect: non-scaling-stroke`): un cordón no se vuelve más grueso porque la
 * sección sea más alta. Toma el color de `currentColor`, así que quien lo usa decide —casi
 * siempre `text-inv-primary`—. Es decorativo: `aria-hidden`, sin eventos de puntero.
 *
 * Tres recorridos y no uno, porque el mismo bucle repetido en cada sección se nota a la segunda;
 * `flip` los refleja para que el hilo pueda entrar por el canto contrario.
 */
const THREAD_PATHS = {
  /** Entra por arriba a la izquierda, da un bucle y sale por abajo a la derecha. Vertical. */
  loop: 'M8 0C30 60 4 120 40 170s90-10 70 50-90 70-50 130 70 40 50 100-30 80 10 150',
  /** Ondula de lado a lado sin bucles, para acompañar una lista larga. Vertical. */
  wave: 'M60 0C110 70 10 130 60 200s-50 140 0 200 100 130 40 200-60 130 0 200',
  /** Cruza la sección de lado a lado, con una caída en medio. Horizontal. */
  swag: 'M0 30C90 10 150 90 260 60s140-60 220-10 120 40 200 10',
} as const;

const VIEWBOXES: Record<keyof typeof THREAD_PATHS, string> = {
  loop: '0 0 120 600',
  wave: '0 0 120 800',
  swag: '0 0 680 100',
};

export function RedThread({
  shape = 'loop',
  flip = false,
  className,
}: {
  readonly shape?: keyof typeof THREAD_PATHS;
  /** Refleja el recorrido en horizontal. */
  readonly flip?: boolean;
  readonly className?: string;
}) {
  return (
    <svg
      viewBox={VIEWBOXES[shape]}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={clsx('pointer-events-none overflow-visible', flip && '-scale-x-100', className)}
    >
      <path
        d={THREAD_PATHS[shape]}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
