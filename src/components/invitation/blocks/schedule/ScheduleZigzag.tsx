import clsx from 'clsx';
import { blockIconComponent } from '../../shared/block-icons';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { ScheduleTime } from './schedule-parts';
import type { ScheduleVariantProps } from './schedule-variant';

/**
 * `schedule.zigzag` — momentos dibujados a un lado y a otro de un hilo, en zigzag.
 *
 * Un hilo baja por el centro y los momentos se van colgando alternos, cada uno con su dibujo
 * encima de la hora. La diferencia con `schedule.vertical` no es el reparto a dos lados —eso lo
 * hacen las dos— sino **dónde cae cada momento y qué toca el hilo**:
 *
 *   · En la línea de tiempo, los hitos se enfrentan por parejas y la marca se posa sobre la
 *     línea, que se parte para dejarle sitio (ver el anillo de `ScheduleMarker`).
 *   · Aquí van **desfasados medio paso**, así que ninguno tiene a otro enfrente, y el hilo
 *     queda entero de arriba abajo. El ojo baja en zigzag siguiendo los dibujos en vez de
 *     recorrer dos columnas paralelas.
 *
 * Eso lo convierte en la forma ilustrada y ligera del catálogo: el dibujo es el protagonista
 * —a trazo fino, sin medallón ni círculo que lo encierre— y la hora va debajo, pequeña. Es la
 * que conviene con etiquetas cortas («Ceremonia», «Banquete», «Pastel») y la que **no** conviene
 * con descripciones largas: al alternar desde el móvil, cada momento vive en media pantalla, y
 * un párrafo de doscientos caracteres ahí cae a tres palabras por línea. Para esos cronogramas
 * están `agenda` —que da el ancho entero al texto— y `vertical`, que solo alterna en escritorio.
 *
 * ## Por qué alterna también en el móvil
 *
 * Porque el zigzag *es* la variante. `schedule.vertical` se endereza en pantalla estrecha y hace
 * bien: su composición sigue leyéndose como una línea de tiempo con la línea al margen. Esta, en
 * una sola columna, sería una lista de iconos centrados — o sea, ninguna de las seis. Quien la
 * elige la elige por cómo se ve en el móvil, que es donde se abre la invitación.
 *
 * ## El desfase, con filas de medio paso
 *
 * El zigzag no se finge con márgenes negativos, que es lo que se rompe en cuanto un momento
 * lleva descripción y otro no. Cada momento **ocupa dos filas de la retícula y empieza una fila
 * más abajo que el anterior**: el primero en la 1, el segundo en la 2, el tercero en la 3. Así
 * cada uno solapa medio paso con su vecino y ninguno con el de su misma columna, y las filas se
 * dimensionan solas — el desfase sale correcto con textos de cualquier alto.
 *
 * ## Por qué las columnas se tocan en el centro
 *
 * El aire entre el texto y el hilo lo pone el relleno de cada momento, no un hueco de retícula
 * (`gap-x`). Es lo que permite anclar la marca de «solo puntos» al canto interior del momento
 * —`left-0` o `right-0`, y medio punto de translación— y que caiga exactamente sobre el hilo en
 * cualquier pantalla. Con `gap-x`, el canto queda a media separación del centro y habría que
 * compensar a mano un número distinto por cada punto de ruptura.
 */
export function ScheduleZigzag({ content }: ScheduleVariantProps) {
  const withIcons = content.marker === 'icon';

  return (
    <BlockSection block="schedule" variant="zigzag">
      <BlockContainer className="max-w-3xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />

        <div className="relative mt-14">
          {/* El hilo, de una pieza: aquí ninguna marca lo interrumpe. Se recorta arriba y abajo
              para que no asome por encima del primer momento ni por debajo del último. */}
          <span
            aria-hidden="true"
            className="absolute top-3 bottom-3 left-1/2 w-px -translate-x-1/2 bg-inv-line"
          />

          <ol className="relative m-0 grid list-none grid-cols-2 p-0">
            {content.items.map((item, index) => {
              const Icon = blockIconComponent(item.icon);
              const toTheRight = index % 2 === 1;

              return (
                // El índice como clave es correcto aquí: los hitos no se reordenan ni se insertan
                // en caliente, se renderizan una vez desde contenido guardado.
                <li
                  key={index}
                  // La fila de arranque es la única medida que depende del índice, y por eso va
                  // en línea: una clase compuesta al vuelo (`row-start-${n}`) no existiría en la
                  // hoja, porque Tailwind solo genera las que puede leer en el código.
                  style={{ gridRowStart: index + 1 }}
                  className={clsx(
                    'relative row-span-2 flex flex-col items-center pb-12 text-center last:pb-4',
                    toTheRight ? 'col-start-2 pl-5 sm:pl-10' : 'col-start-1 pr-5 sm:pr-10',
                  )}
                >
                  {withIcons ? (
                    /*
                     * El dibujo desnudo, sin medallón. Con `IconBadge` sería un icono de interfaz
                     * dentro de un botón; a este tamaño y con el trazo casi al mínimo es una
                     * ilustración, que es lo que sostiene la composición.
                     */
                    <Icon
                      strokeWidth={0.9}
                      aria-hidden="true"
                      className="mb-3 h-auto w-[clamp(2.25rem,8vw,2.9rem)] text-inv-accent"
                    />
                  ) : (
                    /*
                     * En «solo puntos» el hilo recupera el ritmo que perdió al quedarse sin
                     * dibujos: el punto se posa sobre él, a la altura de la hora. Va sin anillo
                     * del color del papel —al contrario que en las otras formas— porque aquí no
                     * hay que abrirle un hueco: se quiere ver el hilo entrar y salir del punto.
                     */
                    <span
                      aria-hidden="true"
                      className={clsx(
                        'absolute top-[0.55rem] size-2 -translate-y-1/2 rounded-full bg-inv-accent',
                        toTheRight ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2',
                      )}
                    />
                  )}

                  <ScheduleTime timeLabel={item.timeLabel} className="text-[1.05rem]" />

                  <h3 className="mt-2 mb-0 font-inv-display text-[clamp(1.05rem,3.5vw,1.3rem)] leading-tight font-normal text-balance text-inv-primary">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="mt-2 mb-0 text-[12.5px] leading-relaxed text-pretty text-inv-ink-soft sm:text-[13.5px]">
                      {item.description}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {content.note && <BlockNote note={content.note} className="mt-12 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
