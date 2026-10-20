import { hasText } from '../../shared/has-text';
import { WaxSeal } from './envelope-parts';
import { PAPER_SHEEN, sealMarkOf } from './envelope-paper';
import { couple } from './welcome-name';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';

/**
 * `welcome.sidefold` — la invitación de dos hojas: papel crema con ramas doradas dibujadas a
 * línea, la hoja derecha encimada sobre la izquierda y el lacre cerrando la unión.
 *
 * Al tocar el lacre se parte en dos, la unión se ilumina y cada hoja gira sobre su canto hacia
 * quien mira, como las dos puertas de una invitación de díptico. Pasado el canto las hojas
 * desaparecen (`backface-visibility: hidden`), así que no hay un dorso que pintar.
 *
 * Es la hermana lateral de `gatefold`: allí el sobre se parte arriba y abajo; aquí, a los lados.
 * El movimiento vive en `globals.css` (`inv-sidefold-*`).
 */
export function WelcomeSidefold({ content }: WelcomeVariantProps) {
  const pair = couple(content.celebrantName);
  const mark = sealMarkOf(content.celebrantName, content.celebrantLastName, content.eventTypeLabel);

  return (
    <WelcomeShell
      variant="sidefold"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      leaveTimeoutMs={2400}
      contentClassName="items-center justify-center overflow-hidden px-6 text-center"
      backdrop={
        <div aria-hidden="true" className="absolute inset-0 [perspective:1800px]">
          {/* La hoja izquierda: la de abajo. */}
          <div className="inv-sidefold-left absolute inset-y-0 left-0 w-1/2 origin-left bg-inv-surface [backface-visibility:hidden]">
            <div className="absolute inset-0" style={{ background: PAPER_SHEEN }} />
            <GoldVines />
            {/* La sombra que le hace la hoja de encima. */}
            <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black/12 to-transparent" />
          </div>

          {/* La hoja derecha, encimada: tapa el canto de la otra y le proyecta sombra. */}
          <div className="inv-sidefold-right absolute inset-y-0 right-0 w-[51%] origin-right bg-inv-surface shadow-[-10px_0_22px_-10px_rgb(0_0_0/0.35)] [backface-visibility:hidden]">
            <div className="absolute inset-0" style={{ background: PAPER_SHEEN }} />
            <GoldVines mirrored />
            <div className="absolute inset-y-0 left-0 w-px bg-black/10" />
          </div>

          {/* La luz que recorre la unión en cuanto se rompe el lacre. */}
          <div className="inv-sidefold-seam absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-inv-on-primary opacity-0 [box-shadow:0_0_28px_8px_var(--inv-color-accent)]" />
        </div>
      }
    >
      <div className="inv-sidefold-caption flex flex-col items-center">
        {hasText(content.eventTypeLabel) && (
          <p className="m-0 text-[10.5px] tracking-[0.34em] text-inv-ink-soft uppercase">
            {content.eventTypeLabel}
          </p>
        )}
        <p className="mt-3 mb-0 font-inv-script text-[clamp(2.2rem,10vw,3.2rem)] leading-tight text-inv-ink">
          {pair ? `${pair[0]} & ${pair[1]}` : content.celebrantName}
        </p>
      </div>

      {/* El lacre, sobre la unión. Dos mitades que se separan, cada una con su hoja. */}
      <div className="my-8">
        <WelcomeOpenButton
          label={content.openLabel}
          className="inv-seal-pulse relative block size-[clamp(6rem,26vw,7.5rem)] rounded-full hover:scale-[1.04] active:scale-[0.97]"
        >
          <span className="inv-sidefold-seal-left absolute inset-0 [clip-path:inset(0_50%_0_0)]">
            <WaxSeal mark={mark} className="size-full" />
          </span>
          <span className="inv-sidefold-seal-right absolute inset-0 [clip-path:inset(0_0_0_50%)]">
            <WaxSeal mark={mark} className="size-full" />
          </span>
        </WelcomeOpenButton>
      </div>

      <div className="inv-sidefold-caption flex flex-col items-center gap-3">
        {hasText(content.dateLabel) && (
          <p className="m-0 font-inv-display text-[clamp(1rem,4vw,1.25rem)] tracking-[0.06em] text-inv-ink">
            {content.dateLabel}
          </p>
        )}
        <p
          /* Decorativo: el sello ya se anuncia con `openLabel`. */
          aria-hidden="true"
          className="m-0 text-[10.5px] tracking-[0.3em] text-inv-ink-soft uppercase"
        >
          Toca el sello · {content.openLabel}
        </p>
      </div>
    </WelcomeShell>
  );
}

