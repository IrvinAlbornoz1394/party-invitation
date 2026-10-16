import clsx from 'clsx';
import { requireDesignAsset } from '@/lib/design-assets';
import { BowCard } from '../../shared/BowCard';
import { DesignAsset } from '../../shared/DesignAsset';
import { HeartDate } from '../../shared/HeartDate';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';
import { hasText } from '../../shared/has-text';

const ROSES = requireDesignAsset('corner-rose-line-001');
const BUTTERFLY = requireDesignAsset('symbol-butterfly-line-001');

/**
 * `welcome.keepsake` — una tarjeta de papelería atada con un moño de cinta, sobre el papel rosado y
 * con ramilletes de rosas de línea subiendo por dos esquinas de la pantalla.
 *
 * Es la bienvenida de `coquette`, que la referencia no trae: se dibuja con su pieza —la tarjeta
 * de dos filetes con el moño (`BowCard`)— para que lo primero que se vea sea ya el lenguaje de
 * toda la invitación. Se distingue de `welcome.ribbon`, que también ata la tarjeta, en lo que la
 * rodea: aquel lleva un moño de satín a color y una cinta de lado a lado; este, un moño
 * **dibujado** que toma el color del tema y rosas de un solo trazo, como un grabado.
 *
 * Sin foto, a propósito, como `ribbon`: la primera fotografía de `coquette` es la tira de la
 * historia, y la portada que se abre detrás es una tarjeta, no un retrato.
 */
export function WelcomeKeepsake({ content }: WelcomeVariantProps) {
  return (
    <WelcomeShell
      variant="keepsake"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      className="bg-inv-bg"
      contentClassName="items-center justify-center px-6 py-12"
    >
      <DesignAsset
        asset={ROSES}
        rotate={180}
        className="pointer-events-none absolute -top-2 -right-2 w-48 text-inv-primary opacity-60 sm:w-64"
      />
      <DesignAsset
        asset={ROSES}
        className="pointer-events-none absolute -bottom-2 -left-2 w-48 text-inv-primary opacity-60 sm:w-64"
      />
      <DesignAsset
        asset={BUTTERFLY}
        rotate={-14}
        className="pointer-events-none absolute top-[16%] left-[8%] w-12 text-inv-primary opacity-55"
      />

      <BowCard className="relative w-[min(84vw,20rem)]" innerClassName="pt-14 pb-10">
        {hasText(content.eventTypeLabel) && (
          <p className="m-0 font-inv-display text-[11px] tracking-[0.34em] text-inv-ink-soft uppercase">
            {content.eventTypeLabel}
          </p>
        )}
        <h2
          className={clsx(
            hasText(content.eventTypeLabel) ? 'mt-3' : 'mt-0',
            'mb-0 font-inv-script text-[clamp(3.6rem,18vw,4.8rem)] leading-[1.05] font-normal text-inv-primary',
          )}
        >
          {content.celebrantName}
        </h2>
        {hasText(content.note) && (
          <p className="mt-4 mb-0 font-inv-display text-[clamp(1.05rem,4.8vw,1.25rem)] leading-snug text-inv-accent">
            {content.note}
          </p>
        )}
        {content.startsAt && hasText(content.dateLabel) ? (
          <HeartDate startsAt={content.startsAt} dateLabel={content.dateLabel} className="mt-6" />
        ) : (
          hasText(content.dateLabel) && (
            <p className="mt-6 mb-0 font-inv-display text-[13px] tracking-[0.2em] text-inv-primary uppercase">
              {content.dateLabel}
            </p>
          )
        )}
        {hasText(content.venue) && (
          <p className="mt-3 mb-0 text-[13px] leading-snug text-inv-ink-soft">{content.venue}</p>
        )}
      </BowCard>

      <WelcomeOpenButton label={content.openLabel} tone="onSurface" className="relative mt-10" />
    </WelcomeShell>
  );
}
