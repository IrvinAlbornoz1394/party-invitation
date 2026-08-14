import clsx from 'clsx';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { VenueFacts, VenueMedia, type LocationVariantProps } from './location-parts';

/**
 * `location.dual-stacked` — las sedes en franjas alternas a ancho completo.
 *
 * Pensada para **dos sedes**, y es la más generosa: cada una ocupa su propia franja de la
 * pantalla, con la foto pegada a un canto y los datos al otro, y el lado se invierte en la
 * siguiente. Ese cambio de lado es lo que evita que dos sedes seguidas se lean como una
 * plantilla repetida — el mismo recurso que la historia a dos columnas, aquí con un propósito
 * distinto: separar dos sitios que no hay que confundir.
 *
 * La foto llega al borde de la pantalla y no al del contenedor. Es lo que da la sensación de
 * franja; recortada en el margen del texto, la sección se vería como dos tarjetas grandes.
 *
 * ## Sin fotografía
 *
 * La mitad de la imagen se convierte en un panel con el medallón de la sede sobre un tinte del
 * color principal, así que la franja mantiene su forma y su ritmo. Es el mismo criterio del
 * cronograma: donde la imagen es estructura, el hueco existe siempre y lo llena el icono.
 */
export function LocationDualStacked({ content }: LocationVariantProps) {
  return (
    <BlockSection block="location" variant="dual-stacked">
      <BlockContainer>
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />
      </BlockContainer>

      <div className="mt-14 grid gap-14 md:gap-20">
        {content.venues.map((venue, index) => {
          const mirrored = index % 2 === 1;

          return (
            // El índice como clave es correcto aquí: las sedes no se reordenan ni se insertan en
            // caliente, se renderizan una vez desde contenido guardado.
            <div key={index} className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
              <VenueMedia
                venue={venue}
                className={clsx(
                  'aspect-[4/3] w-full md:aspect-[5/4]',
                  mirrored && 'md:order-2',
                )}
                sizes="(min-width: 768px) 50vw, 100vw"
                priority={index === 0}
              />

              {/*
                El texto sí respeta el margen del contenedor aunque la foto no lo haga: pegado
                al canto de la pantalla se leería incómodo, y en un móvil quedaría cortado por
                el radio del propio dispositivo.
              */}
              <div className={clsx('px-6 sm:px-10', mirrored ? 'md:order-1 md:pr-4 md:pl-12' : 'md:pr-12 md:pl-4')}>
                <VenueFacts venue={venue} emphasis="hero" />
              </div>
            </div>
          );
        })}
      </div>

      {content.note && (
        <BlockContainer>
          <BlockNote note={content.note} className="mt-14 text-center" />
        </BlockContainer>
      )}
    </BlockSection>
  );
}
