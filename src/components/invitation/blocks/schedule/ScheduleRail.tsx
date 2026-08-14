import clsx from 'clsx';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { ScheduleMarker, ScheduleTime } from './schedule-parts';
import type { ScheduleVariantProps } from './schedule-variant';

/**
 * `schedule.horizontal` — el programa como una cinta que se recorre de lado.
 *
 * Es el opuesto de la línea vertical: el día no baja, avanza. Los momentos cuelgan de un filete
 * horizontal, cada uno con su marca encima, como el programa de una ceremonia impreso a lo
 * ancho de la hoja.
 *
 * ## El arrastre en móvil, y por qué no es un carrusel
 *
 * No hay JavaScript, ni flechas, ni puntos de paginación: es desplazamiento nativo con `snap-x`,
 * que engancha cada momento al llegar. Un carrusel programado añadiría estado, teclado que
 * gestionar y una animación que puede quedarse a medias; el desplazamiento del navegador ya
 * funciona con dedo, rueda, teclado y lector de pantalla, y en una invitación que se abre en un
 * móvil de gama baja eso es exactamente lo que se quiere.
 *
 * Se ven tres cuartos de la tarjeta siguiente a propósito (`w-[76%]`). Es la señal de que hay
 * más a la derecha: con las tarjetas a ancho completo, el invitado no tiene forma de saber que
 * el cronograma sigue.
 *
 * El filete es continuo en escritorio —una columna al lado de otra— y por eso la cinta se lee
 * como un recorrido y no como tarjetas sueltas. En móvil se corta con cada tarjeta, que es lo
 * correcto: ahí los momentos se ven de uno en uno y una raya que sale por el borde sugeriría
 * que se puede seguir hacia atrás.
 */
export function ScheduleRail({ content }: ScheduleVariantProps) {
  const withIcons = content.marker === 'icon';

  return (
    <BlockSection block="schedule" variant="horizontal">
      <BlockContainer>
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
        />

        {/*
          El desbordamiento se saca del contenedor con márgenes negativos para que las tarjetas
          lleguen al canto de la pantalla en móvil. Cortadas por el borde del contenedor, el
          carrusel parece una caja con contenido escondido en vez de una cinta que sigue.
        */}
        <ol className="-mx-6 mt-14 flex snap-x snap-mandatory list-none gap-6 overflow-x-auto px-6 pb-5 sm:-mx-10 sm:px-10 lg:mx-0 lg:grid lg:grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] lg:gap-8 lg:overflow-visible lg:px-0 lg:pb-0">
          {content.items.map((item, index) => (
            // El índice como clave es correcto aquí: los hitos no se reordenan ni se insertan
            // en caliente, se renderizan una vez desde contenido guardado.
            <li
              key={index}
              className={clsx(
                'relative w-[76%] max-w-xs shrink-0 snap-start border-t border-inv-line',
                withIcons ? 'pt-9' : 'pt-7',
                'lg:w-auto lg:max-w-none',
              )}
            >
              <ScheduleMarker
                icon={item.icon}
                marker={content.marker}
                className="absolute top-0 left-0 -translate-y-1/2"
              />

              <ScheduleTime timeLabel={item.timeLabel} className="text-[1.15rem]" />

              <h3 className="mt-2 mb-0 font-inv-display text-[1.3rem] leading-tight font-normal text-inv-primary">
                {item.title}
              </h3>

              {item.description && (
                <p className="mt-2 mb-0 text-[14px] leading-relaxed text-inv-ink-soft">
                  {item.description}
                </p>
              )}
            </li>
          ))}
        </ol>

        {content.note && <BlockNote note={content.note} className="mt-8" />}
      </BlockContainer>
    </BlockSection>
  );
}
