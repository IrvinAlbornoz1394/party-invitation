import { CalendarDays, MapPin } from 'lucide-react';
import { ActionLink } from '../../shared/ActionLink';
import { BlockImage } from '../../shared/BlockImage';
import { Countdown } from '../../shared/Countdown';
import type { HeroVariantProps } from './hero-variant';

/**
 * `hero.split` — la fotografía a un lado y la invitación impresa al otro.
 *
 * Las otras dos escriben encima de la foto; esta no. Y esa es toda su razón de ser: hay
 * fotografías con las que ningún velo funciona —un retrato claro, una imagen con texto, una
 * ilustración— y en ellas la portada a sangre obliga a elegir entre leer o ver. Al separar los
 * dos planos, la foto se enseña entera y el texto se apoya en el papel del tema, con el
 * contraste que el tema ya garantiza entre `ink` y `surface`.
 *
 * Es también la única de las tres que se lee bien con una imagen vertical, que es como llegan
 * la mayoría de las fotos que manda un cliente desde el móvil.
 *
 * ## El apilado en móvil
 *
 * En pantalla estrecha la foto ocupa una franja superior y el texto va debajo, en lugar de
 * partir la pantalla en dos mitades ilegibles. La franja se dimensiona en `svh` —la altura
 * visible *pequeña*— porque en iOS la barra del navegador se retrae al bajar: con `vh` la foto
 * quedaría cortada al abrir y se recolocaría sola al primer desplazamiento.
 */
export function HeroSplit({ content }: HeroVariantProps) {
  return (
    <section
      data-block="hero"
      data-variant="split"
      className="grid min-h-[var(--inv-viewport,100svh)] w-full grid-cols-1 bg-inv-bg font-inv-body text-inv-ink md:grid-cols-2"
    >
      <div className="relative isolate h-[42svh] w-full overflow-hidden md:h-auto">
        {content.image ? (
          <BlockImage image={content.image} priority sizes="(min-width: 768px) 50vw, 100vw" />
        ) : (
          <div aria-hidden="true" className="absolute inset-0 bg-inv-primary" />
        )}
      </div>

      <div className="inv-rise flex flex-col justify-center bg-inv-surface px-7 py-14 sm:px-12 md:px-14 md:py-20">
        {content.eventTypeLabel && (
          <p className="m-0 text-[11px] tracking-[0.32em] text-inv-accent uppercase">
            {content.eventTypeLabel}
          </p>
        )}

        {content.intro && (
          <p className="mt-6 mb-0 max-w-md text-[15px] leading-relaxed text-inv-ink-soft">
            {content.intro}
          </p>
        )}

        <h1 className="mt-3 mb-0 font-inv-display text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.98] font-light text-inv-primary">
          {content.celebrantName}
        </h1>

        {content.celebrantLastName && (
          <p className="mt-4 mb-0 text-[12px] tracking-[0.36em] text-inv-ink-soft uppercase">
            {content.celebrantLastName}
          </p>
        )}

        {/* El filete separa la identidad de los datos. Es el mismo papel que cumple el espacio
            en blanco de una participación impresa, y aquí además da un anclaje horizontal a
            una columna que, sin él, es una sola tirada de texto. */}
        <span aria-hidden="true" className="mt-8 h-px w-16 bg-inv-line" />

        {content.tagline && (
          <p className="mt-8 mb-0 max-w-md text-[15px] leading-relaxed text-inv-ink-soft">
            {content.tagline}
          </p>
        )}

        <p className="mt-8 mb-0 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] tracking-[0.06em]">
          <span className="inline-flex items-center gap-2">
            <CalendarDays size={16} strokeWidth={1.6} aria-hidden="true" className="text-inv-accent" />
            {content.dateLabel}
          </span>
          {content.city && (
            <span className="inline-flex items-center gap-2">
              <MapPin size={16} strokeWidth={1.6} aria-hidden="true" className="text-inv-accent" />
              {content.city}
            </span>
          )}
        </p>

        {content.showCountdown && (
          <Countdown startsAt={content.startsAt} tone="onSurface" className="mt-9" />
        )}

        {content.action && (
          <ActionLink
            label={content.action.label}
            href={content.action.href}
            className="mt-10 self-start"
          />
        )}
      </div>
    </section>
  );
}
