import clsx from 'clsx';
import { blockIconComponent } from '../../shared/block-icons';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { hasText } from '../../shared/has-text';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import type { ScheduleVariantProps } from './schedule-variant';

/**
 * `schedule.vine` — un tallo vertical con un nudo por momento, y cada momento colgando de su
 * nudo hacia un lado, alternando.
 *
 * Se parece al zigzag y no es el zigzag. Aquel reparte los momentos en dos columnas que se
 * **solapan** media altura y los centra en su columna, lejos del hilo, sin tocarlo; el hilo es un
 * fondo. Aquí el tallo es la pieza: cada momento ocupa su propio renglón, se **alinea contra el
 * tallo** —a la derecha si cuelga a la izquierda, y al revés— y se une a él con un pedúnculo
 * corto que sale del nudo. Se lee como una rama con hojas alternas, que es el dibujo de `arbor`.
 *
 * Con iconos, el dibujo va encima de la hora, a buen tamaño y de trazo fino: en la referencia es
 * la ilustración de cada momento y no un medallón. Con puntos, el nudo del tallo es lo único que
 * marca cada momento, y la sección queda en hora y rótulo.
 *
 * La hora va en versalitas pequeñas y no en cifra grande: aquí manda el dibujo, y una hora a
 * cuerpo de titular le quitaría el sitio.
 */
export function ScheduleVine({ content }: ScheduleVariantProps) {
  const withIcons = content.marker === 'icon';

  return (
    <BlockSection block="schedule" variant="vine">
      <BlockContainer className="max-w-xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleFont="script"
        />

        <div className="relative mt-12">
          <span
            aria-hidden="true"
            className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-inv-accent/40"
          />
          <ol className="relative m-0 list-none p-0">
            {content.items.map((item, index) => {
              const Icon = blockIconComponent(item.icon);
              const toTheRight = index % 2 === 1;

              return (
                <li key={index} className="relative grid grid-cols-2 py-5 sm:py-6">
                  {/* El nudo, y el pedúnculo que lo une al momento. */}
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-inv-accent bg-inv-bg"
                  />
                  <span
                    aria-hidden="true"
                    className={clsx(
                      'absolute top-1/2 h-px w-4 bg-inv-accent/40 sm:w-6',
                      toTheRight ? 'left-[calc(50%+0.25rem)]' : 'right-[calc(50%+0.25rem)]',
                    )}
                  />

                  <div
                    className={clsx(
                      'flex flex-col',
                      toTheRight
                        ? 'col-start-2 items-start pl-7 text-left sm:pl-10'
                        : 'col-start-1 items-end pr-7 text-right sm:pr-10',
                    )}
                  >
                    {withIcons && (
                      <Icon
                        size={36}
                        strokeWidth={1}
                        aria-hidden="true"
                        className="mb-2.5 text-inv-primary"
                      />
                    )}
                    <span className="text-[10px] tracking-[0.2em] text-inv-accent uppercase tabular-nums">
                      {item.timeLabel}
                    </span>
                    <h3 className="mt-1 mb-0 text-[11.5px] leading-snug font-medium tracking-[0.16em] text-balance text-inv-ink uppercase">
                      {item.title}
                    </h3>
                    {hasText(item.description) && (
                      <p className="mt-1.5 mb-0 max-w-[12rem] text-[12px] leading-relaxed text-pretty text-inv-ink-soft">
                        {item.description}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {hasText(content.note) && <BlockNote note={content.note} className="mt-10 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
