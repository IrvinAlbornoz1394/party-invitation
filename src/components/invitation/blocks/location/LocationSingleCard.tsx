import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { IconBadge } from '../../shared/IconBadge';
import { VenueFacts, VenueMedia, type LocationVariantProps } from './location-parts';
import { venueIcon } from './venue-icon';

/**
 * `location.single-card` — la sede como una tarjeta sobria, centrada.
 *
 * Pensada para **una sede**, y es la de las invitaciones formales: sin foto a sangre ni
 * columnas, solo una tarjeta con filete, el medallón del tipo de sede y los datos centrados.
 * Es la que conviene cuando no hay una fotografía que merezca la pantalla —el caso más común— y
 * la que mejor envejece: un salón que se ve mal en foto no se ve mal aquí.
 *
 * Es también la única de las seis en la que la fotografía es **opcional de verdad**: cuando
 * está, entra como banda apaisada dentro de la tarjeta; cuando no, queda el medallón, que es lo
 * que la tarjeta llevaba de todos modos. No hay hueco que rellenar ni composición que cambie.
 *
 * Con dos sedes, dos tarjetas apiladas y centradas. Es legible, pero si el evento tiene dos
 * sitios lo que se quiere casi siempre es compararlos de un vistazo, y para eso está
 * `location.dual-venue`.
 */
export function LocationSingleCard({ content }: LocationVariantProps) {
  return (
    <BlockSection block="location" variant="single-card">
      <BlockContainer className="max-w-3xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />

        <div className="mt-12 grid gap-8">
          {content.venues.map((venue, index) => (
            // El índice como clave es correcto aquí: las sedes no se reordenan ni se insertan en
            // caliente, se renderizan una vez desde contenido guardado.
            <article
              key={index}
              className="overflow-hidden rounded-inv-lg border border-inv-line bg-inv-surface"
            >
              {venue.image && (
                <VenueMedia
                  venue={venue}
                  className="aspect-[21/9] w-full"
                  sizes="(min-width: 768px) 720px, 100vw"
                  priority={index === 0}
                />
              )}

              <div className="flex flex-col items-center px-6 py-10 sm:px-12">
                {/* El medallón solo cuando no hay foto: con banda arriba, además del icono, la
                    tarjeta acumula dos elementos gráficos que compiten por el mismo papel. */}
                {!venue.image && <IconBadge icon={venueIcon(venue.kind)} size="lg" className="mb-6" />}

                <VenueFacts venue={venue} align="center" />
              </div>
            </article>
          ))}
        </div>

        {content.note && <BlockNote note={content.note} className="mt-10 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
