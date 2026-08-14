'use client';

import clsx from 'clsx';
import type { Tone } from './tone';
import { useCountdown } from './useCountdown';

/**
 * La cuenta regresiva del evento, en cuatro casillas.
 *
 * Es de la biblioteca compartida y no de la portada: la usan hoy las tres variantes de portada
 * y mañana el bloque de cierre. Cada variante decide dónde ponerla y sobre qué se apoya
 * ({@link Tone}); todo lo demás —el formato, el latido, el respaldo mientras no hay reloj— es
 * igual en todas, y duplicarlo por variante sería tener que arreglar el mismo error tres veces.
 *
 * ## El hueco antes del primer tic
 *
 * Hasta que el componente está montado no hay hora fiable (ver `useCountdown`), así que se
 * pintan guiones en el sitio exacto que ocuparán los dígitos. Es a propósito que no sea un
 * espacio vacío ni ceros: el vacío hace saltar el diseño cuando llegan los números, y los
 * ceros dicen algo falso —«ya empezó»— durante el primer cuadro.
 */
export function Countdown({
  startsAt,
  tone = 'onImage',
  className,
}: {
  /** El instante del evento, en ISO 8601. */
  readonly startsAt: string;
  readonly tone?: Tone;
  readonly className?: string;
}) {
  const parts = useCountdown(startsAt);
  /*
   * El respaldo se tipa junto al resultado real —y no como un array aparte— para que las dos
   * formas sean la misma: `value: number | null` obliga a que quien pinta cubra el hueco.
   */
  const cells: readonly CountdownCell[] = parts ?? PLACEHOLDER;

  const cell =
    tone === 'onImage'
      ? 'border-current/25 bg-current/10 text-inv-on-primary backdrop-blur-[2px]'
      : 'border-inv-line bg-inv-surface text-inv-ink';

  return (
    <div
      /*
       * Retícula de cuatro columnas, no una fila que se parte.
       *
       * Con `flex-wrap` y un ancho mínimo por casilla, en una pantalla de 320px la cuarta caía a
       * una segunda línea: una cuenta regresiva partida en dos filas se lee como un error de
       * maqueta. En cuatro columnas siempre caben las cuatro, repartiéndose el ancho, y el tope
       * evita que en escritorio se estiren hasta parecer botones.
       */
      className={clsx('grid w-full max-w-sm grid-cols-4 gap-2 sm:max-w-md sm:gap-3', className)}
      role="group"
      aria-label="Cuenta regresiva para el evento"
    >
      {cells.map((part) => (
        <div
          key={part.unit}
          className={clsx(
            'flex min-w-0 flex-col items-center gap-0.5 rounded-inv-md border px-1.5 py-2',
            'sm:px-4',
            cell,
          )}
        >
          {/*
            `tabular-nums` no es un detalle tipográfico: sin cifras de ancho fijo, cada cambio
            de segundo mueve unos píxeles el resto de la fila y la portada tiembla entera.
          */}
          <b className="font-inv-display text-2xl leading-none font-medium tabular-nums sm:text-3xl">
            {part.value === null ? '––' : String(part.value).padStart(2, '0')}
          </b>
          {/* Sin `tracking` en móvil: con el espaciado de letras, «Segundos» no cabe en una
              casilla de sesenta píxeles y se parte por la mitad. */}
          <span className="text-[9.5px] uppercase opacity-70 sm:text-[11px] sm:tracking-[0.18em]">
            {part.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Las cuatro casillas antes de tener hora, con sus etiquetas en plural.
 *
 * En plural porque es la forma más ancha: si el hueco se dimensionara con «Día» y llegara
 * «Días», la fila crecería justo al aparecer los números.
 */
const PLACEHOLDER: readonly CountdownCell[] = [
  { unit: 'days', value: null, label: 'Días' },
  { unit: 'hours', value: null, label: 'Horas' },
  { unit: 'minutes', value: null, label: 'Minutos' },
  { unit: 'seconds', value: null, label: 'Segundos' },
];

/** Una casilla: la del dominio cuando hay hora, y la de respaldo mientras no la hay. */
interface CountdownCell {
  readonly unit: string;
  readonly value: number | null;
  readonly label: string;
}
