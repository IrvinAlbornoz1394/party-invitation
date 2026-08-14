import clsx from 'clsx';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { ScheduleMarker, ScheduleTime } from './schedule-parts';
import type { ScheduleVariantProps } from './schedule-variant';

/**
 * `schedule.vertical` — la línea de tiempo clásica, con los hitos alternados.
 *
 * Es la forma que todo el mundo reconoce como «el orden del día»: una línea que baja y momentos
 * colgando a un lado y a otro. La alternancia no es adorno — con ocho hitos en una sola columna
 * el ojo pierde el hilo, y repartirlos a los dos lados de la línea da un punto de retorno cada
 * vez.
 *
 * En móvil no hay dos lados: la línea se va al margen izquierdo y todos los hitos cuelgan a su
 * derecha. Alternar en 360px produciría columnas de veinte caracteres, que es ilegible; y el
 * cambio ocurre solo en la retícula, así que el orden de lectura es el mismo en las dos.
 *
 * Es la forma en la que más se nota el interruptor de marcas: con iconos parece un recorrido
 * ilustrado, y con puntos, un hilo. La misma información y dos invitaciones distintas.
 */
export function ScheduleTimeline({ content }: ScheduleVariantProps) {
  return (
    <BlockSection block="schedule" variant="vertical">
      <BlockContainer className="max-w-4xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />

        <ol className="relative mt-14 list-none p-0">
          {/*
            La línea se recorta arriba y abajo para que no sobresalga del primer ni del último
            marcador: una línea que empieza antes del primer hito parece que falta algo encima.
          */}
          <span
            aria-hidden="true"
            className="absolute top-6 bottom-6 left-6 w-px bg-inv-line md:left-1/2 md:-translate-x-1/2"
          />

          {content.items.map((item, index) => {
            const toTheRight = index % 2 === 1;

            return (
              // El índice como clave es correcto aquí: los hitos no se reordenan ni se insertan
              // en caliente, se renderizan una vez desde contenido guardado.
              <li key={index} className="relative pb-12 last:pb-0 md:grid md:grid-cols-2 md:gap-14">
                <ScheduleMarker
                  icon={item.icon}
                  marker={content.marker}
                  className="absolute top-0 left-6 -translate-x-1/2 md:left-1/2"
                />

                <div
                  className={clsx(
                    'pl-16 md:pl-0',
                    toTheRight ? 'md:col-start-2 md:pl-14' : 'md:col-start-1 md:pr-14 md:text-right',
                  )}
                >
                  <ScheduleTime timeLabel={item.timeLabel} className="text-[1.15rem]" />

                  <h3 className="mt-2 mb-0 font-inv-display text-[1.45rem] leading-tight font-normal text-inv-primary">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="mt-2 mb-0 text-[14.5px] leading-relaxed text-inv-ink-soft">
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
