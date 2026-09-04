import { BlockHeading } from '../../shared/BlockHeading';
import { blockIconComponent } from '../../shared/block-icons';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { TextLink } from '../../shared/TextLink';
import type { DetailsVariantProps } from './details-variant';

/**
 * `details.notes` — los detalles como notas: el icono suelto al margen, el rótulo en el color de
 * acento y el texto debajo. Sin medallón, sin filete y sin tarjeta.
 *
 * Es la séptima variante del bloque y la única **sin ninguna pieza gráfica**. Las otras seis
 * encierran el dato de alguna manera —tarjeta, filete, franja de color, retícula contra un filete
 * central, ficha con placa— y esta lo deja al aire: un dibujo de trazo de dieciocho píxeles, un
 * rótulo y un párrafo, separados del siguiente por blanco.
 *
 *   `cards`    rejilla de tarjetas, medallón redondo arriba.
 *   `list`     columna con filetes entre datos.
 *   `split`    encabezado anclado a un lado, datos al otro.
 *   `panel`    franja del color principal a ancho completo.
 *   `program`  dos columnas contra un filete central.
 *   `stack`    fichas apiladas con placa cuadrada.
 *   `notes`    **nada: icono, rótulo y texto sobre el papel.**
 *
 * Que el icono no vaya en `IconBadge` es la decisión concreta. Ese componente dibuja un disco de
 * fondo translúcido, y en una estructura sin una sola caja el disco sería la primera forma
 * geométrica de la invitación. Suelto y en el color de acento, el icono se lee como la viñeta de
 * un margen impreso.
 *
 * ## El rótulo va en acento y el cuerpo en gris
 *
 * Al revés que en las otras seis, donde el rótulo va en `primary` y el acento se reserva para
 * medallones y filetes. Aquí no hay medallones ni filetes que teñir, así que el acento se gasta
 * donde vale para algo: distinguir el nombre del dato de su explicación. Es exactamente lo que
 * hace la referencia, donde «Цветы» y «Что подарить?» son lo único que no es negro ni gris.
 */
export function DetailsNotes({ content }: DetailsVariantProps) {
  return (
    <BlockSection block="details" variant="notes">
      <BlockContainer className="max-w-lg">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleFont="script"
        />

        {content.image && (
          <figure className="relative isolate m-0 mt-10 aspect-[3/2] w-full overflow-hidden rounded-inv-lg">
            <BlockImage image={content.image} sizes="(min-width: 640px) 512px, 100vw" />
          </figure>
        )}

        {/*
          `gap-9` y no un filete entre notas: el blanco es el separador de esta estructura. Con
          seis detalles la sección se hace larga, y es correcto — son notas al margen que se leen
          de una en una, no una tabla que se abarca de un vistazo.
        */}
        <ul className="mt-10 grid list-none gap-9 p-0">
          {content.items.map((item, index) => {
            const Icon = blockIconComponent(item.icon);

            return (
              // El índice como clave es correcto aquí: los detalles no se reordenan ni se insertan
              // en caliente, se renderizan una vez desde contenido guardado.
              <li key={index} className="flex items-start gap-4">
                {/* `mt-0.5`: el icono se alinea con la línea base del rótulo, no con el borde de
                    la caja. Sin ese pelo se queda flotando por encima de la primera letra. */}
                <Icon
                  size={18}
                  strokeWidth={1.4}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-inv-accent"
                />

                <div className="min-w-0">
                  <h3 className="m-0 text-[13.5px] leading-snug font-medium text-inv-accent">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="mt-2 mb-0 text-[13.5px] leading-relaxed text-inv-ink-soft">
                      {item.description}
                    </p>
                  )}

                  {item.action && <TextLink action={item.action} className="mt-3" />}
                </div>
              </li>
            );
          })}
        </ul>

        {content.note && <BlockNote note={content.note} className="mt-10 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
