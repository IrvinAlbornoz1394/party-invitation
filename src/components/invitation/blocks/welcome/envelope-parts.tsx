import clsx from 'clsx';
import type { ReactNode } from 'react';
import type { SealMark } from './envelope-paper';

/**
 * Las piezas de papelería que comparten las bienvenidas en sobre: `gatefold`, `letter`, `dear` y
 * `sidefold`.
 *
 * Son Componentes de Servidor sin estado. El gesto lo pone `WelcomeOpenButton` y el movimiento
 * entero lo pone el CSS de `globals.css`, leyendo el `data-state` del cascarón: así la animación
 * no depende de que un componente re-renderice a tiempo, y el primer fotograma de la apertura ya
 * sale en el mismo commit que el clic.
 */

/**
 * El borde de un lacre: un círculo con la orilla ondulada, como la cera al aplastarse.
 *
 * Se calcula una vez al cargar el módulo —son números fijos— y se pinta como polígono de 120
 * vértices, que a este tamaño se lee curvo. Un círculo perfecto se ve de plástico; la onda
 * irregular, sumando dos frecuencias que no coinciden, es lo que lo convierte en cera.
 */
const WAX_EDGE = Array.from({ length: 120 }, (_, index) => {
  const angle = (index / 120) * Math.PI * 2;
  const radius = 56 + 2 * Math.sin(angle * 7) + 1.3 * Math.sin(angle * 13 + 1.3);

  return `${(60 + radius * Math.cos(angle)).toFixed(2)},${(60 + radius * Math.sin(angle)).toFixed(2)}`;
}).join(' ');

const ENGRAVE = 'var(--inv-color-on-primary)';

/**
 * El sello de lacre, dibujado para ocupar todo su contenedor.
 *
 * Es el de la papelería de verdad: la cera con su orilla irregular, el **cordón trenzado** que
 * deja el sello de metal alrededor, el disco hundido del centro y, dentro, el grabado —las
 * iniciales de los novios, o el «15» de unos XV con su corona, «Años» a mano y las filigranas a
 * los lados—.
 *
 * Toma el color de `text-inv-accent` —el del tema— y no de una imagen: un lacre rojo en un tema
 * verde salvia sería una pegatina, y uno del acento es parte de la papelería. El relieve sale de
 * pintar cada trazo dos veces —una sombra un poco abajo y la luz encima—, sin filtros de SVG, que
 * necesitarían un `id` único por sello.
 */
export function WaxSeal({
  mark,
  className,
}: {
  readonly mark: SealMark;
  readonly className?: string;
}) {
  return (
    <span aria-hidden="true" className={clsx('relative block text-inv-accent', className)}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 size-full overflow-visible">
        <polygon points={WAX_EDGE} fill="currentColor" />
        {/* El disco que deja el metal al hundirse: un poco más oscuro que la orilla. */}
        <circle cx="60" cy="60" r="45" fill="black" fillOpacity="0.1" />

        {/* El cordón: dos trazos discontinuos desfasados se leen como una cuerda torcida. */}
        <Embossed
          draw={(color) => (
            <>
              <circle
                cx="60"
                cy="60"
                r="43"
                fill="none"
                stroke={color}
                strokeWidth="3.4"
                strokeDasharray="2.6 1.9"
              />
            </>
          )}
        />
        <circle
          cx="60"
          cy="60"
          r="43"
          fill="none"
          stroke="black"
          strokeOpacity="0.18"
          strokeWidth="1.2"
          strokeDasharray="2.6 1.9"
          strokeDashoffset="2.2"
        />
        <Embossed
          draw={(color) => (
            <>
              <circle cx="60" cy="60" r="38.6" fill="none" stroke={color} strokeWidth="0.7" />
            </>
          )}
        />

        {mark.kind === 'quince' ? <QuinceMark mark={mark} /> : <InitialsMark text={mark.text} />}
      </svg>

      {/* El brillo de la cera: un reflejo arriba a la izquierda y una sombra abajo. Sin él, el
          sello es un círculo plano de color. */}
      <span
        className="pointer-events-none absolute inset-[3%] rounded-full"
        style={{
          background:
            'radial-gradient(circle at 30% 26%, rgb(255 255 255 / 0.36), transparent 40%), radial-gradient(circle at 72% 80%, rgb(0 0 0 / 0.24), transparent 55%)',
        }}
      />
    </span>
  );
}

