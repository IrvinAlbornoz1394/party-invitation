import clsx from 'clsx';
import { CalendarDays, Clock } from 'lucide-react';
import { eventDateParts } from '@/domain/invitation/event-date';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { Countdown } from '../../shared/Countdown';
import type { CalendarVariantProps } from './calendar-variant';

/**
 * `calendar.strip` — una franja rosada de lado a lado con el día y la hora en columnas separadas
 * por filetes, cada una con su dibujo encima, y la cuenta regresiva debajo, en cuentas rellenas.
 *
 * Es la fecha de `blush`. Las otras ocho dibujan el mes, la semana, una escala o un aro, o la
 * escriben de corrido; esta la presenta como **una ficha**, la tira de datos que la referencia
 * pone a media página en un rosa más intenso que el papel. Es la única que rompe el ancho del
 * contenedor: la franja va a sangre, y eso es lo que la hace leerse como un dato práctico entre
 * dos secciones de ambiente.
 *
 * La referencia lleva una tercera columna con el salón. Aquí no: el lugar es de la ubicación, que
 * lo cuenta entero con su foto y su mapa, y repetirlo en la fecha obligaría a mantenerlo en dos
 * sitios. Su hueco lo ocupa la cuenta regresiva, debajo y no al lado, porque a lo ancho de un
 * móvil cuatro cuentas no caben en un tercio.
 *
 * La marca del día (`dayMark`) no se usa: no hay retícula de días donde señalar uno.
 */
export function CalendarStrip({ content }: CalendarVariantProps) {
  const parts = eventDateParts(content.startsAt);
  // Sin rótulo ni título no hay cabecera: ni su contenedor ni el margen que la separaba de la banda.
  const hasHeading = hasText(content.eyebrow) || hasText(content.title);

  return (
    <BlockSection block="calendar" variant="strip">
      {hasHeading && (
        <BlockContainer className="max-w-md text-center">
          {hasText(content.eyebrow) && (
            <p className="m-0 text-[10.5px] tracking-[0.32em] text-inv-ink-soft uppercase">
              {content.eyebrow}
            </p>
          )}
          {hasText(content.title) && (
            <h2
              className={clsx(
                'mb-0 font-inv-script text-[clamp(2.4rem,10vw,3.2rem)] leading-[1.1] font-normal text-inv-accent',
                hasText(content.eyebrow) ? 'mt-3' : 'mt-0',
              )}
            >
              {content.title}
            </h2>
          )}
        </BlockContainer>
      )}

      <div className={clsx('w-full bg-inv-primary/[0.13] py-9', hasHeading && 'mt-10')}>
        <dl className="mx-auto m-0 grid max-w-md grid-flow-col auto-cols-fr divide-x divide-inv-primary/25 px-4 text-center">
          <div className="flex flex-col items-center px-3">
            <dt className="sr-only">Fecha</dt>
            <CalendarDays size={26} strokeWidth={1.2} aria-hidden="true" className="text-inv-primary" />
            {parts ? (
              <dd aria-label={content.dateLabel} className="m-0 mt-3 flex flex-col items-center">
                <span className="text-[9.5px] tracking-[0.24em] text-inv-ink-soft uppercase">
                  {parts.weekday}
                </span>
                <span className="mt-1.5 font-inv-display text-[1.25rem] leading-tight text-inv-ink uppercase">
                  {parts.day} {parts.month}
                </span>
                <span className="font-inv-display text-[1.05rem] leading-tight text-inv-ink tabular-nums">
                  {parts.year}
                </span>
              </dd>
            ) : (
              <dd className="m-0 mt-3 font-inv-display text-[1.05rem] leading-snug text-inv-ink">
                {content.dateLabel}
              </dd>
            )}
          </div>
          {hasText(content.timeLabel) && (
            <div className="flex flex-col items-center px-3">
              <dt className="sr-only">Hora</dt>
              <Clock size={26} strokeWidth={1.2} aria-hidden="true" className="text-inv-primary" />
              <dd className="m-0 mt-3 flex flex-col items-center">
                <span className="text-[9.5px] tracking-[0.24em] text-inv-ink-soft uppercase">
                  A partir de las
                </span>
                <span className="mt-1.5 font-inv-display text-[1.25rem] leading-tight text-inv-ink uppercase tabular-nums">
                  {content.timeLabel}
                </span>
              </dd>
            </div>
          )}
        </dl>
      </div>

      <BlockContainer className="max-w-md text-center">
        <Countdown startsAt={content.startsAt} variant="bead" tone="onSurface" className="mt-10" />
        {hasText(content.note) && (
          <BlockNote note={content.note} className="mx-auto mt-8 max-w-sm text-center" />
        )}
      </BlockContainer>
    </BlockSection>
  );
}
