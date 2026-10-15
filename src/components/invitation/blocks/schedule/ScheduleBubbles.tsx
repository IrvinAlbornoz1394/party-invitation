import { blockIconComponent } from '../../shared/block-icons';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import type { ScheduleVariantProps } from './schedule-variant';

/**
 * `schedule.bubbles` — cada momento cuelga de un medallón relleno del color principal, con su
 * dibujo en negativo, y los medallones van ensartados en un hilo punteado a la izquierda.
 *
 * Es el itinerario de `blush`, tal cual lo dibuja la referencia: la columna de medallones a un
 * lado y la hora, el rótulo y la frase al otro, alineados a la izquierda. Se parece a
 * `schedule.vertical` en el esqueleto y no en nada más: aquel marca cada momento con un punto
 * sobre una línea continua; aquí el medallón **es** el momento —a tamaño de botón, relleno— y el
 * hilo entre ellos es punteado, que es lo que hace que se lea como un collar de cuentas y no
 * como una línea de tiempo.
 *
 * Con puntos en vez de iconos (`marker: 'dot'`), el medallón se encoge a una cuenta pequeña y
 * rellena: el itinerario sigue siendo el mismo collar, solo que sin dibujos.
 *
 * La hora va en el acento y en versalitas pequeñas, arriba, y el rótulo debajo en la serif: es el
 * orden de la referencia, y el que deja leer la columna de horas de un vistazo.
 */
export function ScheduleBubbles({ content }: ScheduleVariantProps) {
  const withIcons = content.marker === 'icon';

  return (
    <BlockSection block="schedule" variant="bubbles">
      <BlockContainer className="max-w-md">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleFont="script"
        />

        <ol className="relative m-0 mx-auto mt-12 max-w-[20rem] list-none p-0">
          {content.items.map((item, index) => {
            const Icon = blockIconComponent(item.icon);
            const last = index === content.items.length - 1;

            return (
              <li key={index} className="relative flex gap-5 pb-9 last:pb-0">
                {/* El hilo hasta el siguiente medallón, desde el centro de este. */}
                {!last && (
                  <span
                    aria-hidden="true"
                    className={
                      withIcons
                        ? 'absolute top-14 bottom-1 left-7 border-l border-dashed border-inv-primary/45'
                        : 'absolute top-5 bottom-0 left-2 border-l border-dashed border-inv-primary/45'
                    }
                  />
                )}
                {withIcons ? (
                  <span className="relative grid size-14 shrink-0 place-items-center rounded-full bg-inv-primary text-inv-on-primary shadow-[0_8px_18px_-10px_rgba(120,60,75,0.6)]">
                    <Icon size={24} strokeWidth={1.4} aria-hidden="true" />
                  </span>
                ) : (
                  <span
                    aria-hidden="true"
                    className="relative mt-1 size-4 shrink-0 rounded-full bg-inv-primary"
                  />
                )}

                <div className={withIcons ? 'pt-1.5' : undefined}>
                  <span className="text-[10.5px] tracking-[0.2em] text-inv-accent uppercase tabular-nums">
                    {item.timeLabel}
                  </span>
                  <h3 className="mt-1 mb-0 font-inv-display text-[13.5px] leading-snug font-medium tracking-[0.1em] text-inv-ink uppercase">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-1 mb-0 text-[13px] leading-relaxed text-pretty text-inv-ink-soft">
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
