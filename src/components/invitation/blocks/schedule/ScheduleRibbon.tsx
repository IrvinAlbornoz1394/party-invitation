import { blockIconComponent } from '../../shared/block-icons';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { ScheduleBow, ScheduleTime } from './schedule-parts';
import type { ScheduleVariantProps } from './schedule-variant';

/**
 * `schedule.ribbon` — el cronograma como una cinta atada con lazos.
 *
 * Tres columnas: el dibujo del momento a la izquierda, una cinta vertical con su lazo en el
 * centro, y la hora con lo que pasa a la derecha. Es papelería de boda pura —lo que se imprimiría
 * en el reverso de una participación— y es, con diferencia, el más ornamental de los cinco.
 *
 * ## Qué lo separa de los otros cuatro
 *
 * De `schedule.vertical`, que también baja por una línea: allí el hito se marca con un punto o un
 * medallón, aquí la línea **está atada**. Y el dibujo no va dentro de la marca sino en su propia
 * columna y en grande, así que deja de ser un icono de interfaz y pasa a ser una ilustración.
 *
 * De `agenda` y `showcase`, que son tipográficos: este es dibujado. Conviene cuando la invitación
 * tiene un tono romántico —una boda, unos XV— y no conviene en «minimal» ni en «corporate», donde
 * el lazo sería un cuerpo extraño.
 *
 * ## Los dibujos, con trazo muy fino
 *
 * Salen del mismo vocabulario de iconos que el resto de la invitación, pero pedidos en grande y
 * con el trazo casi al mínimo (`0.75`). Es lo que convierte un icono de interfaz en una
 * ilustración de línea: a 64 píxeles y con trazo de dos, la iglesia se ve como un botón; con
 * trazo fino, se ve dibujada.
 *
 * ## El interruptor de marcas
 *
 * `marker: 'dot'` no quita el lazo —el lazo es la cinta, no la marca— sino **la columna de
 * dibujos**. Es la lectura correcta del mismo interruptor que obedecen los otros cuatro: con
 * iconos, cada momento se distingue de un vistazo; sin ellos, queda una cinta sobria con las
 * horas, que es lo que pide una invitación formal.
 */
export function ScheduleRibbon({ content }: ScheduleVariantProps) {
  const withIcons = content.marker === 'icon';
  const lastIndex = content.items.length - 1;

  return (
    <BlockSection block="schedule" variant="ribbon">
      <BlockContainer className="max-w-3xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          /* Rotulado a mano: es la mitad del carácter de esta variante. */
          titleFont="script"
        />

        <ol className="mt-14 grid list-none p-0">
          {content.items.map((item, index) => {
            const Icon = blockIconComponent(item.icon);

            return (
              // El índice como clave es correcto aquí: los hitos no se reordenan ni se insertan
              // en caliente, se renderizan una vez desde contenido guardado.
              /*
               * Flex y no retícula: la columna del dibujo es opcional, y con una retícula de
               * columnas fijas habría que declarar dos plantillas distintas —una con dibujo y
               * otra sin él— o dejar una columna vacía ocupando sitio. En flex, la que no se
               * pinta simplemente no está.
               */
              <li key={index} className="flex items-stretch gap-x-4 sm:gap-x-8">
                {withIcons && (
                  /*
                   * La columna de dibujos no aparece en móvil por debajo de 380px de contenido:
                   * con tres columnas, la del texto se quedaría en ciento sesenta píxeles y la
                   * descripción caería a una palabra por línea. El dibujo es lo primero que sobra
                   * cuando falta sitio — la hora, no.
                   */
                  <div className="hidden shrink-0 items-center justify-center pr-1 text-inv-accent/70 sm:flex sm:w-24 lg:w-32">
                    <Icon
                      size={92}
                      strokeWidth={0.75}
                      aria-hidden="true"
                      className="w-[clamp(3.5rem,9vw,5.5rem)]"
                    />
                  </div>
                )}

                {/*
                  La cinta. Se dibuja por tramos dentro de cada hito en lugar de como una línea
                  absoluta que cruce la lista entera: así el lazo queda siempre centrado en su
                  hito, sea cual sea el alto del texto, y el primero y el último no tienen cinta
                  colgando por fuera.
                */}
                <div className="relative flex w-8 shrink-0 flex-col items-center sm:w-10">
                  <span
                    className={
                      index === 0 ? 'flex-1' : 'w-px flex-1 bg-inv-accent/35'
                    }
                    aria-hidden="true"
                  />
                  <ScheduleBow className="my-1 shrink-0 text-inv-accent" />
                  <span
                    className={
                      index === lastIndex ? 'flex-1' : 'w-px flex-1 bg-inv-accent/35'
                    }
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0 flex-1 py-6 sm:py-8">
                  <ScheduleTime
                    timeLabel={item.timeLabel}
                    className="text-[clamp(1.8rem,5vw,2.5rem)] tracking-[0.08em]"
                  />

                  <h3 className="mt-2 mb-0 font-inv-display text-[clamp(1.2rem,3vw,1.5rem)] leading-tight font-normal text-inv-primary">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="mt-2 mb-0 max-w-xs text-[13.5px] leading-relaxed text-inv-ink-soft">
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
