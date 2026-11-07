'use client';

import { formatLongDate, useCouple } from './couple';

/**
 * El titular del cierre, que les habla por su nombre si lo escribieron en la portada.
 *
 * Sin nombres —o en el HTML del servidor, que no los conoce— dice el genérico. La boda va en
 * plural («su invitación») y los XV en singular («tu invitación»).
 */
export function HomeCtaHeadline() {
  const { kind, displayNames, personalized, date, daysLeft } = useCouple();

  if (!personalized) {
    return (
      <>
        <h2 id="cierre-titulo" className="h-display mt-8 mb-0 text-[clamp(2.4rem,7vw,4.5rem)] text-balance">
          ¿Planeas tu boda o tus XV?
        </h2>
        <p className="mt-5 mb-0 max-w-[40ch] text-[16px] leading-relaxed text-(--h-wine-ink)/80 sm:text-[17px]">
          Cuéntanos de tu evento y te mandamos la cotización con la plantilla que elijas.
        </p>
      </>
    );
  }

  const possessive = kind === 'boda' ? 'su' : 'tu';

  return (
    <>
      <h2 id="cierre-titulo" className="h-display mt-8 mb-0 text-[clamp(2rem,6vw,3.8rem)] text-balance">
        <span className="h-script block text-[1.35em] leading-[1.1] text-(--h-gold)">{displayNames},</span>
        {possessive} invitación está a un mensaje
      </h2>
      <p className="mt-5 mb-0 max-w-[40ch] text-[16px] leading-relaxed text-(--h-wine-ink)/80 sm:text-[17px]">
        {date && daysLeft > 0
          ? `Faltan ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'} para el ${formatLongDate(date)}. `
          : ''}
        Cuéntanos de tu evento y te mandamos la cotización con la plantilla que elijas.
      </p>
    </>
  );
}