/**
 * Pinta un trazo en relieve: la sombra medio punto abajo y el trazo claro encima. Recibe una
 * función y no hijos porque el mismo dibujo se pinta dos veces en dos colores.
 */
function Embossed({ draw }: { readonly draw: (color: string) => ReactNode }) {
  return (
    <>
      <g transform="translate(0 0.7)" opacity="0.3">
        {draw('black')}
      </g>
      <g opacity="0.9">{draw(ENGRAVE)}</g>
    </>
  );
}

/** Una voluta: la filigrana que flanquea el grabado. Se dibuja a la izquierda y se refleja. */
const SCROLL =
  'M0 0 C -3 -4 -9 -4 -11 0 C -13 4 -9 7 -6 5 C -4 3.6 -5 1 -7 1.2 M-11 0 C -14 -1 -16 1 -17 3';

function Scrolls({ y, spread }: { readonly y: number; readonly spread: number }) {
  return (
    <Embossed
      draw={(color) => (
        <>
          <g fill="none" stroke={color} strokeWidth="1" strokeLinecap="round">
            <path d={SCROLL} transform={`translate(${60 - spread} ${y})`} />
            <path d={SCROLL} transform={`translate(${60 + spread} ${y}) scale(-1 1)`} />
          </g>
        </>
      )}
    />
  );
}

/** Las iniciales de los novios, con volutas a los lados y un corazón pequeño arriba. */
function InitialsMark({ text }: { readonly text: string }) {
  const long = text.length > 3;

  return (
    <>
      <Embossed
        draw={(color) => (
          <>
            <path
              transform="translate(60 32) scale(1.3) translate(-60 -32)"
              d="M60 30.5 C 58.6 28.6 55.6 29.2 56 31.6 C 56.4 33.6 60 35.6 60 35.6 C 60 35.6 63.6 33.6 64 31.6 C 64.4 29.2 61.4 28.6 60 30.5 Z"
              fill={color}
            />
          </>
        )}
      />
      <Embossed
        draw={(color) => (
          <>
            <text
              x="60"
              y="72"
              textAnchor="middle"
              fill={color}
              fontSize={long ? 24 : 31}
              style={{
                fontFamily: 'var(--inv-font-display)',
                letterSpacing: '0.04em',
              }}
            >
              {text}
            </text>
          </>
        )}
      />
      <Scrolls y={89} spread={12} />
    </>
  );
}

/** El lacre de XV: corona, el número grande, «Años» a mano y volutas a los lados del número. */
function QuinceMark({ mark }: { readonly mark: Extract<SealMark, { kind: 'quince' }> }) {
  return (
    <>
      {/* La corona: cinco puntas con su perla y la banda. */}
      <Embossed
        draw={(color) => (
          <>
            <g fill={color} transform="translate(60 29) scale(1.35) translate(-60 -30)">
              <path d="M50.5 34 L49 25.5 L54 29.5 L57 23.5 L60 28.5 L63 23.5 L66 29.5 L71 25.5 L69.5 34 Z" />
              <rect x="50.3" y="34.8" width="19.4" height="1.6" rx="0.6" />
              <circle cx="49" cy="24.6" r="1" />
              <circle cx="57" cy="22.6" r="1" />
              <circle cx="63" cy="22.6" r="1" />
              <circle cx="71" cy="24.6" r="1" />
            </g>
          </>
        )}
      />
      <Embossed
        draw={(color) => (
          <>
            <text
              x="60"
              y="71"
              textAnchor="middle"
              fill={color}
              fontSize="36"
              style={{ fontFamily: 'var(--inv-font-display)', fontWeight: 500 }}
            >
              {mark.number}
            </text>
          </>
        )}
      />
      <Scrolls y={60} spread={23} />
      <Embossed
        draw={(color) => (
          <>
            <text
              x="60"
              y="90"
              textAnchor="middle"
              fill={color}
              fontSize="15"
              style={{ fontFamily: 'var(--inv-font-script)' }}
            >
              {mark.label}
            </text>
          </>
        )}
      />
    </>
  );
}
