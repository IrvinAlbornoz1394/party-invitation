import { Heart } from 'lucide-react';
import type { DayMark } from '@/domain/invitation/blocks/calendar';
import { eventDateParts } from '@/domain/invitation/event-date';
import { requireDesignAsset } from '@/lib/design-assets';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { Countdown } from '../../shared/Countdown';
import { DesignAsset } from '../../shared/DesignAsset';
import type { CalendarVariantProps } from './calendar-variant';

const CLUSTER = requireDesignAsset('botanical-sprig-cluster-001');

/**
 * `calendar.countdown` — la fecha en un solo renglón y, debajo, el tiempo que falta.
 *
 * Las otras siete dibujan el mes o la semana —una retícula, una tira, una escala, un aro—. Esta
 * no dibuja ningún día más que el del evento: escribe la fecha de corrido, con la marca del día
 * haciendo de separador («19 ♥ DICIEMBRE ♥ 2026»), y cambia la retícula por la cuenta
 * regresiva. Es lo que hace la papelería de XV que trajo `arbor`: «aparta la fecha» y, debajo,
 * cuántos días quedan. El cálculo de cuándo cae en la semana lo hace el invitado con la otra
 * pieza, que es la que de verdad mira dos veces.
 *
 * La cuenta regresiva va aquí y no en la portada de esa plantilla, y por eso su composición le
 * pide a la portada `showCountdown: false`: dos relojes en las tres primeras pantallas se leen
 * como un error.
 *
 * ## La marca del día hace de separador
 *
 * `dayMark` sigue mandando —corazón, disco o aro—, pero aquí no va debajo de una cifra sino entre
 * las tres partes de la fecha, a cuerpo de texto. Por eso no se usa `DayMarkShape`, que está
 * dibujada para ir detrás de un número.
 */
export function CalendarCountdown({ content }: CalendarVariantProps) {
  const parts = eventDateParts(content.startsAt);

  return (
    <BlockSection block="calendar" variant="countdown">
      <BlockContainer className="max-w-md text-center">
        {content.eyebrow && (
          <p className="m-0 text-[10.5px] tracking-[0.32em] text-inv-ink-soft uppercase">
            {content.eyebrow}
          </p>
        )}
        {content.title && (
          <h2 className="mt-4 mb-0 font-inv-script text-[clamp(2.4rem,10vw,3.3rem)] leading-[1.1] font-normal text-inv-accent">
            {content.title}
          </h2>
        )}

        <p className="sr-only">{content.dateLabel}</p>
        {parts ? (
          <p
            aria-hidden="true"
            className="mt-7 mb-0 flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1 font-inv-display text-[clamp(1.45rem,6.6vw,2rem)] leading-none text-inv-primary sm:gap-x-5"
          >
            <span className="tabular-nums">{parts.day}</span>
            <MarkGlyph mark={content.dayMark} />
            <span className="tracking-[0.12em] uppercase">{parts.month}</span>
            <MarkGlyph mark={content.dayMark} />
            <span className="tabular-nums">{parts.year}</span>
          </p>
        ) : (
          <p className="mt-7 mb-0 font-inv-display text-[clamp(1.4rem,5vw,1.9rem)] leading-tight text-inv-primary">
            {content.dateLabel}
          </p>
        )}
        {content.timeLabel && (
          <p className="mt-4 mb-0 text-[11px] tracking-[0.26em] text-inv-ink-soft uppercase tabular-nums">
            {content.timeLabel}
          </p>
        )}

        <DesignAsset asset={CLUSTER} className="mx-auto mt-8 w-24 text-inv-primary opacity-85" />

        <Countdown startsAt={content.startsAt} variant="arch" tone="onSurface" className="mt-8" />

        {content.note && (
          <BlockNote note={content.note} className="mx-auto mt-8 max-w-sm text-center" />
        )}
      </BlockContainer>
    </BlockSection>
  );
}

/** La marca del día, a cuerpo de texto: el separador entre día, mes y año. */
function MarkGlyph({ mark }: { readonly mark: DayMark }) {
  if (mark === 'heart') {
    return <Heart size={15} strokeWidth={1.4} className="shrink-0 fill-current text-inv-accent" />;
  }

  return (
    <span
      className={
        mark === 'disc'
          ? 'size-2 shrink-0 rounded-full bg-inv-accent'
          : 'size-2.5 shrink-0 rounded-full border border-inv-accent'
      }
    />
  );
}
