import { Fragment } from 'react';
import { ArrowRight } from 'lucide-react';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { IconBadge } from '../../shared/IconBadge';
import { VenueFacts, type LocationVariantProps } from './location-parts';
import { venueIcon } from './venue-icon';

/**
 * `location.dual-journey` — el recorrido: primero aquí, después allá.
 *
 * Pensada para **dos sedes**, y es la única de las seis que dice algo que las otras no: que hay
 * un **orden**. Entre una sede y la siguiente va un conector con una flecha, así que la sección
 * ya no se lee como «estos son los dos sitios» sino como «se empieza aquí y se sigue allá»,
 * que es la pregunta real de un invitado con dos direcciones y una hora.
 *
 * Por eso no lleva fotografías. Un recorrido se entiende con nombres, horas y una flecha; dos
 * imágenes en medio lo convertirían otra vez en un catálogo de sitios y taparían justo lo que
 * esta composición aporta. Para enseñar los lugares están `dual-venue` y `dual-stacked`.
 *
 * ## El conector
 *
 * Horizontal en escritorio y vertical en móvil, porque la flecha tiene que apuntar hacia donde
 * de verdad continúa la lectura. Una flecha hacia la derecha encima de una columna apilada
 * señala fuera de la pantalla y deja de significar nada.
 *
 * Va marcado como decorativo: el orden ya lo comunica la propia secuencia del texto, y un
 * lector de pantalla anunciando «flecha derecha» entre dos direcciones solo estorba.
 */
export function LocationDualJourney({ content }: LocationVariantProps) {
  return (
    <BlockSection block="location" variant="dual-journey">
      <BlockContainer>
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />

        <div className="mt-14 flex flex-col items-stretch gap-6 md:flex-row md:items-center md:justify-center md:gap-4">
          {content.venues.map((venue, index) => (
            // El índice como clave es correcto aquí: las sedes no se reordenan ni se insertan en
            // caliente, se renderizan una vez desde contenido guardado.
            <Fragment key={index}>
              {index > 0 && (
                <div
                  aria-hidden="true"
                  className="flex shrink-0 items-center justify-center gap-3 text-inv-accent md:flex-col"
                >
                  <span className="h-px w-10 bg-inv-line md:h-10 md:w-px" />
                  <ArrowRight size={20} strokeWidth={1.6} className="rotate-90 md:rotate-0" />
                  <span className="h-px w-10 bg-inv-line md:h-10 md:w-px" />
                </div>
              )}

              <article className="flex flex-1 flex-col items-center rounded-inv-lg border border-inv-line bg-inv-surface px-6 py-10 text-center">
                <IconBadge icon={venueIcon(venue.kind)} size="lg" className="mb-6" />
                <VenueFacts venue={venue} align="center" />
              </article>
            </Fragment>
          ))}
        </div>

        {content.note && <BlockNote note={content.note} className="mt-10 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
