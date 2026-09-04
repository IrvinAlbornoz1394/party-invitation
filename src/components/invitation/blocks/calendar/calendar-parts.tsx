import clsx from 'clsx';
import type { DayMark } from '@/domain/invitation/blocks/calendar';

/**
 * Lo que comparten las variantes del calendario: la marca del día señalado.
 *
 * Salió de `CalendarMonth` en cuanto hubo una segunda variante, y no por ahorrar líneas. La marca
 * es la única pieza del bloque que **no** puede divergir: `dayMark` es contenido —el organizador
 * eligió corazón, disco o aro— y si cada variante dibujara el suyo, cambiar de calendario en el
 * panel cambiaría también la forma que el cliente ya había elegido. El resto del bloque —la
 * retícula, el encabezado, el fondo— sí es de cada variante, y por eso no está aquí.
 */

/**
 * La marca del día del evento: corazón, disco o aro.
 *
 * Las tres se dibujan del color de acento, con relleno translúcido y contorno sólido, y las tres
 * miden lo mismo dentro de una misma retícula, para que la casilla no cambie de alto según la
 * forma elegida. Van absolutas y centradas con `m-auto`, así que la cifra sigue mandando: si la
 * marca ocupara sitio, la fila del día señalado sería más alta que las otras cinco.
 *
 * El corazón es un trazo propio y no el icono del vocabulario común. Los de `block-icons.ts` son
 * dibujos de trazo pensados para un medallón junto a un texto; este va **detrás de una cifra** y
 * necesita controlar relleno y contorno por separado, que es algo que el contrato de aquellos no
 * expone a propósito.
 *
 * Va **detrás** del número y no lo sustituye: la cifra tiene que seguir leyéndose. Por eso el
 * relleno es translúcido y el trazo va en el color de acento, y no al revés —fondo pleno de
 * acento con el número encima—: no existe un token «color sobre el acento», así que en un tema
 * con acento claro el número desaparecería. Está razonado en `CalendarMonth`, donde se escribió.
 *
 * El tamaño se pide desde fuera porque las dos variantes tienen retículas de distinta densidad:
 * en la lámina de color las casillas son de 40px y en la hoja blanca respiran más.
 */
export function DayMarkShape({
  mark,
  className,
}: {
  readonly mark: DayMark;
  readonly className?: string;
}) {
  if (mark === 'heart') {
    return (
      <svg
        viewBox="0 0 32 30"
        aria-hidden="true"
        className={clsx(
          'pointer-events-none absolute inset-0 m-auto fill-inv-accent/30 stroke-inv-accent',
          className ?? 'size-9',
        )}
        strokeWidth="1.2"
      >
        <path d="M16 27.5C16 27.5 2.5 19.4 2.5 11.1 2.5 6.4 6.2 3 10.3 3c2.5 0 4.6 1.3 5.7 3.3C17.1 4.3 19.2 3 21.7 3 25.8 3 29.5 6.4 29.5 11.1c0 8.3-13.5 16.4-13.5 16.4Z" />
      </svg>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={clsx(
        'pointer-events-none absolute inset-0 m-auto rounded-full border border-inv-accent',
        /* El disco se rellena y el aro no. Un tercio de opacidad y no más: la lámina ya tiene
           bastante color y una mancha más ensucia la retícula. */
        mark === 'disc' && 'bg-inv-accent/30',
        className ?? 'size-9',
      )}
    />
  );
}
