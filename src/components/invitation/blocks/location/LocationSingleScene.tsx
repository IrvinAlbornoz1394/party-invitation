import { BlockHeading } from '../../shared/BlockHeading';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { SetTable } from '../../shared/doodle-ornaments';
import { VenueFacts, type LocationVariantProps } from './location-parts';

/**
 * `location.single-scene` — la sede contada con un dibujo: la escena de la mesa puesta a un lado
 * y los datos al otro, con la fotografía debajo si la hay.
 *
 * Es el noveno componente de ubicación y el único donde **la ilustración es la pieza principal y
 * la fotografía es opcional de verdad**. En los otros ocho, quitar la foto deja un medallón con
 * un icono en su hueco (ver `VenueMedia`): un parche correcto, pero un parche. Aquí no hay hueco
 * que tapar, porque lo que ilustra la sección es el dibujo, y la foto —cuando llega— entra
 * **debajo**, como el añadido que es.
 *
 * Eso importa más de lo que parece: la sede es de los últimos datos que un cliente reúne, y una
 * plantilla ilustrada tiene que verse terminada durante las semanas en que esa foto no existe.
 *
 * ## Por qué una mesa puesta y no un plano ni un edificio
 *
 * Un alfiler de mapa o una fachada dicen «dirección», y para eso ya están la calle escrita y el
 * enlace. Lo que esta sección cuenta es **dónde se celebra**, y una mesa vestida con su jarrón lo
 * dice en un dibujo. Es el mismo criterio por el que el catálogo no incrusta un mapa: la
 * dirección se lee, se copia y se le dicta al taxista; el mapa lo abre la aplicación que el
 * invitado ya tiene.
 *
 * ## Varias sedes se apilan
 *
 * Como en las otras «single»: el nombre es un consejo y el componente pinta todas las que traiga
 * el evento. El dibujo, en cambio, se pinta **una vez** y no por sede: repetir la misma
 * ilustración tres veces en una columna la convierte en un patrón de fondo.
 */
export function LocationSingleScene({ content }: LocationVariantProps) {
  return (
    <BlockSection block="location" variant="single-scene">
      <BlockContainer className="max-w-3xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleFill="outline"
          titleCase="caps"
        />

        <div className="mt-12 grid items-center gap-10 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:gap-14">
          <SetTable className="mx-auto w-52 text-inv-primary sm:w-full sm:max-w-[15rem]" />

          <div className="grid gap-12">
            {content.venues.map((venue, index) => (
              // El índice como clave es correcto aquí: las sedes no se reordenan ni se insertan en
              // caliente, se renderizan una vez desde contenido guardado.
              <VenueFacts key={index} venue={venue} emphasis="hero" />
            ))}
          </div>
        </div>

        {/* La fotografía de la primera sede, debajo y a lo ancho. Va aquí y no en la columna de
            datos porque en esta plantilla la ilustración manda: una foto al lado del dibujo
            harían dos imágenes discutiendo por el mismo papel. */}
        {content.venues[0]?.image && (
          <figure className="relative isolate m-0 mt-12 aspect-[21/9] w-full overflow-hidden rounded-inv-lg">
            <BlockImage image={content.venues[0].image} sizes="(min-width: 768px) 768px, 100vw" />
          </figure>
        )}

        {content.note && <BlockNote note={content.note} className="mt-10 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
