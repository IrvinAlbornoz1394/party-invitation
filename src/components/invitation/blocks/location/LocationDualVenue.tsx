import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { VenueFacts, VenueMedia, type LocationVariantProps } from './location-parts';

/**
 * `location.dual-venue` — las dos sedes, una al lado de la otra.
 *
 * Es la de **comparar**: dos tarjetas iguales, con la misma foto arriba y los mismos datos
 * debajo, para poder mirar «templo» y «salón» a la vez y entender de un vistazo dónde es cada
 * cosa y a qué hora. Esa simetría es toda su razón de ser, y por eso las dos columnas son
 * idénticas: en cuanto una destaca sobre la otra deja de ser una comparación y pasa a ser una
 * jerarquía que nadie pidió.
 *
 * En móvil se apilan, con la ceremonia arriba. El orden de lectura es el del contenido, que es
 * el del día.
 *
 * Con una sola sede queda una tarjeta a media anchura, centrada: correcto, aunque para eso las
 * tres del grupo de una sede aprovechan mejor la pantalla.
 */
export function LocationDualVenue({ content }: LocationVariantProps) {
  return (
    <BlockSection block="location" variant="dual-venue">
      <BlockContainer>
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2 sm:gap-8">
          {content.venues.map((venue, index) => (
            // El índice como clave es correcto aquí: las sedes no se reordenan ni se insertan en
            // caliente, se renderizan una vez desde contenido guardado.
            <article
              key={index}
              className="flex flex-col overflow-hidden rounded-inv-lg border border-inv-line bg-inv-surface"
            >
              <VenueMedia
                venue={venue}
                className="aspect-[4/3] w-full"
                sizes="(min-width: 640px) 50vw, 100vw"
                priority={index === 0}
              />

              {/* `flex-1` en el cuerpo: con direcciones de distinto largo, las dos tarjetas
                  acaban a la misma altura y el filete inferior no queda escalonado. */}
              <div className="flex-1 px-6 py-8">
                <VenueFacts venue={venue} />
              </div>
            </article>
          ))}
        </div>

        {content.note && <BlockNote note={content.note} className="mt-10 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
