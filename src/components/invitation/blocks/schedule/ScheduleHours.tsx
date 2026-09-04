import clsx from 'clsx';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import type { ScheduleVariantProps } from './schedule-variant';

/**
 * `schedule.hours` — el libro de horas: la cifra suelta al margen y el filete solo bajo el texto.
 *
 * Es el noveno cronograma y el que le toca a `monochrome`. Se parece a `schedule.agenda` —las dos
 * son una columna de horas contra una de texto— y por eso hay que decir en qué se separan, porque
 * es una decisión y no un ajuste:
 *
 *   `agenda`  el filete cruza **toda** la fila, hora incluida. Es un programa impreso: cada
 *             momento es un renglón de una tabla, y la tabla se lee como una unidad cerrada.
 *   `hours`   el filete empieza **después** de la hora. La columna de cifras queda flotando en el
 *             margen, sin nada que la encierre, y lo que se subraya es el texto.
 *
 * Parece un detalle y es lo que cambia el registro entero de la sección. Con el filete completo
 * hay una retícula dibujada; sin él, hay una columna de horas al aire y unos párrafos separados
 * por una línea. En una estructura donde no existe ni una caja en toda la invitación, la primera
 * tabla sería lo más pesado de la página.
 *
 * ## La hora manda tipográficamente, y por eso no lleva color
 *
 * Va en la serif del tema, a cuerpo grande, ligera y en la **tinta** —no en el acento, como en
 * los otros ocho—. En una invitación en blanco y negro el acento es un gris cálido y una hora
 * teñida se leería más apagada que su propio rótulo, que es al revés de lo que tiene que pasar.
 * Aquí el peso lo da el tamaño, no el color.
 *
 * ## El icono no se pinta nunca
 *
 * Y es el único cronograma que lo hace. `marker` sigue llegando y sigue respetándose en el
 * sentido que importa —no se inventa nada que el contenido no pida—, pero esta variante no
 * dibuja el icono ni el punto: son las dos únicas piezas gráficas que el bloque puede poner, y
 * esta estructura no tiene ninguna. Un medallón con una copa junto a una hora en copperplate es
 * exactamente el elemento de interfaz que la referencia no tiene en ninguna pantalla.
 *
 * Que el interruptor no cambie nada aquí es intencionado y no un olvido: cambiar de variante
 * nunca pierde contenido —el icono elegido sigue guardado y vuelve a verse en cuanto se elige
 * otro cronograma—, que es la regla de la biblioteca.
 */
export function ScheduleHours({ content }: ScheduleVariantProps) {
  const lastIndex = content.items.length - 1;

  return (
    <BlockSection block="schedule" variant="hours">
      <BlockContainer className="max-w-xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleFont="script"
        />

        <ol className="mt-12 list-none p-0">
          {content.items.map((item, index) => (
            // El índice como clave es correcto aquí: los hitos no se reordenan ni se insertan en
            // caliente, se renderizan una vez desde contenido guardado.
            <li key={index} className="grid grid-cols-[3.75rem_minmax(0,1fr)] gap-x-5 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-x-8">
              <p className="m-0 pt-0.5 font-inv-display text-[1.55rem] leading-none font-light text-inv-ink tabular-nums sm:text-[1.75rem]">
                {item.timeLabel}
              </p>

              {/*
                El filete vive en la columna del texto —como borde inferior de la caja— y no en el
                `<li>`. Es lo que lo mantiene fuera del margen de las horas, que es toda la
                diferencia con `schedule.agenda`. El último no lo lleva: una lista no se cierra
                con una raya, se acaba.
              */}
              <div
                className={clsx(
                  'min-w-0 pb-7',
                  index !== lastIndex && 'mb-7 border-b border-inv-line',
                )}
              >
                <h3 className="m-0 text-[13px] leading-snug font-medium text-inv-ink">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="mt-2.5 mb-0 text-[13.5px] leading-relaxed text-inv-ink-soft">
                    {item.description}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>

        {content.note && <BlockNote note={content.note} className="mt-10 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
