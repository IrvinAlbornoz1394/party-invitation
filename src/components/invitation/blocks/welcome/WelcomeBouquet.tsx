import { hasText } from '../../shared/has-text';
import {
  BRUSH_BUTTON,
  Blob,
  CLAY_TAN,
  Confetti,
  CupidArrow,
  DoodleBouquet,
  Squiggle,
} from '../../shared/terracotta-ornaments';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';

/**
 * `welcome.bouquet` — la puerta de `terracota`: el papel crema con manchas de barro en dos
 * esquinas, el ramo atado con lazo que en la referencia hace de marca, y los nombres a pincel
 * dentro del rótulo de filete terracota que abre su portada. La flecha de Cupido debajo, y el
 * botón con el rótulo a pincel.
 *
 * Sin foto, como las demás puertas de catálogo: la foto la enseña la portada justo detrás.
 */
export function WelcomeBouquet({ content }: WelcomeVariantProps) {
  return (
    <WelcomeShell
      variant="bouquet"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      contentClassName="justify-center px-6"
      backdrop={
        <>
          <div aria-hidden="true" className="absolute inset-0 -z-20 bg-inv-surface" />
          <Blob shape="slab" motion="drift" className="-top-10 -left-16 -z-10 h-56 w-36 text-inv-accent" />
          <Blob shape="wave" outline className={`-top-4 -right-6 -z-10 h-44 w-48 ${CLAY_TAN}`} />
          <Blob shape="drop" rotate={20} className="-right-20 -bottom-16 -z-10 h-64 w-64 text-inv-primary" />
          <Squiggle className="bottom-10 -left-10 -z-10 w-52 text-inv-primary" />
        </>
      }
    >
      <div className="relative mx-auto flex max-w-sm flex-col items-center text-center">
        <Confetti className="-top-4 -right-6 w-24 opacity-80" />
        <DoodleBouquet className="w-40" />

        {hasText(content.eventTypeLabel) && (
          <p className="mt-6 mb-0 text-[12.5px] font-semibold tracking-[0.22em] text-inv-primary uppercase">
            {content.eventTypeLabel}
          </p>
        )}

        <h2 className="mt-4 mb-0 border-2 border-solid border-inv-primary px-5 py-2 font-inv-display text-[clamp(2.1rem,10vw,2.8rem)] leading-[1.15] font-normal text-inv-primary">
          {content.celebrantName}
        </h2>

        {hasText(content.dateLabel) && (
          <p className="mt-6 mb-0 font-inv-display text-[1.45rem] leading-snug text-inv-ink">{content.dateLabel}</p>
        )}
        {hasText(content.venue) && (
          <p className="mt-1 mb-0 text-[15px] text-inv-ink-soft">{content.venue}</p>
        )}

        <CupidArrow className="mt-6" />

        {hasText(content.note) && (
          <p className="mt-5 mb-0 max-w-xs text-[15px] leading-relaxed text-inv-ink-soft">{content.note}</p>
        )}

        <WelcomeOpenButton label={content.openLabel} tone="onSurface" className={`mt-8 ${BRUSH_BUTTON}`} />
      </div>
    </WelcomeShell>
  );
}
