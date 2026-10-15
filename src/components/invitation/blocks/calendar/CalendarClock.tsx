import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { Countdown } from '../../shared/Countdown';
import { HeartDate } from '../../shared/HeartDate';
import type { CalendarVariantProps } from './calendar-variant';

/**
 * `calendar.clock` — «Faltan» a pincel y, debajo, la cuenta regresiva como la hora de un reloj
 * —cifras unidas por dos puntos dentro de un marco de filete—, con la fecha cerrando en un
 * renglón con el día dentro de un corazón.
 *
 * Es la fecha de `coquette`, y el final de la primera columna de la referencia. De las diez
 * fechas es la única en la que **el reloj es el titular** y el día va debajo, de remate: las demás
 * dibujan el mes, la semana o el día, y si cuentan el tiempo lo hacen al pie. Aquí la pregunta
 * que contesta la sección es «¿cuánto falta?», y por eso el rótulo es un verbo.
 *
 * La fecha de debajo es la misma pieza que la de la portada (`HeartDate`), para que el invitado
 * la reconozca y no la lea como un dato nuevo.
 *
 * La marca del día (`dayMark`) no se usa: el día ya va siempre en un corazón.
 */
export function CalendarClock({ content }: CalendarVariantProps) {
  return (
    <BlockSection block="calendar" variant="clock">
      <BlockContainer className="max-w-md text-center">
        {content.eyebrow && (
          <p className="m-0 font-inv-display text-[11px] tracking-[0.32em] text-inv-ink-soft uppercase">
            {content.eyebrow}
          </p>
        )}
        {content.title && (
          <h2 className="mt-1 mb-0 font-inv-script text-[clamp(3.4rem,16vw,4.6rem)] leading-[1.1] font-normal text-inv-primary">
            {content.title}
          </h2>
        )}

        <Countdown startsAt={content.startsAt} variant="colon" tone="onSurface" className="mt-6" />

        <HeartDate startsAt={content.startsAt} dateLabel={content.dateLabel} className="mt-9" />
        {content.timeLabel && (
          <p className="mt-2 mb-0 font-inv-display text-[13px] tracking-[0.2em] text-inv-ink-soft uppercase tabular-nums">
            {content.timeLabel}
          </p>
        )}
        {content.note && <BlockNote note={content.note} className="mx-auto mt-8 max-w-sm text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
