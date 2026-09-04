import clsx from 'clsx';
import { BlockHeading } from '../../shared/BlockHeading';
import { blockIconComponent } from '../../shared/block-icons';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import type { ScheduleVariantProps } from './schedule-variant';

/**
 * `schedule.leaders` — el itinerario con guías punteadas: la hora en un margen, el rótulo en el
 * otro, y entre los dos una línea de puntos que los une por encima del hilo central.
 *
 * Es el décimo cronograma. Con `schedule.vertical` comparte el hilo central y el alternado, así
 * que la diferencia hay que decirla con precisión —es la que justifica que exista—:
 *
 *   `vertical`  cada momento es un **bloque** a un lado del hilo: hora, título y descripción
 *               juntos, con un medallón en la línea. El hilo separa dos columnas de contenido.
 *   `leaders`   la hora y el rótulo se van a **márgenes opuestos** y los une una guía punteada
 *               que cruza el hilo. No hay dos columnas de contenido: hay una lectura horizontal
 *               por cada momento, como el renglón de un menú impreso o de un programa de mano.
 *
 * La guía punteada es lo que hace el trabajo. Sin ella, la hora a un lado y el rótulo al otro se
 * leerían como dos listas independientes; con ella, el ojo cruza de una a otra y no hay manera de
 * emparejarlas mal. Es un recurso de imprenta —el de los índices y las cartas de restaurante— y
 * en el catálogo no lo usaba nadie.
 *
 * ## El alternado es del rótulo, no del bloque
 *
 * En los pares la hora va a la izquierda y en los impares a la derecha, así que la columna de
 * horas zigzaguea. Es lo que hace la referencia y tiene una razón práctica: con las horas siempre
 * al mismo lado, la guía punteada tendría siempre la misma longitud y el conjunto volvería a ser
 * una tabla.
 *
 * ## En un móvil no se apila
 *
 * Y es deliberado. Las tres columnas —margen, hilo, margen— caben en 320 puntos porque lo que va
 * a los lados es corto: una hora y una etiqueta de dos o tres palabras. La descripción, que es lo
 * único largo, cae **debajo** y a todo el ancho. Apilando por debajo de `sm`, la guía punteada
 * —que es la variante entera— desaparecería justo en la pantalla donde se ve la invitación.
 */
export function ScheduleLeaders({ content }: ScheduleVariantProps) {
  const withIcons = content.marker === 'icon';
  const lastIndex = content.items.length - 1;

  return (
    <BlockSection block="schedule" variant="leaders">
      <BlockContainer className="max-w-xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleCase="caps"
        />

        <ol className="mt-12 list-none p-0">
          {content.items.map((item, index) => {
            const Icon = blockIconComponent(item.icon);
            const timeFirst = index % 2 === 0;

            return (
              // El índice como clave es correcto aquí: los hitos no se reordenan ni se insertan en
              // caliente, se renderizan una vez desde contenido guardado.
              <li key={index} className={clsx(index !== lastIndex && 'pb-9')}>
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3 sm:gap-x-4">
                  <Side align="end" leader={timeFirst}>
                    {timeFirst ? (
                      <Time label={item.timeLabel} />
                    ) : (
                      <Label title={item.title} />
                    )}
                  </Side>

                  {/*
                    La columna del hilo. El tramo va detrás del icono y llega hasta el borde de la
                    celda por los dos lados, así que empalma con el del hito siguiente: el relleno
                    que separa los momentos vive en el `<li>` y no aquí.
                  */}
                  <span aria-hidden="true" className="relative flex h-full items-center justify-center px-1">
                    <span className="absolute inset-y-[-2.25rem] w-px bg-inv-line" />
                    {withIcons ? (
                      <Icon
                        size={22}
                        strokeWidth={1}
                        className="relative bg-inv-bg text-inv-accent"
                      />
                    ) : (
                      <span className="relative size-2 rounded-full bg-inv-accent ring-4 ring-inv-bg" />
                    )}
                  </span>

                  <Side align="start" leader={!timeFirst}>
                    {timeFirst ? (
                      <Label title={item.title} />
                    ) : (
                      <Time label={item.timeLabel} />
                    )}
                  </Side>
                </div>

                {/* La descripción, a todo el ancho y debajo. Metida en su margen, un renglón de
                    treinta palabras rompería la simetría de la fila. */}
                {item.description && (
                  <p className="mx-auto mt-3 mb-0 max-w-sm text-center text-[13px] leading-relaxed text-inv-ink-soft">
                    {item.description}
                  </p>
                )}
              </li>
            );
          })}
        </ol>

        {content.note && <BlockNote note={content.note} className="mt-10 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}

/**
 * Un margen de la fila: su contenido y, hacia el hilo, la guía punteada.
 *
 * La guía es un `flex-1` con borde de puntos, así que **mide lo que sobra**: con un rótulo largo
 * se acorta y con uno corto se estira, que es exactamente lo que hace una guía de imprenta. Solo
 * la lleva el lado de la hora; el del rótulo se queda sin ella para que la fila tenga una
 * dirección de lectura —de la hora hacia el nombre— y no dos.
 */
function Side({
  align,
  leader,
  children,
}: {
  readonly align: 'start' | 'end';
  readonly leader: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        'flex min-w-0 items-center gap-2.5',
        align === 'end' ? 'justify-end' : 'justify-start',
      )}
    >
      {align === 'end' && children}
      {leader && (
        <span
          aria-hidden="true"
          className="h-px min-w-4 flex-1 border-t border-dotted border-inv-line"
        />
      )}
      {align === 'start' && children}
    </div>
  );
}

function Time({ label }: { readonly label: string }) {
  return (
    <span className="shrink-0 font-inv-display text-[1.15rem] leading-none text-inv-accent tabular-nums sm:text-[1.3rem]">
      {label}
    </span>
  );
}

function Label({ title }: { readonly title: string }) {
  return (
    <span className="min-w-0 text-[10.5px] leading-snug tracking-[0.2em] text-inv-ink uppercase sm:text-[11.5px]">
      {title}
    </span>
  );
}
