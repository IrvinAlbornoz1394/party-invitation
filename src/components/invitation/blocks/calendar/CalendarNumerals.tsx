'use client';

import { BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { FloralSpray, Flourish } from '../../shared/nocturne-ornaments';
import { WATERCOLOR } from '../../shared/nocturne-assets';
import { useCountdown } from '../../shared/useCountdown';
import type { CalendarVariantProps } from './calendar-variant';

/** Lo que se pinta antes de que el reloj arranque en el navegador: la forma, sin cifras falsas. */
const PLACEHOLDER = [
  { unit: 'days', label: 'Días' },
  { unit: 'hours', label: 'Horas' },
  { unit: 'minutes', label: 'Minutos' },
  { unit: 'seconds', label: 'Segundos' },
] as const;

/**
 * `calendar.numerals` — la fecha de `nocturne` como cuenta atrás: cuatro renglones, cada uno con la
 * cifra en capitulares a cuerpo de cartel y la unidad pequeña en versalitas pegada a su pie.
 *
 * Es la sección «faltan tantos días» de la referencia, y en el catálogo es la única cuenta
 * regresiva que **es** la sección y no un adorno de otra: las demás ponen el reloj en una fila de
 * cajitas bajo la portada. Aquí cada unidad es un renglón y la cifra manda.
 *
 * Alineada a la izquierda, al revés que el resto de la plantilla: la columna de cifras de
 * distinto ancho se lee como una lista solo si arrancan en el mismo sitio. La fecha completa va
 * debajo, centrada otra vez, para quien quiera el dato y no la cuenta.
 *
 * Sin JavaScript —o hasta que arranca— se ven las unidades con un guion: la cifra la pone el
 * reloj del invitado, nunca el del servidor, que ya sería vieja al llegar.
 */
export function CalendarNumerals({ content }: CalendarVariantProps) {
  const parts = useCountdown(content.startsAt);
  const rows = parts ?? PLACEHOLDER.map((part) => ({ ...part, value: null }));

  return (
    <BlockSection block="calendar" variant="numerals" className="relative isolate overflow-hidden">
      <FloralSpray
        asset={WATERCOLOR.anemone}
        motion="sway"
        rotate={-20}
        className="-right-16 bottom-6 -z-10 w-44 opacity-80 sm:w-56"
      />

      <div className="mx-auto max-w-md px-6">
        <header className="text-center">
          {hasText(content.eyebrow) && (
            <p className="m-0 font-inv-display text-[13px] tracking-[0.22em] text-inv-ink-soft uppercase">
              {content.eyebrow}
            </p>
          )}
          <h2 className="mt-2 mb-0 text-[clamp(1.05rem,4.6vw,1.3rem)] font-bold tracking-[0.14em] text-inv-ink uppercase">
            {content.title ?? 'Faltan'}
          </h2>
          <Flourish className="mt-4 w-56" />
        </header>

        <dl aria-live="off" className="mt-10 grid gap-1">
          {rows.map((row) => (
            <div key={row.unit} className="flex items-baseline gap-2">
              <dt className="order-2 font-inv-display text-[clamp(1.1rem,5vw,1.35rem)] text-inv-ink">
                {row.label}
              </dt>
              <dd className="order-1 m-0 min-w-[2ch] font-inv-display text-[clamp(4.2rem,22vw,5.6rem)] leading-none text-inv-ink tabular-nums">
                {row.value ?? '–'}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-10 mb-0 text-center font-inv-display text-[15px] tracking-[0.12em] text-inv-ink uppercase">
          {content.dateLabel}
          {hasText(content.timeLabel) && <> · {content.timeLabel}</>}
        </p>
        {hasText(content.note) && (
          <p className="mx-auto mt-3 mb-0 max-w-xs text-center text-[15px] leading-relaxed text-inv-ink-soft">
            {content.note}
          </p>
        )}
      </div>
    </BlockSection>
  );
}
