import { BlockHeading } from '../../shared/BlockHeading';
import { IconBadge } from '../../shared/IconBadge';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { TextLink } from '../../shared/TextLink';
import type { DetailsVariantProps } from './details-variant';

/**
 * `details.split` — el encabezado a un lado y los detalles al otro.
 *
 * Es la variante para invitaciones con muchos detalles. Con seis u ocho, un encabezado
 * centrado arriba queda tan lejos del último elemento que deja de contextualizarlo; aquí se
 * queda a la vista mientras se recorre la lista, porque en escritorio se ancla con `sticky`.
 *
 * En móvil no hay dos lados ni anclaje: el encabezado va arriba y los detalles debajo, en una
 * columna. `sticky` solo se activa a partir de tablet, donde hay alto suficiente para que
 * anclar signifique algo.
 *
 * La nota va con el encabezado y no al final de la lista, que es lo que la retícula pide: en
 * la columna de la derecha, colgando de ocho elementos, se leería como un noveno sin icono.
 *
 * ## Con fotografía
 *
 * Entra bajo el encabezado, en la columna anclada, en formato apaisado. Es el sitio que le
 * corresponde: la columna izquierda es la que presenta —quién habla, de qué va esto— y la foto
 * es parte de esa presentación, no un dato más. Sin ella la columna se queda con el encabezado
 * y la nota, que es exactamente para lo que se diseñó.
 */
export function DetailsSplit({ content }: DetailsVariantProps) {
  return (
    <BlockSection block="details" variant="split">
      <BlockContainer>
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] md:gap-16">
          <div className="md:sticky md:top-16 md:self-start">
            <BlockHeading
              eyebrow={content.eyebrow}
              title={content.title}
              subtitle={content.subtitle}
            />

            {content.image && (
              <figure className="relative isolate m-0 mt-8 aspect-[3/2] w-full overflow-hidden rounded-inv-lg shadow-inv-soft">
                <BlockImage image={content.image} sizes="(min-width: 768px) 40vw, 100vw" />
              </figure>
            )}

            {content.note && <BlockNote note={content.note} className="mt-6" />}
          </div>

          <ul className="grid list-none grid-cols-1 gap-x-8 gap-y-8 p-0 sm:grid-cols-2">
            {content.items.map((item, index) => (
              // El índice como clave es correcto aquí: los detalles no se reordenan ni se
              // insertan en caliente, se renderizan una vez desde contenido guardado.
              <li key={index}>
                <IconBadge icon={item.icon} />

                <h3 className="mt-4 mb-0 font-inv-display text-[1.25rem] leading-tight font-normal text-inv-primary">
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
        </div>
      </BlockContainer>
    </BlockSection>
  );
}
