import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { VenueFacts, VenueMedia, type LocationVariantProps } from './location-parts';

/**
 * `location.single-split` — la foto a un lado y los datos al otro.
 *
 * Pensada para **una sede**, y es la que conviene cuando la dirección importa tanto como el
 * sitio: al apoyarse en el papel del tema, la dirección se lee con el contraste que el tema
 * garantiza, sin depender de qué fotografía suba el cliente. Es la diferencia con
 * `location.single`, donde el texto va encima de la imagen.
 *
 * La foto va en vertical (3:4). No es un capricho de encuadre: es la proporción con la que sale
 * la foto de una fachada o de un salón hecha con el móvil, que es como llega el material.
 *
 * Con dos sedes se apilan con la misma disposición —foto siempre al mismo lado— para que las
 * dos se comparen columna a columna. La que alterna el lado es `location.dual-stacked`, y
 * alterna a propósito; hacerlo aquí también dejaría a las dos haciendo lo mismo.
 */
export function LocationSingleSplit({ content }: LocationVariantProps) {
  return (
    <BlockSection block="location" variant="single-split">
      <BlockContainer>
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />

        <div className="mt-14 grid gap-14">
          {content.venues.map((venue, index) => (
            // El índice como clave es correcto aquí: las sedes no se reordenan ni se insertan en
            // caliente, se renderizan una vez desde contenido guardado.
            <div key={index} className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
              <VenueMedia
                venue={venue}
                className="aspect-[3/4] w-full rounded-inv-lg shadow-inv-soft"
                sizes="(min-width: 768px) 50vw, 100vw"
                priority={index === 0}
              />

              <VenueFacts venue={venue} emphasis="hero" />
            </div>
          ))}
        </div>

        {content.note && <BlockNote note={content.note} className="mt-14 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
