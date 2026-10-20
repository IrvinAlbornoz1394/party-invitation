import { BlockImage } from '../../shared/BlockImage';
import { hasText } from '../../shared/has-text';
import { WaxSeal } from './envelope-parts';
import { PAPER_SHEEN, sealMarkOf, sealMonogram } from './envelope-paper';
import { couple } from './welcome-name';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';

/**
 * `welcome.letter` — un sobre entero al centro de la pantalla, con los nombres y la fecha
 * escritos en el frente como un destinatario y el lacre cerrando la solapa.
 *
 * Al tocar el lacre se rompe, la solapa gira hacia atrás sobre su bisagra, la tarjeta sube del
 * sobre y la cámara **entra en ella**: el sobre crece hasta que la tarjeta llena la pantalla y,
 * en ese blanco de papel, aparece la invitación. Es la diferencia con `welcome.envelope`, que
 * enseña una tarjeta y un sello: aquí el sobre es un objeto con dentro, y abrirlo es meterse.
 *
 * ## Las capas, de atrás hacia adelante
 *
 * El fondo del sobre, la tarjeta, el bolsillo delantero —recortado en V por arriba, que es lo
 * que deja ver la tarjeta al subir— y la solapa. La solapa pasa **detrás** de la tarjeta a mitad
 * del giro: es un cambio de `z-index` dentro de la propia animación, y sin él la tarjeta subiría
 * por detrás de una solapa abierta, que en papel es imposible.
 *
 * Como `gatefold`, el movimiento vive en `globals.css` (`inv-letter-*`) y esta variante no tiene
 * estado propio.
 */
export function WelcomeLetter({ content }: WelcomeVariantProps) {
  const pair = couple(content.celebrantName);
  const monogram = sealMonogram(content.celebrantName, content.celebrantLastName);
  const mark = sealMarkOf(content.celebrantName, content.celebrantLastName, content.eventTypeLabel);

  return (
    <WelcomeShell
      variant="letter"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      leaveTimeoutMs={2600}
      className="text-inv-on-primary"
      contentClassName="items-center justify-center gap-8 overflow-hidden px-6 py-10 text-center"
      backdrop={
        <div aria-hidden="true" className="inv-letter-backdrop absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-inv-primary" />
          {content.image && <BlockImage image={content.image} priority className="opacity-20" />}
          {/* Un viñeteado: el sobre queda en la luz y los bordes en penumbra. */}
          <div className="absolute inset-0 [background:radial-gradient(70%_60%_at_50%_50%,transparent,rgb(0_0_0/0.35))]" />
        </div>
      }
    >
      {hasText(content.eventTypeLabel) && (
        <p className="inv-letter-caption m-0 text-[11px] tracking-[0.36em] uppercase opacity-85">
          {content.eventTypeLabel}
        </p>
      )}

      {/* El sobre. La perspectiva va aquí para que el giro de la solapa tenga profundidad. */}
      <div className="inv-letter-envelope relative aspect-[10/7] w-[min(86vw,27rem)] [perspective:1400px]">
        {/* El fondo del sobre: el interior, más oscuro, que se ve al levantar la solapa. */}
        <div className="inv-letter-front absolute inset-0 rounded-[6px] bg-inv-surface shadow-[0_30px_60px_-20px_rgb(0_0_0/0.55)]">
          <div className="absolute inset-0 rounded-[6px] bg-inv-ink/15" />
        </div>

        {/* La tarjeta. Sube al abrir y es en ella donde entra la cámara. */}
        <div className="inv-letter-card absolute inset-x-[7%] top-[6%] bottom-[8%] z-[2] flex flex-col items-center justify-center rounded-[4px] bg-inv-bg px-4 text-inv-ink shadow-[0_2px_10px_rgb(0_0_0/0.12)]">
          {/* El monograma y nada más: es lo que llena la pantalla cuando la cámara entra, y un
              texto ahí se leería a medias y en grande justo antes de desaparecer. */}
          <span className="font-inv-display text-[clamp(1.6rem,7vw,2.4rem)] leading-none tracking-[0.12em] text-inv-accent">
            {monogram.replace('&', ' & ')}
          </span>
          <span className="mt-3 block h-px w-12 bg-inv-line" />
        </div>

        {/* El bolsillo delantero, recortado en V por arriba. */}
        <div className="inv-letter-front absolute inset-0 z-[3] [filter:drop-shadow(0_-2px_6px_rgb(0_0_0/0.12))]">
          <div className="absolute inset-0 rounded-b-[6px] bg-inv-surface [clip-path:polygon(0_0,50%_54%,100%_0,100%_100%,0_100%)]">
            <div className="absolute inset-0" style={{ background: PAPER_SHEEN }} />
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 size-full text-inv-ink"
            >
              {/* Los dobleces de la solapa de abajo. */}
              <path
                d="M0 100 L50 58 L100 100"
                fill="none"
                stroke="currentColor"
                strokeOpacity="0.1"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          {/* Los nombres y la fecha, escritos en el frente como un destinatario. */}
          <div className="absolute inset-x-0 bottom-[9%] flex flex-col items-center px-6 text-inv-ink">
            <p className="m-0 font-inv-display text-[clamp(1.25rem,5.4vw,1.8rem)] leading-tight">
              {pair ? (
                <>
                  {pair[0]}
                  <span className="mx-2 font-inv-script text-inv-accent">&amp;</span>
                  {pair[1]}
                </>
              ) : (
                content.celebrantName
              )}
            </p>
            {hasText(content.dateLabel) && (
              <p className="mt-1.5 mb-0 text-[clamp(9.5px,2.4vw,11px)] tracking-[0.26em] text-inv-ink-soft uppercase">
                {content.dateLabel}
              </p>
            )}
          </div>
        </div>

        {/* La solapa, con su bisagra arriba. Gira hacia atrás al abrir. */}
        <div className="inv-letter-flap absolute inset-x-0 top-0 z-[5] h-[56%] origin-top [filter:drop-shadow(0_6px_8px_rgb(0_0_0/0.2))]">
          <div className="absolute inset-0 rounded-t-[6px] bg-inv-surface [clip-path:polygon(0_0,100%_0,50%_100%)]">
            <div className="absolute inset-0" style={{ background: PAPER_SHEEN }} />
            <div className="absolute inset-0 bg-inv-ink/[0.04]" />
          </div>
        </div>

        {/* El lacre, en la punta de la solapa. */}
        <div className="absolute top-[56%] left-1/2 z-[6] -translate-x-1/2 -translate-y-1/2">
          <WelcomeOpenButton
            label={content.openLabel}
            className="inv-seal-pulse inv-letter-seal relative block size-[clamp(4.8rem,20vw,6rem)] rounded-full hover:scale-[1.05] active:scale-[0.97]"
          >
            <WaxSeal mark={mark} className="size-full" />
          </WelcomeOpenButton>
        </div>
      </div>

      <p
        /* Decorativo: el sello ya se anuncia con `openLabel`. */
        aria-hidden="true"
        className="inv-letter-caption m-0 text-[10.5px] tracking-[0.3em] uppercase opacity-80"
      >
        Toca el sello · {content.openLabel}
      </p>
    </WelcomeShell>
  );
}
