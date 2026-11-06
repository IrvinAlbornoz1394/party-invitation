import type { CSSProperties, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

/**
 * Los dibujos de `terracota`: manchas de barro, la flecha con corazón que va bajo cada título, los
 * dos corazones garabateados, el laurel, la pluma, el confeti de puntos, los globos de corazón con
 * la inicial y el ramo atado con lazo.
 *
 * ## Por qué van en línea y no en la biblioteca de recursos
 *
 * Casi todos son **a dos tintas**: contorno en la tinta del tema y relleno en terracota o durazno.
 * Un recurso `mono` de la biblioteca se pinta con una máscara y un solo color, y uno `multi` lleva
 * los colores escritos en el archivo, que es justo lo que un tema no puede cambiar. Dibujados aquí,
 * cada trazo toma su color de un token (`currentColor` y las variables `--inv-color-*`) y la
 * plantilla sirve con cualquier tema.
 *
 * Son trazos originales, hechos para esta plantilla: ninguno sale de la referencia.
 *
 * El marco de fotos con los lados abombados es una máscara de CSS (`.inv-squircle` en
 * `globals.css`), no un componente: así lo usan igual una foto, una tarjeta o un botón.
 */

/** El durazno apagado de las manchas y del confeti: el acento rebajado con el papel. */
export const CLAY_TAN = 'text-[color-mix(in_srgb,var(--inv-color-accent)_58%,var(--inv-color-background))]';

/* ── Manchas ──────────────────────────────────────────────────────────── */

const BLOB_PATHS = {
  /* Una piedra de río, más ancha que alta. */
  pebble:
    'M38 22C70-4 132 4 162 30s42 78 18 116-84 60-124 38S-6 112 6 72c6-22 14-36 32-50Z',
  /* Un rectángulo blando, como las placas que asoman por los costados. */
  slab: 'M20 10c40-10 120-8 150 4 26 10 28 46 26 96s-4 78-36 84c-40 6-110 4-138-8-20-10-18-46-18-86 0-50-2-82 16-90Z',
  /* Una ola que baja por una esquina. */
  wave: 'M0 0h200v128c-30-12-48 22-82 28-40 8-56-36-88-46C15 105 6 102 0 98Z',
  /* Una gota tumbada. */
  drop: 'M100 6c52 0 94 34 94 86 0 60-50 102-104 102C40 194 6 158 6 112 6 52 44 6 100 6Z',
} as const;

export type BlobShape = keyof typeof BLOB_PATHS;

/**
 * Una mancha de color, posicionada en absoluto. El color sale de la clase (`text-inv-primary`,
 * `text-inv-accent` o `CLAY_TAN`), y con `outline` lleva encima un hilo suelto que la cruza,
 * como en las esquinas de la referencia.
 */
export function Blob({
  shape = 'pebble',
  outline = false,
  rotate = 0,
  motion = 'none',
  className,
  style,
}: {
  readonly shape?: BlobShape;
  readonly outline?: boolean;
  readonly rotate?: number;
  /** `drift`: sube y baja despacio, como las manchas de las esquinas al hacer scroll. */
  readonly motion?: 'drift' | 'none';
  readonly className?: string;
  readonly style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={twMerge('pointer-events-none absolute block', motion === 'drift' && 'inv-sway', className)}
      style={style}
    >
      <svg
        viewBox="0 0 200 200"
        preserveAspectRatio="none"
        className="block h-full w-full overflow-visible"
        style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined }}
      >
        <path d={BLOB_PATHS[shape]} fill="currentColor" />
        {outline && (
          <path
            d="M-6 60c40-30 70 40 104 22s40-60 76-50 30 70 40 96"
            fill="none"
            stroke="var(--inv-color-primary)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
      </svg>
    </span>
  );
}

/** El hilo suelto, solo, para cruzar el canto de una sección. */
export function Squiggle({ className }: { readonly className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 240 60"
      fill="none"
      className={twMerge('pointer-events-none absolute block text-inv-primary', className)}
    >
      <path
        d="M2 40C40 8 70 62 110 36s58-34 92-10 30 20 36 14"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** El confeti de puntos alargados que salpica la esquina de cada foto. */
export function Confetti({ className, style }: { readonly className?: string; readonly style?: CSSProperties }) {
  const dots = [
    [26, 18, 9, 13, -20],
    [62, 12, 7, 6, 0],
    [92, 20, 12, 8, 10],
    [128, 30, 6, 5, 0],
    [12, 56, 8, 12, -30],
    [42, 52, 6, 6, 0],
    [74, 48, 12, 8, -10],
    [106, 54, 7, 10, 30],
    [30, 84, 9, 9, 0],
    [66, 80, 8, 5, 0],
    [56, 108, 10, 7, 40],
    [88, 80, 6, 9, -20],
  ] as const;

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 140 120"
      className={twMerge('pointer-events-none absolute block', CLAY_TAN, className)}
      style={style}
    >
      {dots.map(([cx, cy, rx, ry, rot], index) => (
        <ellipse
          key={index}
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill="currentColor"
          transform={`rotate(${rot} ${cx} ${cy})`}
        />
      ))}
    </svg>
  );
}

/* ── Remates de título ────────────────────────────────────────────────── */

/** La flecha de Cupido tumbada que va debajo de cada título: punta a la izquierda, plumas a la derecha. */
export function CupidArrow({ className }: { readonly className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 160 36"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={twMerge('mx-auto block w-36 text-inv-primary', className)}
    >
      <path d="M26 21c32 3 64 3 98-3" />
      <path d="M30 9 5 12l19 15 6-18Z" />
      <path d="M124 18c6-12 26-15 28-6 2 8-12 9-28 6Z" />
      <path d="M124 18c10 6 22 16 14 20-8 3-12-8-14-20Z" />
      <path d="M131 17c6-1 10 0 14 2" strokeWidth="1.8" />
    </svg>
  );
}

const HEART = 'M12 21C5 15 1 11 1 6.5 1 3.4 3.4 1 6.4 1c2.2 0 4.2 1.3 5.6 3.3C13.4 2.3 15.4 1 17.6 1 20.6 1 23 3.4 23 6.5 23 11 19 15 12 21Z';

/** Los dos corazones garabateados: uno de contorno y otro pequeño relleno, ladeados. */
export function DoodleHearts({ className }: { readonly className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 54 46" fill="none" className={twMerge('mx-auto block w-12', className)}>
      <path
        d={HEART}
        transform="translate(6 14) rotate(-14 12 11) scale(1.05)"
        stroke="var(--inv-color-ink)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d={HEART}
        transform="translate(30 2) rotate(24 12 11) scale(0.72)"
        fill="var(--inv-color-accent)"
        stroke="var(--inv-color-ink)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** El ramito de laurel horizontal que cierra cada tarjeta. */
export function LaurelSprig({ className }: { readonly className?: string }) {
  const leaves = Array.from({ length: 6 }, (_, index) => 18 + index * 22);

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 160 30"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      className={twMerge('mx-auto block w-36 text-inv-accent', className)}
    >
      <path d="M4 17c50-4 100-4 152-1" />
      {leaves.map((x) => (
        <g key={x}>
          <path d={`M${x} 16c4-8 10-11 16-11-2 6-8 10-16 11Z`} />
          <path d={`M${x + 8} 16c4 6 10 9 15 9-2-5-8-8-15-9Z`} />
        </g>
      ))}
    </svg>
  );
}

/** Una pluma de hoja, en el durazno apagado, para asomar detrás de una tarjeta. */
export function Feather({ className, rotate = -30 }: { readonly className?: string; readonly rotate?: number }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 60 120"
      className={twMerge('pointer-events-none absolute block', CLAY_TAN, className)}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path d="M30 4C52 26 56 70 34 112 10 84 6 40 30 4Z" fill="currentColor" opacity="0.55" />
      <path
        d="M31 14v94M31 36l-12 10M31 36l12 8M31 56l-14 10M31 56l14 8M31 76l-13 10M31 76l12 8"
        stroke="var(--inv-color-background)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* ── Globos y ramo ────────────────────────────────────────────────────── */

/**
 * El globo en forma de corazón, atado con un lazo, con una inicial dentro. En la referencia dicen
 * «Mrs.» y «Mr.»; aquí la inicial de cada uno, que sirve igual a cualquier pareja. Late despacio
 * (`inv-heartbeat`), como el de la referencia.
 */
export function HeartBalloon({
  letter,
  tone = 'primary',
  className,
  style,
}: {
  readonly letter: string;
  readonly tone?: 'primary' | 'accent';
  readonly className?: string;
  readonly style?: CSSProperties;
}) {
  return (
    <span aria-hidden="true" className={twMerge('pointer-events-none absolute block w-16', className)} style={style}>
      <svg viewBox="0 0 80 176" fill="none" className="block w-full overflow-visible">
        <g className="inv-heartbeat" style={{ transformOrigin: '40px 36px', transformBox: 'view-box' }}>
          <path
            d={HEART}
            transform="translate(2 2) scale(3.15)"
            fill={tone === 'primary' ? 'var(--inv-color-primary)' : 'var(--inv-color-accent)'}
            stroke="var(--inv-color-ink)"
            strokeWidth="0.75"
            strokeLinejoin="round"
          />
          <text
            x="40"
            y="40"
            textAnchor="middle"
            fontSize="26"
            fill="var(--inv-color-ink)"
            style={{ fontFamily: 'var(--inv-font-script)' }}
          >
            {letter}
          </text>
        </g>
        <g stroke="var(--inv-color-ink)" strokeWidth="1.8" strokeLinecap="round">
          <path d="M40 68c-3 30 4 60-4 106" />
          <path d="M39 104c-10-12-22-14-20-4 2 8 14 6 20 4Zm0 0c8-14 20-16 20-6-1 8-12 8-20 6Zm0 0c-6 8-10 14-6 20M39 104c4 8 10 12 12 18" />
        </g>
      </svg>
    </span>
  );
}

/** El ramo de tres flores atado con una cinta: la marca de la invitación en la puerta y en el pie. */
export function DoodleBouquet({ className }: { readonly className?: string }) {
  const flower = (cx: number, cy: number, r: number) => {
    const petals = Array.from({ length: 6 }, (_, index) => {
      const angle = (index / 6) * Math.PI * 2;

      return [cx + Math.cos(angle) * r * 0.62, cy + Math.sin(angle) * r * 0.62] as const;
    });

    return (
      <g>
        {petals.map(([x, y], index) => (
          <circle key={index} cx={x} cy={y} r={r * 0.5} />
        ))}
        <circle cx={cx} cy={cy} r={r * 0.62} stroke="none" />
        <path
          d={`M${cx - r * 0.3} ${cy}c0-${r * 0.3} ${r * 0.5}-${r * 0.3} ${r * 0.5} 0s-${r * 0.35} ${r * 0.35}-${r * 0.5} 0`}
          fill="none"
        />
      </g>
    );
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 180 130" className={twMerge('block w-40', className)}>
      <g stroke="var(--inv-color-ink)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
        <path
          d="M84 76c-8 14-30 22-54 30 14 6 24 6 34 0l2 14c14-10 22-24 26-40ZM96 74c18 4 30 22 42 46 6-14 4-24-4-32l14-2c-10-12-30-18-50-14Z"
          fill="var(--inv-color-accent)"
        />
        <g fill={'color-mix(in srgb, var(--inv-color-accent) 58%, var(--inv-color-background))'}>
          {flower(68, 40, 24)}
          {flower(108, 32, 22)}
          {flower(92, 66, 22)}
        </g>
        <path d="M86 84c-4 12 0 24 6 30M96 84c4 10 2 22-2 28" fill="none" />
        <path d="M48 12c-2-6 6-8 6-2 0-6 8-4 6 2-1 4-6 6-6 6s-5-2-6-6ZM146 18c-2-6 6-8 6-2 0-6 8-4 6 2-1 4-6 6-6 6s-5-2-6-6Z" fill="var(--inv-color-background)" strokeWidth="1.6" />
      </g>
    </svg>
  );
}

/* ── Encabezado ───────────────────────────────────────────────────────── */

/**
 * El encabezado de cada sección: el título a pincel, la frase debajo y la flecha. El pre-título,
 * si lo hay, va encima en versalitas terracota —la referencia no lo usa, pero el catálogo sí, y
 * tiene que tener sitio—.
 */
export function TerracottaHeading({
  eyebrow,
  title,
  subtitle,
  inverse = false,
  arrow = true,
  className,
  children,
}: {
  readonly eyebrow?: string | null;
  readonly title: string | null;
  readonly subtitle?: string | null;
  readonly inverse?: boolean;
  readonly arrow?: boolean;
  readonly className?: string;
  readonly children?: ReactNode;
}) {
  return (
    <header className={twMerge('mx-auto max-w-xl text-center', className)}>
      {eyebrow && (
        <p
          className={twMerge(
            'm-0 text-[12.5px] font-semibold tracking-[0.2em] uppercase',
            inverse ? 'text-inv-bg/85' : 'text-inv-primary',
          )}
        >
          {eyebrow}
        </p>
      )}
      {title && (
        <h2
          className={twMerge(
            'mt-2 mb-0 font-inv-display text-[clamp(2rem,9vw,2.9rem)] leading-[1.15] font-normal',
            inverse ? 'text-inv-bg' : 'text-inv-ink',
          )}
        >
          {title}
        </h2>
      )}
      {subtitle && (
        <p
          className={twMerge(
            'mx-auto mt-3 mb-0 max-w-md text-[16px] leading-relaxed',
            inverse ? 'text-inv-bg/85' : 'text-inv-ink-soft',
          )}
        >
          {subtitle}
        </p>
      )}
      {children}
      {arrow && <CupidArrow className={twMerge('mt-5', inverse && 'text-inv-bg')} />}
    </header>
  );
}

/** El botón de la referencia: rótulo a pincel, sin versalitas, canto blando. */
export const BRUSH_BUTTON = 'font-inv-display! text-[18px]! tracking-normal! normal-case! px-8! py-2.5!';
