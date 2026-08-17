import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { IconBadge } from '../../shared/IconBadge';
import { VenueFacts, VenueMedia, type LocationVariantProps } from './location-parts';
import { venueIcon } from './venue-icon';

/**
 * `location.single-plate` — la fotografía a sangre como lámina, y la ficha del lugar debajo.
 *
 * Pensada para **una sede**. La foto cruza la pantalla de canto a canto y sin recuadro —una
 * lámina pegada en la página, no una tarjeta— y debajo, sobre el papel, la ficha centrada: el
 * medallón del tipo de sede, el nombre en versalitas espaciadas, la dirección escrita y el botón
 * del mapa.
 *
 * ## En qué se diferencia de las otras cinco
 *
 * `location.single` pone los datos **encima** de la foto y necesita velarla; `single-split` la
 * pone al lado y depende de que haya ancho; `single-card` la mete dentro de una tarjeta con
 * filete. Esta las separa: la foto ocupa su franja entera y los datos la suya. Es la que mejor
 * funciona en un móvil —donde una foto a sangre es lo único que se ve completo— y la que mejor
 * aguanta una foto mediocre del salón, porque no hay texto encima que dependa de su contraste.
 *
 * ## El botón es un botón, no un enlace discreto
 *
 * `emphasis="hero"` hace que `VenueFacts` pinte el mapa como botón sólido. Es **la** acción de
 * esta sección, la que alguien busca con el coche en marcha, y ahí un enlace subrayado es un
 * blanco demasiado pequeño para el pulgar.
 *
 * ## El encabezado va arriba, antes de la lámina, y en pequeño
 *
 * En versalitas y a cuerpo bajo, que es lo que evita que el rótulo del bloque —«Dónde nos vemos»—
 * compita con el nombre del lugar, tres líneas más abajo y diciendo casi lo mismo con más
 * autoridad. Lo que **no** se hace es esconderlo cuando parece redundante: la regla de la
 * biblioteca es que ninguna variante se guarda contenido que el evento trae, y un título que
 * aparece o no según lo que haya en otros campos es exactamente el tipo de sorpresa que hace
 * desconfiar del panel.
 *
 * ## Con dos o tres sedes
 *
 * Se repite la pareja lámina + ficha, separadas por un filete. Es legible y no pierde nada —la
 * regla de la biblioteca: cambiar de componente nunca esconde contenido—, pero si el evento tiene
 * dos sitios lo que casi siempre se quiere es compararlos de un vistazo, y para eso están las tres
 * variantes `dual-*`.
 */
export function LocationSinglePlate({ content }: LocationVariantProps) {
  return (
    <BlockSection block="location" variant="single-plate">
      <BlockContainer className="max-w-2xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleCase="caps"
          className="mb-10"
        />
      </BlockContainer>

      <div className="grid gap-14">
        {content.venues.map((venue, index) => (
          // El índice como clave es correcto aquí: las sedes no se reordenan ni se insertan en
          // caliente, se renderizan una vez desde contenido guardado.
          <article key={index}>
            {/*
              A sangre: la lámina se sale del contenedor de texto a propósito, así que va fuera de
              `BlockContainer`. La proporción es apaisada y distinta en móvil y en escritorio —16/10
              contra 21/9—: en un móvil, una franja de 21/9 mide ciento cincuenta píxeles de alto y
              no se ve el lugar, solo una tira.
            */}
            <VenueMedia
              venue={venue}
              className="aspect-[16/10] w-full sm:aspect-[21/9]"
              sizes="100vw"
              /* Solo la primera se descarga con prioridad, y solo si es la primera sede: si todo es
                 prioritario, nada lo es. */
              priority={index === 0}
            />

            <BlockContainer className="max-w-xl">
              <div className="flex flex-col items-center pt-10 text-center">
                <IconBadge icon={venueIcon(venue.kind)} className="mb-6" />

                <VenueFacts venue={venue} align="center" emphasis="hero" nameCase="caps" />
              </div>
            </BlockContainer>
          </article>
        ))}
      </div>

      {content.note && (
        <BlockContainer className="max-w-xl">
          <BlockNote note={content.note} className="mt-12 text-center" />
        </BlockContainer>
      )}
    </BlockSection>
  );
}
