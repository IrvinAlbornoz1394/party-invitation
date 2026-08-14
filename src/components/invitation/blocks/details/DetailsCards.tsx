import { BlockHeading } from '../../shared/BlockHeading';
import { IconBadge } from '../../shared/IconBadge';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { TextLink } from '../../shared/TextLink';
import type { DetailsVariantProps } from './details-variant';

/**
 * `details.cards` — cada detalle en su tarjeta, en rejilla.
 *
 * Es la variante por defecto y la que mejor aguanta detalles desiguales: uno con dos líneas de
 * explicación y otro con solo el título quedan igual de bien porque cada uno tiene su caja. En
 * una lista, esa diferencia de longitud se nota como un ritmo roto.
 *
 * La rejilla es `auto-fit` y no un número fijo de columnas. Con tres detalles se reparten en
 * tres; con cinco no queda un hueco a la derecha de la segunda fila, que es como se ve una
 * rejilla de cuatro columnas mal llena.
 *
 * ## Con fotografía
 *
 * La foto entra como banda panorámica entre el encabezado y las tarjetas. Ahí hace de
 * separador —marca dónde acaba la presentación y empiezan los datos— y no compite con la
 * rejilla, que es lo que pasaría si fuera de fondo. Sin ella, el encabezado y las tarjetas se
 * juntan un poco más y no queda ningún hueco: la sección simplemente es más corta.
 */
export function DetailsCards({ content }: DetailsVariantProps) {
  return (
    <BlockSection block="details" variant="cards">
      <BlockContainer>
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />

        {content.image && (
          <figure className="relative isolate m-0 mt-12 aspect-[21/9] w-full overflow-hidden rounded-inv-lg shadow-inv-soft">
            <BlockImage image={content.image} sizes="(min-width: 1120px) 1024px, 100vw" />
          </figure>
        )}

        <ul className="mx-auto mt-10 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-5 p-0">
          {content.items.map((item, index) => (
            // El índice como clave es correcto aquí: los detalles no se reordenan ni se
            // insertan en caliente, se renderizan una vez desde contenido guardado.
            <li key={index} className="rounded-inv-lg border border-inv-line bg-inv-surface p-6">
              <IconBadge icon={item.icon} />

              <h3 className="mt-5 mb-0 font-inv-display text-[1.35rem] leading-tight font-normal text-inv-primary">
                {item.title}
              </h3>

              {item.description && (
                <p className="mt-2 mb-0 text-[14.5px] leading-relaxed text-inv-ink-soft">
                  {item.description}
                </p>
              )}

              {item.action && <TextLink action={item.action} className="mt-3" />}
            </li>
          ))}
        </ul>

        {content.note && <BlockNote note={content.note} className="mt-10 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
