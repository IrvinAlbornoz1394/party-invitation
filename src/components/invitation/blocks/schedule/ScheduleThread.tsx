import clsx from 'clsx';
import { requireDesignAsset } from '@/lib/design-assets';
import { blockIconComponent } from '../../shared/block-icons';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { hasText } from '../../shared/has-text';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DesignAsset } from '../../shared/DesignAsset';
import { RedThread } from '../../shared/RedThread';
import type { ScheduleVariantProps } from './schedule-variant';

const HEART = requireDesignAsset('symbol-heart-solid-001');

/** Los recortes que se pegan junto a los momentos, en el orden en que aparecen. */
const STICKERS = [
  requireDesignAsset('sticker-camera-instant-001'),
  requireDesignAsset('sticker-cocktail-glass-001'),
  requireDesignAsset('sticker-cake-heart-001'),
  requireDesignAsset('sticker-kiss-001'),
] as const;

/** El giro de cada recorte, para que no parezcan alineados con regla. */
const STICKER_TILTS = [-8, 10, -5, 7] as const;

/**
 * Dónde cae el corazón que abre cada tramo del hilo, en porcentaje del ancho de la columna.
 *
 * El tramo `loop` entra arriba casi en el canto izquierdo (8 de 120 → 7%) y sale abajo en el
 * derecho; reflejado, al revés. Los tramos se alternan, así que cada uno empieza a unos
 * píxeles de donde acabó el anterior, y el corazón va justo ahí: tapa la costura y es el nudo
 * que la referencia pone sobre el cordón. El primero no tiene costura y lleva corazón igual,
 * como el alfiler que sujeta el principio del hilo.
 */
function heartPosition(index: number): string {
  if (index === 0) return 'left-[7%]';

  return index % 2 === 1 ? 'left-[96%]' : 'left-[4%]';
}

/**
 * `schedule.thread` — el itinerario de `scrapbook`: los momentos en una sola columna, cosidos
 * por el hilo rojo que baja serpenteando a su izquierda, con un corazón en cada nudo y un
 * recorte pegado junto a los momentos alternos.
 *
 * Es la sección que define la plantilla, y por eso el hilo no es un fondo sino el eje: va en su
 * propia columna, a la izquierda del texto, y nunca cruza por debajo de una línea que haya que
 * leer. Los otros itinerarios con eje —el tallo de `vine`, la línea de `timeline`— lo trazan
 * recto; aquí da bucles, como el cordón que se pega a mano entre las fotos de un álbum.
 *
 * ## Un tramo de hilo por momento, y no uno para toda la lista
 *
 * Un solo hilo estirado a la altura de la lista se deforma con el número de momentos y con lo
 * que ocupe cada descripción, y no hay forma de saber dónde pasa para poner los corazones
 * encima. Con un tramo por momento, cada uno se estira a la altura de **su** momento —sea de
 * una línea o de cinco— y los extremos de los tramos caen siempre en el mismo sitio: el borde
 * entre un momento y el siguiente. Ahí van los corazones, y quedan sobre el hilo con dos
 * momentos o con doce. Los tramos se reflejan uno sí y otro no para que el hilo vaya y vuelva.
 *
 * ## Los recortes
 *
 * La cámara, la copa, el pastel y el beso van junto a los momentos pares, en ese orden y
 * volviendo a empezar si hay más. Son un adorno y no un icono del momento: no dicen qué pasa a
 * esa hora —para eso está `marker`—, y por eso se reparten por posición. Asoman por el canto
 * derecho y la sección los recorta; en el móvil el texto deja sitio a su derecha para que
 * ningún recorte tape una palabra.
 *
 * La hora va en la display en cursiva y en el color principal, que es la letra a mano de la
 * referencia; el rótulo en versalitas pequeñas y la descripción en la de texto. Con iconos, el
 * dibujo del momento va pequeño delante de la hora; con puntos, el corazón ya marca cada uno.
 */
export function ScheduleThread({ content }: ScheduleVariantProps) {
  const withIcons = content.marker === 'icon';
  const lastIndex = content.items.length - 1;

  return (
    <BlockSection block="schedule" variant="thread">
      <BlockContainer className="max-w-lg">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleFont="script"
        />

        <ol className="m-0 mt-12 list-none p-0">
          {content.items.map((item, index) => {
            const Icon = blockIconComponent(item.icon);
            const sticker = index % 2 === 0 ? (index / 2) % STICKERS.length : null;

            return (
              <li
                key={index}
                className="relative grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 py-7 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-x-6"
              >
                {/* La columna del hilo: el tramo de este momento y el corazón que lo abre. */}
                <div aria-hidden="true" className="relative text-inv-primary">
                  <RedThread
                    shape="loop"
                    flip={index % 2 === 1}
                    className="absolute -top-7 left-0 h-[calc(100%+3.5rem)] w-full opacity-85"
                  />
                  <DesignAsset
                    asset={HEART}
                    rotate={index % 2 === 0 ? -12 : 10}
                    className={clsx(
                      'absolute -top-7 w-3.5 -translate-x-1/2 -translate-y-1/2',
                      heartPosition(index),
                    )}
                  />
                  {index === lastIndex && (
                    <DesignAsset
                      asset={HEART}
                      rotate={8}
                      className={clsx(
                        'absolute -bottom-7 w-4 -translate-x-1/2 translate-y-1/2',
                        index % 2 === 0 ? 'left-full' : 'left-0',
                      )}
                    />
                  )}
                </div>

                <div className="pr-12 sm:pr-0">
                  <p className="m-0 flex items-center gap-2 font-inv-display text-[1.4rem] leading-none text-inv-primary italic tabular-nums">
                    {withIcons && <Icon size={16} strokeWidth={1.4} aria-hidden="true" className="shrink-0" />}
                    {item.timeLabel}
                  </p>
                  <h3 className="mt-2 mb-0 text-[12.5px] leading-snug font-medium tracking-[0.16em] text-balance text-inv-ink uppercase">
                    {item.title}
                  </h3>
                  {hasText(item.description) && (
                    <p className="mt-2 mb-0 text-[13.5px] leading-relaxed text-pretty text-inv-ink-soft">
                      {item.description}
                    </p>
                  )}
                </div>

                {sticker !== null && (
                  <DesignAsset
                    asset={STICKERS[sticker]}
                    rotate={STICKER_TILTS[sticker]}
                    className="pointer-events-none absolute top-5 -right-5 w-14 drop-shadow-sm sm:-right-24 sm:w-20"
                  />
                )}
              </li>
            );
          })}
        </ol>

        {hasText(content.note) && <BlockNote note={content.note} className="mt-12 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
