import clsx from 'clsx';
import { Heart } from 'lucide-react';
import { eventDateParts } from '@/domain/invitation/event-date';

/**
 * La fecha en un renglón, con el día dentro de un corazón de filete: «SÁBADO ♡23 SEPTIEMBRE».
 *
 * Es el gesto de la fecha de `coquette`, y lo repiten su portada y su calendario: la referencia
 * lo pone en la primera pantalla, y la sección de la cuenta regresiva lo recoge debajo del reloj
 * para que la fecha no se lea dos veces de dos maneras.
 *
 * Si la fecha no se puede partir (`eventDateParts` devuelve `null`), se escribe la frase de
 * siempre (`dateLabel`) en el mismo registro. Un corazón vacío en medio de la línea diría que
 * falta un dato que en realidad está.
 *
 * El renglón visible es decoración partida en tres piezas; para un lector de pantalla va la frase
 * entera como etiqueta, que es como se dice una fecha.
 */
export function HeartDate({
  startsAt,
  dateLabel,
  className,
}: {
  readonly startsAt: string;
  readonly dateLabel: string;
  readonly className?: string;
}) {
  const parts = eventDateParts(startsAt);

  if (!parts) {
    return (
      <p
        className={clsx(
          'm-0 font-inv-display text-[13px] tracking-[0.2em] text-inv-primary uppercase',
          className,
        )}
      >
        {dateLabel}
      </p>
    );
  }

  return (
    <p
      aria-label={dateLabel}
      className={clsx(
        'm-0 flex items-center justify-center gap-2.5 font-inv-display text-[clamp(0.85rem,3.8vw,1rem)] tracking-[0.12em] text-inv-primary uppercase',
        className,
      )}
    >
      <span aria-hidden="true">{parts.weekday}</span>
      <span aria-hidden="true" className="relative grid size-12 shrink-0 place-items-center text-inv-accent">
        <Heart size={48} strokeWidth={1} className="absolute inset-0" />
        <span className="relative -mt-1 text-[1.3rem] leading-none tracking-normal tabular-nums">
          {parts.day}
        </span>
      </span>
      <span aria-hidden="true">{parts.month}</span>
    </p>
  );
}
