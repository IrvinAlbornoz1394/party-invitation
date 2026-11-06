import clsx from 'clsx';
import { monthGrid } from '@/domain/invitation/month-grid';
import { BlockSection } from '../../shared/BlockSection';
import { Countdown } from '../../shared/Countdown';
import { hasText } from '../../shared/has-text';
import { Reveal } from '../../shared/Reveal';
import { Blob, CLAY_TAN, Feather, LaurelSprig, TerracottaHeading } from '../../shared/terracotta-ornaments';
import type { CalendarVariantProps } from './calendar-variant';

/**
 * `calendar.doodle` — la fecha de `terracota`. La referencia no tiene calendario; este sale de su
 * tarjeta de eventos: el mes en una tarjeta blanca de lados abombados sobre el crema, con el día
 * rodeado por un corazón garabateado a mano en terracota, y debajo la cuenta atrás en casillas.
 *
 * El corazón del día es un trazo y no un relleno, como los dibujos de la plantilla: se lee la
 * cifra a través de él. `dayMark` no aplica aquí; la marca es la de la plantilla.
 */
export function CalendarDoodle({ content }: CalendarVariantProps) {
  const grid = monthGrid(content.startsAt, content.weekStartsOn);
  const title = hasText(content.title) ? content.title : grid ? `${grid.monthLabel} ${grid.year}` : null;

  return (
    <BlockSection block="calendar" variant="doodle" className="relative isolate overflow-hidden bg-inv-surface">
      <Blob shape="slab" className="top-1/4 -left-20 -z-10 h-72 w-32 text-inv-primary" />
      <Blob shape="pebble" outline className={`-right-16 -bottom-10 -z-10 h-52 w-56 ${CLAY_TAN}`} />

      <div className="mx-auto max-w-md px-6">
        <Reveal>
          <TerracottaHeading eyebrow={content.eyebrow} title={title} />
        </Reveal>

        <Reveal delay={0.08} className="relative mt-10">
          <Feather className="-top-8 -left-4 z-10 w-12" rotate={-24} />
          <div className="inv-squircle bg-inv-bg px-5 pt-9 pb-8 sm:px-8">
            {grid && (
              <>
                <p className="m-0 text-center font-inv-display text-[1.7rem] leading-none text-inv-primary">
                  {grid.monthLabel}
                </p>
                <p className="sr-only">{content.dateLabel}</p>
                <div aria-hidden="true" className="mt-6">
                  <div className="grid grid-cols-7 text-center text-[11px] font-semibold tracking-[0.14em] text-inv-ink-soft uppercase">
                    {grid.weekdayInitials.map((initial, index) => (
                      <span key={index} className="py-1.5">
                        {initial}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 grid grid-cols-7 gap-y-1 text-center text-[15px] text-inv-ink tabular-nums">
                    {Array.from({ length: grid.leadingBlanks }, (_, index) => (
                      <span key={`blank-${index}`} />
                    ))}
                    {grid.days.map((cell) => (
                      <span key={cell.day} className="relative flex h-10 items-center justify-center">
                        {cell.isEvent && (
                          <svg
                            viewBox="0 0 48 44"
                            fill="none"
                            className="absolute inset-[-6px] m-auto h-[52px] w-[52px] text-inv-primary"
                          >
                            <path
                              d="M24 40C12 31 4 24 5 14 6 7 12 4 17 5c4 1 6 4 7 7 1-4 4-7 9-7 6 0 11 5 10 12-1 9-9 16-19 24-1 1-3 2-5 1"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                        <span className={clsx('relative', cell.isEvent && 'font-semibold text-inv-primary')}>
                          {cell.day}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
            <p className="mt-6 mb-0 text-center text-[15px] font-medium text-inv-ink">
              {content.dateLabel}
              {hasText(content.timeLabel) && <span className="text-inv-ink-soft"> · {content.timeLabel}</span>}
            </p>
            <LaurelSprig className="mt-5" />
          </div>
        </Reveal>

        <Countdown startsAt={content.startsAt} variant="boxes" tone="onSurface" className="mt-10" />

        {hasText(content.note) && (
          <p className="mx-auto mt-8 mb-0 max-w-xs text-center text-[15px] leading-relaxed text-inv-ink-soft">
            {content.note}
          </p>
        )}
      </div>
    </BlockSection>
  );
}
