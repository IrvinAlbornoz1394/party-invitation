import clsx from 'clsx';
import { Heart } from 'lucide-react';
import { requireDesignAsset } from '@/lib/design-assets';
import { DesignAsset } from '../../shared/DesignAsset';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';
import { hasText } from '../../shared/has-text';

const BOW = requireDesignAsset('symbol-bow-satin-001');
const CORNER = requireDesignAsset('corner-floral-blush-001');

/**
 * `welcome.ribbon` — la invitación como una tarjeta atada con un moño de satín: el moño cierra el
 * canto de arriba y el nombre va debajo, entre dos corazones.
 *
 * Es la bienvenida de `blush`. Las otras la abren con un sobre, un velo, una foto a sangre o un
 * arco dibujado; esta con un **regalo**: una tarjeta blanca sobre el papel rosado, con la cinta
 * cruzándola de lado a lado y el moño encima, y en dos esquinas opuestas de la pantalla los
 * ramilletes de acuarela. Abrirla es desatar el moño, y la portada que aparece detrás repite la
 * flor y el moño de la referencia.
 *
 * La cinta es un filete del color principal, no un dibujo: a ese grosor, la pieza dibujada se
 * reduciría a una raya, y así cruza la tarjeta entera a cualquier ancho.
 *
 * Sin foto, a propósito: la primera fotografía de `blush` es la polaroid de la portada, y
 * enseñarla antes —aunque fuera velada— le quitaría la sorpresa a la segunda pantalla.
 */
export function WelcomeRibbon({ content }: WelcomeVariantProps) {
  return (
    <WelcomeShell
      variant="ribbon"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      className="bg-inv-bg"
      contentClassName="items-center justify-center px-6 py-12"
    >
      <DesignAsset
        asset={CORNER}
        className="pointer-events-none absolute top-0 left-0 w-44 opacity-95 sm:w-60"
      />
      <DesignAsset
        asset={CORNER}
        rotate={180}
        className="pointer-events-none absolute right-0 bottom-0 w-40 opacity-90 sm:w-56"
      />

      <div className="relative w-[min(84vw,21rem)]">
        <div className="relative bg-inv-surface px-7 pt-20 pb-12 text-center shadow-[0_24px_50px_-30px_rgba(90,48,58,0.5)]">
          {/* La cinta: cruza la tarjeta de lado a lado por debajo del moño. */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-7 h-2.5 bg-inv-primary/35"
          />
          <DesignAsset
            asset={BOW}
            className="pointer-events-none absolute -top-8 left-1/2 w-40 -translate-x-1/2 drop-shadow-[0_6px_6px_rgba(120,60,75,0.18)] sm:w-44"
          />

          {hasText(content.eventTypeLabel) && (
            <p className="m-0 text-[10.5px] tracking-[0.32em] text-inv-ink-soft uppercase">
              {content.eventTypeLabel}
            </p>
          )}
          <h2
            className={clsx(
              hasText(content.eventTypeLabel) ? 'mt-4' : 'mt-0',
              'mb-0 font-inv-script text-[clamp(3rem,15vw,4.2rem)] leading-[1.05] font-normal text-inv-accent',
            )}
          >
            {content.celebrantName}
          </h2>
          {hasText(content.celebrantLastName) && (
            <p className="mt-1 mb-0 font-inv-display text-[12px] tracking-[0.3em] text-inv-ink-soft uppercase">
              {content.celebrantLastName}
            </p>
          )}

          {/* El filete separa el nombre de los datos; sin ninguno, la tarjeta remata en el nombre. */}
          {(hasText(content.note) || hasText(content.dateLabel) || hasText(content.venue)) && (
            <p
              aria-hidden="true"
              className="mt-6 mb-0 flex items-center justify-center gap-3 text-inv-accent"
            >
              <span className="h-px w-10 bg-current opacity-50" />
              <Heart size={11} strokeWidth={0} className="fill-current" />
              <span className="h-px w-10 bg-current opacity-50" />
            </p>
          )}

          {hasText(content.note) && (
            <p className="mt-6 mb-0 font-inv-display text-[clamp(1rem,4.6vw,1.2rem)] leading-snug text-inv-ink italic">
              {content.note}
            </p>
          )}
          {hasText(content.dateLabel) && (
            <p className="mt-5 mb-0 font-inv-display text-[13px] tracking-[0.22em] text-inv-primary uppercase">
              {content.dateLabel}
            </p>
          )}
          {hasText(content.venue) && (
            <p className="mt-2 mb-0 text-[12px] leading-snug text-inv-ink-soft">{content.venue}</p>
          )}
        </div>
      </div>

      <WelcomeOpenButton label={content.openLabel} tone="onSurface" className="relative mt-10" />
    </WelcomeShell>
  );
}
