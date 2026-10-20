import { hasText } from '../../shared/has-text';
import { WaxSeal } from './envelope-parts';
import { PAPER_SHEEN, sealMarkOf } from './envelope-paper';
import { couple } from './welcome-name';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';

/**
 * `welcome.gatefold` — la pantalla ES el sobre: una solapa arriba, el cuerpo abajo y el lacre
 * justo en la punta de la solapa, al centro.
 *
 * Al tocar el lacre, se parte en dos, una línea de luz recorre la costura y cada mitad del sobre
 * se va por su lado —la solapa hacia arriba, el cuerpo hacia abajo— llevándose su texto. Lo que
 * queda en medio, desde el primer milímetro que se abre, es la invitación de verdad: no hay
 * telón que se desvanezca, el sobre **se abre** sobre ella.
 *
 * ## Por qué la geometría va en porcentajes
 *
 * La solapa mide la mitad de la pantalla y su punta baja hasta el centro exacto; el cuerpo
 * empieza en el 36 % para tapar los lados de la V. Todo está en porcentajes del alto, y no en
 * píxeles, para que el lacre caiga en la punta en un teléfono vertical, en uno apaisado y en el
 * recuadro de vista previa del panel, que no mide lo que la pantalla.
 *
 * ## Por qué el texto va dentro del papel y no en el contenido
 *
 * Cada texto viaja con su mitad del sobre, y la forma segura de que se muevan juntos es que sean
 * el mismo elemento: dos animaciones paralelas, por bien sincronizadas que estén, se separan un
 * fotograma en un móvil cargado y el texto se ve flotar sobre el papel.
 *
 * El movimiento está en `globals.css` (`inv-gatefold-*`): son animaciones de CSS que leen el
 * `data-state` del cascarón, así que esta variante sigue siendo un Componente de Servidor.
 */
export function WelcomeGatefold({ content }: WelcomeVariantProps) {
  const pair = couple(content.celebrantName);
  const mark = sealMarkOf(content.celebrantName, content.celebrantLastName, content.eventTypeLabel);

  return (
    <WelcomeShell
      variant="gatefold"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      leaveTimeoutMs={2400}
      contentClassName="overflow-hidden"
      backdrop={
        <div className="absolute inset-0">
          {/* El cuerpo del sobre, con los dobleces de las solapas laterales y la de abajo. */}
          <div className="inv-gatefold-bottom absolute inset-x-0 top-[36%] bottom-0 bg-inv-surface">
            <div aria-hidden="true" className="absolute inset-0 bg-inv-ink/[0.045]" />
            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 size-full text-inv-ink"
            >
              <path
                d="M0 100 L50 44 L100 100 M0 0 L50 44 M100 0 L50 44"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeWidth="1.2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* La fecha y qué hacer, debajo del lacre. */}
            <div className="absolute inset-x-0 bottom-0 flex h-[60%] flex-col items-center justify-center gap-4 px-6 pt-8 text-center">
              {hasText(content.dateLabel) && (
                <p className="m-0 font-inv-display text-[clamp(1.05rem,4.2vw,1.35rem)] tracking-[0.06em] text-inv-ink">
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
          </div>

          {/* La línea de luz que recorre la costura en cuanto se rompe el lacre. */}
          <div
            aria-hidden="true"
            className="inv-gatefold-seam absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-inv-on-primary opacity-0 [box-shadow:0_0_28px_8px_var(--inv-color-accent)]"
          />

          {/*
            La solapa. El `drop-shadow` va en el envoltorio y el recorte en el hijo: un
            `clip-path` recorta también la sombra de su propio elemento, y entonces la solapa no
            proyectaría nada sobre el cuerpo y se vería pegada a él.
          */}
          <div className="inv-gatefold-top absolute inset-x-0 top-0 h-1/2 [filter:drop-shadow(0_14px_22px_rgb(0_0_0/0.22))]">
            <div className="absolute inset-0 bg-inv-surface [clip-path:polygon(0_0,100%_0,100%_72%,50%_100%,0_72%)]">
              <div aria-hidden="true" className="absolute inset-0" style={{ background: PAPER_SHEEN }} />
              <svg
                aria-hidden="true"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 size-full text-inv-accent"
              >
                {/* El filete grabado que acompaña al borde de la solapa. */}
                <polyline
                  points="0,64 50,90 100,64"
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity="0.45"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {/* Los nombres, en la parte recta de la solapa. */}
              <div className="absolute inset-x-0 top-0 flex h-[72%] flex-col items-center justify-center px-6 pt-4 text-center text-inv-ink">
                {hasText(content.eventTypeLabel) && (
                  <p className="m-0 text-[10.5px] tracking-[0.34em] text-inv-ink-soft uppercase">
                    {content.eventTypeLabel}
                  </p>
                )}
                <h2 className="mt-4 mb-0 font-inv-display text-[clamp(2.1rem,9vw,3.6rem)] leading-[1.05] font-light">
                  {pair ? (
                    <>
                      {pair[0]}
                      <span className="mx-3 font-inv-script text-[0.8em] text-inv-accent">&amp;</span>
                      {pair[1]}
                    </>
                  ) : (
                    content.celebrantName
                  )}
                </h2>
                {!pair && hasText(content.celebrantLastName) && (
                  <p className="mt-3 mb-0 text-[11.5px] tracking-[0.36em] text-inv-ink-soft uppercase">
                    {content.celebrantLastName}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      }
    >
      {/* El lacre, en la punta de la solapa. Son dos mitades del mismo sello: al abrir se
          separan, que es lo que hace que se lea como un sello que se rompe. */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <WelcomeOpenButton
          label={content.openLabel}
          className="inv-seal-pulse relative block size-[clamp(5.5rem,22vw,7rem)] rounded-full hover:scale-[1.04] active:scale-[0.97]"
        >
          <span className="inv-gatefold-seal-top absolute inset-0 [clip-path:inset(0_0_50%_0)]">
            <WaxSeal mark={mark} className="size-full" />
          </span>
          <span className="inv-gatefold-seal-bottom absolute inset-0 [clip-path:inset(50%_0_0_0)]">
            <WaxSeal mark={mark} className="size-full" />
          </span>
        </WelcomeOpenButton>
      </div>
    </WelcomeShell>
  );
}
