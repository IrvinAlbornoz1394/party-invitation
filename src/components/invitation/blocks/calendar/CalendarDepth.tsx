'use client';

import { eventDateParts } from '@/domain/invitation/event-date';
import { Countdown } from '../../shared/Countdown';
import { hasText } from '../../shared/has-text';
import { DepthHeading, DepthRule, DepthWash, DepthWord } from '../../shared/mirador-parts';
import { ParallaxLayer, ParallaxScene } from '../../shared/Parallax';
import type { CalendarVariantProps } from './calendar-variant';

/**
 * `calendar.depth` — la fecha de `mirador`, sobre papel: el día del mes en filete gigante cruza
 * por detrás a otra velocidad, y delante quedan el día de la semana, el mes y la cuenta regresiva.
 *
 * El día sale de `eventDateParts`, que lee la fecha tal como viene escrita y no la convierte a la
 * zona del navegador: es lo que evita que la invitación enseñe el día anterior. Si la fecha no se
 * deja leer, queda `dateLabel` y la composición sigue en pie sin el número.
 */
export function CalendarDepth({ content }: CalendarVariantProps) {
  const parts = eventDateParts(content.startsAt);

  return (
    <ParallaxScene
      block="calendar"
      variant="depth"
      className="bg-inv-bg py-[var(--inv-space-block)] font-inv-body text-inv-ink"
    >
      <DepthWash flip />
      {parts && <DepthWord className="top-1/2 -translate-y-1/2">{parts.day}</DepthWord>}

      <div className="mx-auto w-full max-w-xl px-6 text-center sm:px-10">
        <DepthHeading eyebrow={content.eyebrow} title={content.title} />

        <ParallaxLayer depth={-0.05} className="mt-10">
          {parts ? (
            <>
              <p className="m-0 text-[12px] tracking-[0.34em] text-inv-accent uppercase">{parts.weekday}</p>
              <p className="mt-3 mb-0 font-inv-display text-[clamp(1.9rem,7vw,2.75rem)] leading-tight italic">
                {parts.day} de {parts.month}
              </p>
              <p className="mt-2 mb-0 text-[13px] tracking-[0.3em] text-inv-ink-soft uppercase">{parts.year}</p>
              {/* La frase entera, para quien no ve el número gigante. */}
              <span className="sr-only">{content.dateLabel}</span>
            </>
          ) : (
            <p className="m-0 font-inv-display text-[clamp(1.9rem,7vw,2.75rem)] leading-tight italic">
              {content.dateLabel}
            </p>
          )}
          {hasText(content.timeLabel) && (
            <p className="mt-4 mb-0 font-inv-display text-[1.15rem] text-inv-ink tabular-nums">{content.timeLabel}</p>
          )}
        </ParallaxLayer>

        <DepthRule className="mt-10" />
        <Countdown startsAt={content.startsAt} variant="engraved" tone="onSurface" className="mt-10" />

        {hasText(content.note) && (
          <p className="mx-auto mt-10 mb-0 max-w-sm text-[15px] leading-relaxed text-inv-ink-soft">{content.note}</p>
        )}
      </div>
    </ParallaxScene>
  );
}
