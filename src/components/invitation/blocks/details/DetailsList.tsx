import clsx from 'clsx';
import { BlockHeading } from '../../shared/BlockHeading';
import { IconBadge } from '../../shared/IconBadge';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { TextLink } from '../../shared/TextLink';
import type { DetailsVariantProps } from './details-variant';

/**
 * `details.list` — los detalles en una columna, separados por filetes.
 *
 * Es la variante de leer, no la de ojear. En una columna estrecha el ojo baja en línea recta y
 * compara los rótulos sin saltar de una caja a otra, así que es la que conviene cuando los
 * detalles llevan explicación de verdad —«etiqueta rigurosa, evitar el blanco»— y no dos
 * palabras.
 *
 * También es la única de las cuatro que se ve igual de bien con dos detalles que con ocho: una
 * rejilla con dos elementos deja media fila vacía, una lista de dos es simplemente corta.
 *
 * ## Con fotografía
 *
 * La sección pasa a dos columnas y la foto ocupa la izquierda, en vertical y anclada mientras
 * se recorre la lista. Es el cambio de forma más grande de las cuatro variantes, y es el que
 * corresponde: una lista estrecha centrada en una pantalla ancha deja dos franjas de aire a los
 * lados que una fotografía llena mejor que nada. Sin foto, vuelve a una sola columna acotada
 * para que la línea no se pase de setenta caracteres.
 *
 * Los filetes van con `divide-y` y no con un borde por elemento para no acabar con una raya
 * suelta al final de la lista — el detalle que hace que una sección parezca cortada a medias.
 */
export function DetailsList({ content }: DetailsVariantProps) {
  return (
    <BlockSection block="details" variant="list">
      <BlockContainer className={clsx(!content.image && 'max-w-3xl')}>
        <div
          className={clsx(
            content.image && 'grid gap-10 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-14',
          )}
        >
          {content.image && (
            <figure className="relative isolate m-0 aspect-[4/5] w-full overflow-hidden rounded-inv-lg shadow-inv-soft md:sticky md:top-16 md:self-start">
              <BlockImage image={content.image} sizes="(min-width: 768px) 42vw, 100vw" />
            </figure>
          )}

          <div>
            <BlockHeading
              eyebrow={content.eyebrow}
              title={content.title}
              subtitle={content.subtitle}
            />

            <ul className="mt-10 grid list-none divide-y divide-inv-line border-y border-inv-line p-0">
              {content.items.map((item, index) => (
                // El índice como clave es correcto aquí: los detalles no se reordenan ni se
                // insertan en caliente, se renderizan una vez desde contenido guardado.
                <li key={index} className="flex items-start gap-5 py-6">
                  <IconBadge icon={item.icon} />

                  <div className="min-w-0">
                    <h3 className="m-0 font-inv-display text-[1.3rem] leading-tight font-normal text-inv-primary">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="mt-1.5 mb-0 text-[14.5px] leading-relaxed text-inv-ink-soft">
                        {item.description}
                      </p>
                    )}

                    {item.action && <TextLink action={item.action} className="mt-3" />}
                  </div>
                </li>
              ))}
            </ul>

            {content.note && <BlockNote note={content.note} className="mt-8" />}
          </div>
        </div>
      </BlockContainer>
    </BlockSection>
  );
}
