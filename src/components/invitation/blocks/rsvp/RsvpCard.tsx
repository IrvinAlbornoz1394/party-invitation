import { BlockHeading } from '../../shared/BlockHeading';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { RsvpAction, RsvpDeadline, type RsvpVariantProps } from './rsvp-parts';

/**
 * `rsvp.card` — la confirmación en una tarjeta centrada.
 *
 * Es la sobria y la que conviene por defecto: una tarjeta con filete, la petición en dos líneas,
 * la fecha límite y el botón. Nada compite con él.
 *
 * Que sea la más discreta de las tres no la hace la más débil. En una invitación que ya venía
 * con una portada a sangre y una galería, el bloque que **pide algo** destaca por ser el único
 * que tiene un botón, no por gritar más que los demás.
 *
 * ## Con fotografía
 *
 * Entra como banda apaisada en la parte de arriba de la tarjeta, no de fondo. Detrás del texto
 * obligaría a velar la imagen y a pasar todo a tinta clara, y entonces esta variante sería la
 * misma que `rsvp.panel` — que es justo la que existe para eso.
 */
export function RsvpCard({ content }: RsvpVariantProps) {
  return (
    <BlockSection block="rsvp" variant="card">
      <BlockContainer className="max-w-2xl">
        <article className="overflow-hidden rounded-inv-lg border border-inv-line bg-inv-surface">
          {content.image && (
            <figure className="relative isolate m-0 aspect-[21/9] w-full overflow-hidden">
              <BlockImage image={content.image} sizes="(min-width: 768px) 672px, 100vw" />
            </figure>
          )}

          <div className="flex flex-col items-center px-6 py-12 text-center sm:px-12">
            <BlockHeading
              eyebrow={content.eyebrow}
              title={content.title}
              subtitle={content.subtitle}
              align="center"
            />

            {content.deadlineLabel && (
              <RsvpDeadline deadlineLabel={content.deadlineLabel} className="mt-8" />
            )}

            <RsvpAction content={content} align="center" className="mt-9" />
          </div>
        </article>

        {content.note && <BlockNote note={content.note} className="mt-8 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
