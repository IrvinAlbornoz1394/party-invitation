import clsx from 'clsx';
import { BlockHeading } from '../../shared/BlockHeading';
import { blockIconComponent } from '../../shared/block-icons';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { LeafSprig } from '../../shared/paper-ornaments';
import type { ScheduleVariantProps } from './schedule-variant';

/**
 * `schedule.itinerary` — el itinerario con los iconos al margen, fuera del hilo.
 *
 * Las otras seis formas ponen la marca **sobre** la línea: el icono interrumpe el hilo y hay que
 * abrirle un hueco con un anillo del color del papel. Aquí el hilo no se toca. Los iconos van en
 * una columna propia a la izquierda, a trazo y sin medallón, y el hilo queda entre ellos y el
 * texto — de manera que se leen tres columnas limpias: qué es, cuándo, y qué pasa.
 *
 * Es la forma de un itinerario impreso, y la diferencia se nota en un móvil: sin medallones de
 * 44px, cada hito ocupa poco más que sus dos líneas de texto, así que un cronograma de siete
 * momentos cabe casi en una pantalla en lugar de en dos y media.
 *
 * ## La hora manda sobre el título
 *
 * Al contrario que en la línea de tiempo, donde el título va en cuerpo de titular y la hora
 * encima en pequeño. Aquí la hora es lo grande y el título va en versalitas debajo, porque este
 * bloque se abre la mañana del evento con una sola pregunta —«¿a qué hora era?»— y en esa lectura
 * el título es la etiqueta, no el dato.
 *
 * ## El hilo se dibuja por tramos, no de una pieza
 *
 * Cada hito trae su propio tramo, estirado a lo alto de su fila. Como el aire entre hitos es
 * relleno **dentro** de la fila y no margen entre ellas, los tramos se tocan y el hilo se ve
 * continuo. Un hilo absoluto sobre la lista entera —como en `schedule.vertical`— obligaría a
 * escribir a mano el desplazamiento de la columna de iconos, y ese número se rompe en cuanto el
 * modo «solo puntos» quita esa columna.
 *
 * El primero arranca en su punto y el último termina en el suyo: un hilo que empieza antes del
 * primer hito parece que falta algo encima, y uno que sigue después del último, que falta debajo.
 */
export function ScheduleItinerary({ content }: ScheduleVariantProps) {
  const withIcons = content.marker === 'icon';
  const lastIndex = content.items.length - 1;

  return (
    <BlockSection block="schedule" variant="itinerary">
      <BlockContainer className="max-w-2xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleCase="caps"
        />

        <LeafSprig className="mx-auto mt-6 h-7 w-40 text-inv-accent opacity-80" />

        <ol className="mt-10 list-none p-0">
          {content.items.map((item, index) => {
            const Icon = blockIconComponent(item.icon);
            const isFirst = index === 0;
            const isLast = index === lastIndex;

            return (
              // El índice como clave es correcto aquí: los hitos no se reordenan ni se insertan en
              // caliente, se renderizan una vez desde contenido guardado.
              <li
                key={index}
                className={clsx(
                  /* Sin `items-start`: las celdas tienen que estirarse a lo alto de la fila para
                     que el tramo de hilo llegue hasta el borde de abajo y empalme con el siguiente. */
                  'grid gap-x-4 sm:gap-x-6',
                  withIcons
                    ? 'grid-cols-[1.75rem_0.75rem_minmax(0,1fr)]'
                    : 'grid-cols-[0.75rem_minmax(0,1fr)]',
                )}
              >
                {withIcons && (
                  <Icon
                    size={26}
                    strokeWidth={1.1}
                    aria-hidden="true"
                    /* Trazo fino y sin medallón: a 26px con `strokeWidth` 1.1 el icono se lee como
                       una viñeta dibujada, que es lo que pide un itinerario impreso. Con el trazo
                       por defecto (1.6) se vería como un icono de interfaz. */
                    className="mt-1 text-inv-accent"
                  />
                )}

                <span aria-hidden="true" className="relative flex justify-center">
                  <span
                    className={clsx(
                      'w-px bg-inv-line',
                      /* El tramo del primero empieza en su punto y el del último acaba en él. */
                      isFirst && 'mt-2.5',
                      isLast && 'h-2.5',
                    )}
                  />
                  <span className="absolute top-1.5 size-2 rounded-full bg-inv-accent" />
                </span>

                {/*
                  El aire entre hitos va aquí, en el relleno de la columna de texto, y NO en el
                  `<li>`. Es la corrección que hace que el hilo no se corte: el relleno de la fila
                  queda fuera de su caja de contenido, así que un tramo estirado a lo alto de la
                  celda se pararía antes del canto y entre dos hitos aparecería un hueco.
                */}
                <div className={clsx('min-w-0', !isLast && 'pb-8')}>
                  <p className="m-0 font-inv-display text-[1.6rem] leading-none tabular-nums text-inv-primary">
                    {item.timeLabel}
                  </p>

                  <h3 className="mt-2.5 mb-0 text-[11.5px] leading-snug font-normal tracking-[0.2em] text-inv-ink uppercase">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="mt-2 mb-0 text-[14px] leading-relaxed text-inv-ink-soft">
                      {item.description}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {content.note && <BlockNote note={content.note} className="mt-10 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
