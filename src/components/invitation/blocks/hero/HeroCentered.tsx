import { BlockImage } from '../../shared/BlockImage';
import { ScrollHint } from '../../shared/ScrollHint';
import { Countdown } from '../../shared/Countdown';
import type { HeroVariantProps } from './hero-variant';

/**
 * `hero.centered` — portada de invitación formal: todo al centro, dentro de un marco.
 *
 * Es la misma información que `hero.classic` colocada con otra intención. La clásica cuenta;
 * esta **presenta**: eje central, marco de filete y aire arriba y abajo, que es la retórica de
 * una participación impresa. Es la que pide una boda o unos XV años, y la razón por la que dos
 * variantes de portada no son un capricho de diseño sino dos registros distintos del mismo
 * producto.
 *
 * ## Por qué el velo es uniforme y no un degradado
 *
 * Porque el texto ya no está en el tercio inferior sino en medio de la fotografía, encima de
 * lo que la foto tenga ahí. Un degradado dejaría el centro sin proteger, que es justo donde
 * está el nombre. El precio es que la imagen se ve algo más apagada; a cambio, se lee siempre.
 *
 * ## La frase de invitación, en manuscrita
 *
 * `intro` va con la tipografía `script` del tema. Es el único sitio del bloque donde se usa: es
 * la voz de quien invita —«con la bendición de Dios te invitamos»— frente al nombre, que es el
 * dato. Un tema que no quiera manuscrita solo tiene que apuntar `fonts.script` a otra familia.
 */
export function HeroCentered({ content }: HeroVariantProps) {
  return (
    <section
      data-block="hero"
      data-variant="centered"
      className="relative isolate flex min-h-[var(--inv-viewport,100svh)] w-full items-center justify-center overflow-hidden bg-inv-bg text-center font-inv-body text-inv-on-primary inv-on-photo"
    >
      {content.image ? (
        <>
          <BlockImage image={content.image} priority className="-z-20" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 inv-scrim" data-from="center" />
        </>
      ) : (
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-inv-primary" />
      )}

      {/* El marco se separa del borde y no lo toca: pegado al canto se lee como un error de
          recorte, y en un móvil lo comería el radio de la pantalla. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 rounded-inv-lg border border-current/25 sm:inset-6"
      />

      <div className="inv-rise relative mx-auto w-full max-w-2xl px-6 py-20 sm:px-12 sm:py-24">
        {content.eventTypeLabel && (
          <p className="m-0 flex items-center justify-center gap-3 text-[11px] tracking-[0.34em] uppercase opacity-85">
            <span aria-hidden="true" className="h-px w-6 bg-current opacity-60" />
            {content.eventTypeLabel}
            <span aria-hidden="true" className="h-px w-6 bg-current opacity-60" />
          </p>
        )}

        {content.intro && (
          <p className="mt-8 mb-0 font-inv-script text-[clamp(1.5rem,5vw,2.25rem)] leading-tight opacity-95">
            {content.intro}
          </p>
        )}

        <h1 className="mt-4 mb-0 font-inv-display text-[clamp(2.75rem,10vw,5.25rem)] leading-[0.98] font-light">
          {content.celebrantName}
          {content.celebrantLastName && (
            <span className="mt-4 block text-[13px] tracking-[0.42em] uppercase opacity-85">
              {content.celebrantLastName}
            </span>
          )}
        </h1>

        <p className="mx-auto mt-7 mb-0 flex max-w-md flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px] tracking-[0.22em] uppercase opacity-90">
          <span>{content.dateLabel}</span>
          {content.city && (
            <>
              <span aria-hidden="true" className="opacity-50">
                ·
              </span>
              <span>{content.city}</span>
            </>
          )}
        </p>

        {content.tagline && (
          <p className="mx-auto mt-6 mb-0 max-w-lg text-[15px] leading-relaxed opacity-85">
            {content.tagline}
          </p>
        )}

        {/* La línea corrida, y no las casillas: esta portada ya encierra el texto en un marco de
            filete, y cuatro cajas dentro del marco compiten con él. En el cuerpo de la línea de
            fecha, la cuenta regresiva es un renglón más de la participación. */}
        {content.showCountdown && (
          <Countdown startsAt={content.startsAt} variant="inline" className="mt-10 mx-auto" />
        )}
      </div>
      <ScrollHint tone="onImage" />
    </section>
  );
}
