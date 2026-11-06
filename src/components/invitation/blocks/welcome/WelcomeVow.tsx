import { hasText } from '../../shared/has-text';
import { DoodleHeart, FloralSpray, Flourish } from '../../shared/nocturne-ornaments';
import { WATERCOLOR } from '../../shared/nocturne-assets';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';

/**
 * `welcome.vow` — la puerta de `nocturne`: la noche entera, dos ramos de acuarela en esquinas
 * opuestas —uno gira sobre sí mismo, el otro respira— y en el centro los nombres en inglesa con el
 * corazón dorado, la fecha bajo un florón y el botón.
 *
 * No lleva fotografía, a propósito: la foto es la luna de la portada que viene detrás, y abrir con
 * ella sería enseñarla dos veces seguidas. La puerta es el cielo antes de que salga.
 */
export function WelcomeVow({ content }: WelcomeVariantProps) {
  return (
    <WelcomeShell
      variant="vow"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      contentClassName="justify-center px-6"
      backdrop={
        <>
          <div aria-hidden="true" className="absolute inset-0 -z-20 bg-inv-ink" />
          <FloralSpray
            asset={WATERCOLOR.bouquet}
            motion="spin"
            className="-top-24 -left-24 -z-10 w-72 opacity-95 sm:w-80"
          />
          <FloralSpray
            asset={WATERCOLOR.peony}
            rotate={160}
            className="-right-20 -bottom-16 -z-10 w-64 opacity-95 sm:w-72"
          />
        </>
      }
    >
      <div className="mx-auto flex max-w-sm flex-col items-center text-center text-inv-bg">
        {hasText(content.eventTypeLabel) && (
          <p className="m-0 font-inv-display text-[13px] tracking-[0.24em] text-inv-bg/85 uppercase">
            {content.eventTypeLabel}
          </p>
        )}

        <DoodleHeart className="mt-6 w-20" />

        <h2 className="mt-3 mb-0 font-inv-script text-[clamp(3.2rem,16vw,4.6rem)] leading-[1.05] font-normal text-inv-bg">
          {content.celebrantName}
        </h2>

        <Flourish className="mt-6 w-48 text-inv-accent" />

        {hasText(content.dateLabel) && (
          <p className="mt-5 mb-0 text-[13px] tracking-[0.16em] text-inv-bg/90 uppercase">
            {content.dateLabel}
          </p>
        )}
        {hasText(content.venue) && (
          <p className="mt-1.5 mb-0 text-[13.5px] text-inv-bg/75">{content.venue}</p>
        )}
        {hasText(content.note) && (
          <p className="mt-6 mb-0 max-w-xs text-[15px] leading-relaxed text-inv-bg/85">{content.note}</p>
        )}

        <WelcomeOpenButton label={content.openLabel} tone="onSurface" className="mt-9" />
      </div>
    </WelcomeShell>
  );
}