/**
 * Las ramas doradas de una hoja: ramitas finas que nacen de las esquinas de fuera, una arriba y
 * su reflejo abajo, y dejan el centro limpio para el lacre.
 *
 * Van en dos dibujos de proporción fija —uno por esquina— y no en uno estirado a la hoja: una
 * rama estirada al alto de un teléfono se deforma, y una recortada cruza la hoja entera y tapa el
 * lacre. El ancho tiene tope para que en una pantalla grande sigan siendo ramitas.
 *
 * Las hojas se colocan sobre la propia curva del tallo, calculando su punto y su dirección: así
 * nacen del tallo y siguen su giro, que es lo que hace que se lea como una rama y no como
 * almendras sueltas alrededor de una línea.
 */
function GoldVines({ mirrored = false }: { readonly mirrored?: boolean }) {
  const corner = (bottom: boolean) => (
    <svg
      viewBox="0 0 200 220"
      className={`absolute left-0 w-[min(100%,19rem)] ${bottom ? 'bottom-0 -scale-y-100' : 'top-0'}`}
    >
      <g
        fill="none"
        stroke="var(--inv-color-accent)"
        strokeOpacity="0.6"
        strokeWidth="1.1"
        strokeLinecap="round"
      >
        {VINES.map((vine) => (
          <g key={vine.stem}>
            <path d={vine.stem} />
            {vine.leaves.map((leaf) => (
              <path key={leaf} d={leaf} />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );

  return (
    <div className={`absolute inset-0 ${mirrored ? '-scale-x-100' : ''}`}>
      {corner(false)}
      {corner(true)}
    </div>
  );
}

type Point = readonly [number, number];

/** Un tallo como curva de Bézier cúbica, con sus hojas ya calculadas. */
function vine(p0: Point, p1: Point, p2: Point, p3: Point, count: number) {
  const at = (t: number): Point => {
    const u = 1 - t;
    return [
      u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
      u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1],
    ];
  };

  const leaves = Array.from({ length: count }, (_, index) => {
    const t = 0.12 + (index / count) * 0.84;
    const [x, y] = at(t);
    const [nx, ny] = at(Math.min(1, t + 0.01));
    const heading = Math.atan2(ny - y, nx - x);
    const side = index % 2 === 0 ? 1 : -1;
    // La hoja sale a 50° del tallo y se acorta hacia la punta de la rama.
    const angle = heading + side * 0.87;
    const length = 15 - (index / count) * 6;
    const tip: Point = [x + Math.cos(angle) * length, y + Math.sin(angle) * length];
    const bulge = length * 0.38;
    const ox = Math.cos(angle + Math.PI / 2) * bulge;
    const oy = Math.sin(angle + Math.PI / 2) * bulge;
    const mx = (x + tip[0]) / 2;
    const my = (y + tip[1]) / 2;
    const f = (n: number) => n.toFixed(1);

    return `M${f(x)} ${f(y)} Q${f(mx + ox)} ${f(my + oy)} ${f(tip[0])} ${f(tip[1])} Q${f(mx - ox)} ${f(my - oy)} ${f(x)} ${f(y)}`;
  });

  const f = (p: Point) => `${p[0]} ${p[1]}`;

  return { stem: `M${f(p0)} C${f(p1)} ${f(p2)} ${f(p3)}`, leaves };
}

/* Se calculan una vez al cargar el módulo: son los mismos números para todas las invitaciones. */
const VINES = [
  vine([0, 8], [48, 12], [72, 58], [98, 118], 9),
  vine([0, 44], [22, 74], [12, 122], [44, 176], 6),
  vine([26, 4], [70, 0], [112, 14], [150, 34], 5),
];
