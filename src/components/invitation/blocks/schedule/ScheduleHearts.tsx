import { Fragment } from 'react';
import { Heart } from 'lucide-react';
import { requireDesignAsset } from '@/lib/design-assets';
import { blockIconComponent } from '../../shared/block-icons';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DesignAsset } from '../../shared/DesignAsset';
import type { ScheduleVariantProps } from './schedule-variant';

const BOW = requireDesignAsset('bow-ribbon-line-001');

/**
 * `schedule.hearts` — los momentos en una sola columna centrada: la hora dentro de un corazón de
 * filete, el rótulo en versalitas debajo y un moño pequeño entre un momento y el siguiente.
 *
 * Es el itinerario de `coquette`, que la referencia no tiene. Se dibuja con el gesto de su fecha
 * —el día dentro de un corazón (`HeartDate`)— llevado a cada hora, para que el itinerario se lea
 * como parte de la misma tarjeta y no como una tabla añadida.
 *
 * Los otros itinerarios ordenan los momentos contra un eje —una línea, un tallo, un hilo de
 * cuentas— a un lado o a los dos; este no tiene eje: cada momento es una pieza centrada y lo que
 * los une es el moño, como las tarjetas atadas de la plantilla.
 *
 * Con iconos (`marker: 'icon'`), el dibujo de cada momento va pequeño, en el acento, encima del
 * rótulo; con puntos, no hay dibujo y queda la hora en su corazón.
 *
 * El corazón mide lo mismo con «9:00» que con «18:30»: la hora baja de cuerpo con su largo en
 * lugar de ensanchar el corazón, que con anchos distintos dejaría de ser una columna.
 */
export function ScheduleHearts({ content }: ScheduleVariantProps) {
  const withIcons = content.marker === 'icon';

  return (
    <BlockSection block="schedule" variant="hearts">
      <BlockContainer className="max-w-md">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleFont="script"
        />

        <ol className="m-0 mt-12 flex list-none flex-col items-center p-0 text-center">
          {content.items.map((item, index) => {
            const Icon = blockIconComponent(item.icon);
            const long = item.timeLabel.length > 5;

            return (
              <Fragment key={index}>
                {index > 0 && (
                  <li aria-hidden="true" className="my-6 text-inv-primary opacity-70">
                    <DesignAsset asset={BOW} className="w-7" />
                  </li>
                )}
                <li className="flex flex-col items-center">
                  <span className="relative grid size-[4.5rem] place-items-center text-inv-accent">
                    <Heart size={72} strokeWidth={0.9} aria-hidden="true" className="absolute inset-0" />
                    <span
                      className={
                        long
                          ? 'relative -mt-1.5 font-inv-display text-[11px] leading-none tabular-nums'
                          : 'relative -mt-1.5 font-inv-display text-[15px] leading-none tabular-nums'
                      }
                    >
                      {item.timeLabel}
                    </span>
                  </span>
                  {withIcons && (
                    <Icon size={22} strokeWidth={1.2} aria-hidden="true" className="mt-3 text-inv-primary" />
                  )}
                  <h3 className="mt-3 mb-0 font-inv-display text-[14px] leading-snug font-normal tracking-[0.16em] text-inv-ink uppercase">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-1.5 mb-0 max-w-[17rem] text-[13.5px] leading-relaxed text-pretty text-inv-ink-soft">
                      {item.description}
                    </p>
                  )}
                </li>
              </Fragment>
            );
          })}
        </ol>

        {content.note && <BlockNote note={content.note} className="mt-12 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
