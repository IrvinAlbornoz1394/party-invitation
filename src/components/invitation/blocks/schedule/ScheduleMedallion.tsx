import { BlockSection } from '../../shared/BlockSection';
import { blockIconComponent } from '../../shared/block-icons';
import { hasText } from '../../shared/has-text';
import { BeadRule, FloralSpray, NocturneHeading } from '../../shared/nocturne-ornaments';
import { WATERCOLOR } from '../../shared/nocturne-assets';
import { Reveal } from '../../shared/Reveal';
import { staggerDelay } from '../../shared/stagger';
import type { ScheduleVariantProps } from './schedule-variant';

/**
 * `schedule.medallion` — el itinerario de `nocturne`: una columna centrada donde cada momento es
 * un dibujo de línea, la hora en capitulares a cuerpo grande y el título en versalitas, y entre
 * uno y otro el filete de cuentas en frambuesa.
 *
 * Toma de la referencia el renglón «10:30 AM IN THE SQUARE VILLA» con el despertador encima: la
 * hora como titular de su momento, no como dato al margen. Sin hilo vertical: el filete de cuentas
 * ya marca la secuencia, y un hilo encima sería un segundo ornamento haciendo lo mismo.
 *
 * Con `marker: 'dot'` el dibujo desaparece y queda un punto frambuesa: el modo sobrio que pide un
 * itinerario de muchos momentos parecidos.
 */
export function ScheduleMedallion({ content }: ScheduleVariantProps) {
  return (
    <BlockSection block="schedule" variant="medallion" className="relative isolate overflow-hidden">
      <FloralSpray
        asset={WATERCOLOR.jasmine}
        motion="sway"
        rotate={200}
        className="-top-6 -left-14 -z-10 w-36 opacity-70 sm:w-44"
      />

      <div className="mx-auto max-w-md px-6">
        <Reveal>
          <NocturneHeading eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        </Reveal>

        <ol className="m-0 mt-12 list-none p-0 text-center">
          {content.items.map((item, index) => {
            const Icon = blockIconComponent(item.icon);

            return (
              <li key={`${item.timeLabel}-${index}`}>
                {index > 0 && <BeadRule className="my-9" />}
                  <Reveal delay={staggerDelay(index, 0.06)}>
                    {content.marker === 'icon' ? (
                      <Icon aria-hidden="true" size={40} strokeWidth={1.25} className="mx-auto text-inv-ink" />
                    ) : (
                      <span aria-hidden="true" className="mx-auto block size-2.5 rounded-full bg-inv-primary" />
                    )}
                    <p className="mt-4 mb-0 font-inv-display text-[clamp(1.6rem,7.5vw,2rem)] leading-tight font-bold text-inv-ink">
                      {item.timeLabel}
                    </p>
                    <h3 className="mt-1 mb-0 font-inv-display text-[clamp(1.05rem,4.8vw,1.25rem)] font-semibold tracking-[0.04em] text-inv-ink uppercase">
                      {item.title}
                    </h3>
                    {hasText(item.description) && (
                      <p className="mx-auto mt-3 mb-0 max-w-xs text-[15.5px] leading-relaxed text-inv-ink-soft">
                        {item.description}
                      </p>
                    )}
                  </Reveal>
              </li>
            );
          })}
        </ol>

        {hasText(content.note) && (
          <p className="mx-auto mt-12 mb-0 max-w-sm text-center text-[14.5px] leading-relaxed text-inv-ink-soft">
            {content.note}
          </p>
        )}
      </div>
    </BlockSection>
  );
}
