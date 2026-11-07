import clsx from 'clsx';
import { BlockNote } from '../../shared/BlockNote';
import { hasText } from '../../shared/has-text';
import { DepthHeading, DepthWash, DepthWord } from '../../shared/mirador-parts';
import { ParallaxLayer, ParallaxScene } from '../../shared/Parallax';
import { Reveal } from '../../shared/Reveal';
import { staggerDelay } from '../../shared/stagger';
import { ScheduleMarker, ScheduleTime } from './schedule-parts';
import type { ScheduleVariantProps } from './schedule-variant';

/**
 * Cuánto se adelanta cada momento. Alterna dos velocidades muy cercanas: el itinerario
 * «respira» al bajar sin que ningún momento se despegue del filete.
 */
function momentDepth(index: number): number {
  return index % 2 === 0 ? -0.03 : -0.06;
}

/**
 * `schedule.depth` — el itinerario de `mirador`, sobre papel.
 *
 * Un filete vertical baja por el centro y los momentos se cuelgan de él, alternando lado en
 * escritorio; en el teléfono el filete se va a la izquierda y todos cuelgan a la derecha. Detrás,
 * el campo de color se aleja y la primera hora del día cruza en filete gigante a otra velocidad.
 */
export function ScheduleDepth({ content }: ScheduleVariantProps) {
  const dotted = content.marker === 'dot';

  return (
    <ParallaxScene block="schedule" variant="depth" className="bg-inv-bg py-[var(--inv-space-block)] font-inv-body text-inv-ink">
      <DepthWash flip />
      {/* Detrás del encabezado y no de los momentos: encima de la primera hora chocaba con ella. */}
      <DepthWord className="top-[2%]">{content.items[0]?.timeLabel ?? content.title}</DepthWord>

      <div className="mx-auto w-full max-w-4xl px-6 sm:px-10">
        <Reveal>
          <DepthHeading eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        </Reveal>

        <ol className="relative m-0 mt-16 list-none p-0">
          {/* El filete: a la izquierda en el teléfono, al centro desde `md`. */}
          <span
            aria-hidden="true"
            className={clsx(
              'absolute top-0 bottom-0 w-px bg-inv-accent/45 md:left-1/2',
              dotted ? 'left-[0.625rem]' : 'left-[1.375rem]',
            )}
          />

          {content.items.map((item, index) => {
            const right = index % 2 === 1;
            return (
              // El índice como clave es correcto: los momentos se pintan una vez desde contenido guardado.
              <li key={index} className="relative pb-14 last:pb-0">
                <ParallaxLayer depth={momentDepth(index)}>
                  <Reveal delay={staggerDelay(index, 0.06)}>
                    <div className="grid grid-cols-[auto_1fr] items-start gap-x-5 md:grid-cols-[1fr_auto_1fr] md:gap-x-10">
                      <ScheduleMarker
                        icon={item.icon}
                        marker={content.marker}
                        className={clsx('relative md:col-start-2 md:row-start-1', dotted && 'mt-1.5')}
                      />
                      <div
                        className={clsx(
                          'md:row-start-1',
                          right ? 'md:col-start-3 md:text-left' : 'md:col-start-1 md:text-right',
                        )}
                      >
                        <ScheduleTime timeLabel={item.timeLabel} className="text-[clamp(1.9rem,7vw,2.6rem)] italic" />
                        <h3 className="mt-2 mb-0 text-[12px] font-medium tracking-[0.28em] text-inv-ink uppercase">
                          {item.title}
                        </h3>
                        {hasText(item.description) && (
                          <p
                            className={clsx(
                              'mt-3 mb-0 max-w-xs text-[15.5px] leading-relaxed text-inv-ink-soft',
                              right ? 'md:mr-auto' : 'md:ml-auto',
                            )}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </Reveal>
                </ParallaxLayer>
              </li>
            );
          })}
        </ol>

        {hasText(content.note) && <BlockNote note={content.note} className="mx-auto mt-14 max-w-sm text-center" />}
      </div>
    </ParallaxScene>
  );
}
