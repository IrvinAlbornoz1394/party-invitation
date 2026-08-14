import clsx from 'clsx';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { ScheduleMarker, ScheduleTime } from './schedule-parts';
import type { ScheduleVariantProps } from './schedule-variant';

/**
 * `schedule.showcase` — cada momento en su franja, con la hora como elemento gráfico.
 *
 * Los otros tres resumen el día; este lo **presenta**. Cada hito ocupa una banda a ancho
 * completo con la hora en cuerpo grande a un lado y el texto al otro, y el lado se invierte en
 * cada uno: el resultado es una simetría alrededor del centro, como una línea de tiempo a la
 * que se le hubiera quitado la línea.
 *
 * La diferencia con `schedule.agenda` no es de adorno sino de escala. La agenda comprime —hora
 * pequeña, filas de dos líneas, doce momentos que caben en una pantalla—; esta despliega. Por
 * eso es la que conviene con cuatro o cinco momentos y la que **no** conviene con doce: la
 * sección se haría interminable. Que existan las dos es justamente lo que evita una única forma
 * llena de opciones.
 *
 * ## La hora es el dibujo
 *
 * Al no haber ni fotografías ni ilustraciones en este bloque, lo único que puede sostener una
 * banda de este tamaño es la tipografía. La hora crece con `clamp` hasta el cuerpo de un
 * titular y se compone con la fuente de titulares del tema, así que en «Marfil y oro» sale un
 * garalde fino y en «Medianoche», una condensada de cartel — el mismo cronograma con dos
 * caracteres distintos, sin tocar este archivo.
 */
export function ScheduleShowcase({ content }: ScheduleVariantProps) {
  return (
    <BlockSection block="schedule" variant="showcase">
      <BlockContainer>
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />

        <ol className="mt-14 grid list-none divide-y divide-inv-line border-y border-inv-line p-0">
          {content.items.map((item, index) => {
            const mirrored = index % 2 === 1;

            return (
              // El índice como clave es correcto aquí: los hitos no se reordenan ni se insertan
              // en caliente, se renderizan una vez desde contenido guardado.
              <li
                key={index}
                className="grid items-center gap-5 py-10 md:grid-cols-2 md:gap-14 md:py-12"
              >
                <div
                  className={clsx(
                    'flex items-center gap-4',
                    mirrored ? 'md:order-2 md:justify-start' : 'md:order-1 md:justify-end',
                  )}
                >
                  <ScheduleMarker icon={item.icon} marker={content.marker} />
                  <ScheduleTime
                    timeLabel={item.timeLabel}
                    className="text-[clamp(2rem,5vw,3.2rem)] font-light"
                  />
                </div>

                <div className={clsx(mirrored ? 'md:order-1 md:text-right' : 'md:order-2')}>
                  <p className="m-0 text-[11px] tracking-[0.28em] text-inv-ink-soft uppercase">
                    Momento {String(index + 1).padStart(2, '0')}
                  </p>

                  <h3 className="mt-3 mb-0 font-inv-display text-[clamp(1.5rem,3vw,2rem)] leading-tight font-light text-inv-primary">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="mt-3 mb-0 text-[15px] leading-relaxed text-inv-ink-soft">
                      {item.description}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {content.note && <BlockNote note={content.note} className="mt-12 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
