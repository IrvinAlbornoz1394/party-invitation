import { BlockHeading } from '../../shared/BlockHeading';
import { blockIconComponent } from '../../shared/block-icons';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { ScheduleTime } from './schedule-parts';
import type { ScheduleVariantProps } from './schedule-variant';

/**
 * `schedule.agenda` — el orden del día compuesto como un programa impreso.
 *
 * Ni línea, ni tarjetas, ni carrusel: dos columnas de texto, la hora a la izquierda y lo que
 * pasa a la derecha, separadas por filetes. Es la forma más sobria de las cuatro y la que mejor
 * aguanta un cronograma largo —diez o doce momentos— porque no gasta nada en decoración: cada
 * hito ocupa dos líneas y se recorre entero de un vistazo.
 *
 * Es también la que conviene cuando el evento es formal. Una línea de tiempo con círculos tiene
 * un aire de aplicación; una columna de horas en tipografía de titulares tiene el de un
 * programa de ceremonia.
 *
 * ## La marca, aquí, es distinta
 *
 * Las otras tres cuelgan sus hitos de una línea y ponen la marca encima. Aquí no hay línea: el
 * ritmo lo dan los filetes entre filas. Por eso el icono va **junto al título**, a tamaño de
 * texto y sin medallón —un círculo de 44px en una fila de dos líneas la desequilibraría—, y en
 * modo «solo puntos» sencillamente no aparece nada. Es el mismo interruptor obedecido de la
 * forma que esta composición pide.
 */
export function ScheduleAgenda({ content }: ScheduleVariantProps) {
  const withIcons = content.marker === 'icon';

  return (
    <BlockSection block="schedule" variant="agenda">
      <BlockContainer className="max-w-3xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
        />

        <ol className="mt-10 grid list-none divide-y divide-inv-line border-y border-inv-line p-0">
          {content.items.map((item, index) => {
            const Icon = blockIconComponent(item.icon);

            return (
              // El índice como clave es correcto aquí: los hitos no se reordenan ni se insertan
              // en caliente, se renderizan una vez desde contenido guardado.
              <li
                key={index}
                className="grid grid-cols-1 gap-x-8 gap-y-2 py-7 sm:grid-cols-[7.5rem_minmax(0,1fr)]"
              >
                {/* Alineadas por arriba y no por la base: la hora y el título tienen tamaños
                    muy distintos, y alinear sus bases deja la hora flotando en la fila. */}
                <ScheduleTime timeLabel={item.timeLabel} className="text-[1.7rem] sm:text-[1.5rem]" />

                <div className="min-w-0">
                  <h3 className="m-0 flex items-center gap-2.5 font-inv-display text-[1.4rem] leading-tight font-normal text-inv-primary">
                    {withIcons && (
                      <Icon
                        size={18}
                        strokeWidth={1.7}
                        className="shrink-0 text-inv-accent"
                        aria-hidden="true"
                      />
                    )}
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

        {content.note && <BlockNote note={content.note} className="mt-8" />}
      </BlockContainer>
    </BlockSection>
  );
}
