import { BlockSection } from '../../shared/BlockSection';
import { blockIconComponent } from '../../shared/block-icons';
import { hasText } from '../../shared/has-text';
import { Reveal } from '../../shared/Reveal';
import { staggerDelay } from '../../shared/stagger';
import { Blob, CLAY_TAN, Squiggle, TerracottaHeading } from '../../shared/terracotta-ornaments';
import type { ScheduleVariantProps } from './schedule-variant';

/** Una mancha pequeña de contorno distinto por fila, para que el riel no parezca una plantilla. */
const BADGE_SHAPES = [
  '58% 42% 55% 45% / 48% 58% 42% 52%',
  '45% 55% 40% 60% / 55% 45% 58% 42%',
  '52% 48% 62% 38% / 42% 52% 48% 58%',
] as const;

/**
 * `schedule.doodle` — el itinerario de `terracota`. La referencia no tiene programa; este sale de
 * sus dibujos: un sendero de puntos terracota baja por la izquierda y en cada parada hay una mancha
 * de barro con el icono del momento. A la derecha, la hora a pincel en terracota, el momento y su
 * descripción.
 *
 * Con `marker: 'dot'` la mancha se queda sin icono, más pequeña.
 */
export function ScheduleDoodle({ content }: ScheduleVariantProps) {
  const withIcons = content.marker === 'icon';

  return (
    <BlockSection block="schedule" variant="doodle" className="relative isolate overflow-hidden">
      <Blob shape="drop" className={`-top-16 -right-24 -z-10 h-64 w-64 ${CLAY_TAN}`} />
      <Squiggle className="bottom-16 -left-12 -z-10 hidden w-48 lg:block" />

      <div className="mx-auto max-w-lg px-6">
        <Reveal>
          <TerracottaHeading eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        </Reveal>

        <ol className="relative m-0 mt-12 list-none p-0">
          <span
            aria-hidden="true"
            className="absolute top-6 bottom-6 left-[1.7rem] border-l-[3px] border-dashed border-inv-primary/45"
          />
          {content.items.map((item, index) => {
            const Icon = blockIconComponent(item.icon);

            return (
              <li key={`${item.timeLabel}-${index}`} className="relative pb-10 last:pb-0">
                <Reveal delay={staggerDelay(index, 0.07)} className="flex gap-5">
                  <span
                    aria-hidden="true"
                    className={
                      withIcons
                        ? 'relative grid size-14 shrink-0 place-items-center bg-inv-accent text-inv-bg'
                        : 'relative mt-2 ml-4 block size-6 shrink-0 bg-inv-primary'
                    }
                    style={{ borderRadius: BADGE_SHAPES[index % BADGE_SHAPES.length] }}
                  >
                    {withIcons && <Icon size={24} strokeWidth={1.6} />}
                  </span>
                  <div className="min-w-0 pt-1">
                    <p className="m-0 font-inv-display text-[1.6rem] leading-none text-inv-primary">{item.timeLabel}</p>
                    <h3 className="mt-2 mb-0 font-inv-body text-[17px] font-semibold text-inv-ink">{item.title}</h3>
                    {hasText(item.description) && (
                      <p className="mt-1.5 mb-0 text-[15.5px] leading-relaxed text-inv-ink-soft">{item.description}</p>
                    )}
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>

        {hasText(content.note) && (
          <p className="mx-auto mt-12 mb-0 max-w-sm text-center text-[15px] leading-relaxed text-inv-ink-soft">
            {content.note}
          </p>
        )}
      </div>
    </BlockSection>
  );
}
