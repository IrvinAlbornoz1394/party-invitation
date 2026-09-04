import { BlockHeading } from '../../shared/BlockHeading';
import { blockIconComponent } from '../../shared/block-icons';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import type { ScheduleVariantProps } from './schedule-variant';

/**
 * `schedule.cards` — el programa en fichas: una lámina por momento, con la hora en un medallón.
 *
 * Es el séptimo cronograma y el único que **no usa un hilo**. Los otros seis cuelgan los momentos
 * de una línea continua —vertical alternada, cinta que se arrastra, cinta con lazos, zigzag,
 * itinerario con los iconos al margen— o los reparten en franjas a sangre (`showcase`). Aquí cada
 * momento es una pieza suelta y con canto propio, apoyada sobre el papel: lo que ordena la
 * secuencia no es una línea dibujada sino la pila, igual que un juego de tarjetas.
 *
 * Sale de la referencia de `silk`, donde toda la invitación está hecha de piezas de papel
 * flotando sobre el fondo crema — la tarjeta de la portada, las fichas de las telas, la de la
 * confirmación. Un hilo con medallones habría sido el único trazo continuo de la plantilla.
 *
 * ## La hora en un medallón, y por eso cabe sin hilo
 *
 * Al quitar la línea desaparece la señal que decía «esto es una secuencia», y sin ella una pila
 * de fichas se lee como una lista de servicios. El medallón la devuelve: una hora cercada por un
 * filete, del mismo tamaño en las siete fichas, forma una columna de círculos que el ojo sigue
 * hacia abajo. Es la misma función del hilo, hecha con repetición en vez de con un trazo.
 *
 * Va en `display` y con `tabular-nums`: son cifras y tienen que alinearse entre ellas, que es lo
 * único que evita que «17:00» y «02:00» bailen dentro de su círculo.
 *
 * ## El icono acompaña al rótulo, no a la hora
 *
 * Con `marker: 'icon'` el dibujo va pegado al título y pequeño, como en `schedule.agenda`, y no
 * dentro del medallón: ahí competiría con la hora en un espacio de cuarenta píxeles y ganaría el
 * dibujo, que es el dato menos importante de los dos. Con `marker: 'dot'` sencillamente no se
 * pinta —el interruptor es del contenido y esta variante lo obedece como las otras seis—, y la
 * ficha se queda en hora, rótulo y descripción, que es lo que pide un programa formal.
 */
export function ScheduleCards({ content }: ScheduleVariantProps) {
  const withIcons = content.marker === 'icon';

  return (
    <BlockSection block="schedule" variant="cards">
      <BlockContainer className="max-w-2xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />

        <ol className="mt-12 grid list-none gap-4 p-0">
          {content.items.map((item, index) => {
            const Icon = blockIconComponent(item.icon);

            return (
              // El índice como clave es correcto aquí: los hitos no se reordenan ni se insertan en
              // caliente, se renderizan una vez desde contenido guardado.
              <li
                key={index}
                className="flex items-start gap-5 rounded-inv-md border border-inv-line bg-inv-surface px-5 py-5 shadow-inv-soft sm:gap-6 sm:px-7 sm:py-6"
              >
                {/*
                  El medallón. `size-16` fijo y `shrink-0`: si cediera ancho con un rótulo largo,
                  la columna de círculos dejaría de estar alineada y con ella se iría lo único que
                  hace de hilo. El filete es del color de acento y no del de línea —es la pieza que
                  tiene que verse desde lejos, no un borde de caja—.
                */}
                <span className="grid size-16 shrink-0 place-items-center rounded-full border border-inv-accent/45">
                  <span className="font-inv-display text-[1.05rem] leading-none tabular-nums text-inv-primary">
                    {item.timeLabel}
                  </span>
                </span>

                <div className="min-w-0 pt-1.5">
                  <h3 className="m-0 flex items-center gap-2.5 text-[11.5px] leading-snug font-normal tracking-[0.2em] text-inv-ink uppercase">
                    {withIcons && (
                      <Icon
                        size={17}
                        strokeWidth={1.6}
                        aria-hidden="true"
                        className="shrink-0 text-inv-accent"
                      />
                    )}
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
