import { BlockHeading } from '../../shared/BlockHeading';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { VenueFacts, type LocationVariantProps } from './location-parts';

/**
 * `location.single` — la sede a sangre, con los datos encima.
 *
 * Pensada para **una sola sede**, y es la más vistosa de las seis: la fotografía del lugar
 * ocupa el ancho completo de la pantalla y el nombre, la hora y la dirección van centrados
 * encima. Es la que convierte «dónde es» en una imagen del sitio, que es lo que un invitado
 * quiere ver de una boda en hacienda o de un salón bonito.
 *
 * Con más de una sede se apilan las bandas, una debajo de otra. No es su mejor uso —para eso
 * están las tres del grupo de dos sedes— pero no se pierde nada ni se rompe la maqueta: la
 * segunda banda se lee como la primera.
 *
 * ## Sin fotografía
 *
 * La banda se pinta con el color principal del tema y los datos en `onPrimary`. Es la misma
 * composición y sigue siendo vistosa: una franja de color a ancho completo es un recurso de
 * invitación impresa, no un hueco donde debería haber una foto.
 *
 * El velo lo pone el tema (`overlay`), así que un tema claro puede velar con marfil en lugar de
 * con negro. Y es imprescindible: encima de una foto que sube el cliente, sin él, el contraste
 * del texto no está garantizado en ninguna parte.
 */
export function LocationSingle({ content }: LocationVariantProps) {
  return (
    <BlockSection block="location" variant="single" className="py-0">
      <BlockContainer className="py-20 sm:py-28">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />
      </BlockContainer>

      {content.venues.map((venue, index) => (
        // El índice como clave es correcto aquí: las sedes no se reordenan ni se insertan en
        // caliente, se renderizan una vez desde contenido guardado.
        <div
          key={index}
          /* Alto fluido en lugar de 30rem fijos: en un móvil apaisado, 480px de mínimo dejaban la banda
             más alta que la propia pantalla y el siguiente bloque no asomaba. */
          className="relative isolate inv-on-photo flex min-h-[clamp(22rem,62svh,34rem)] items-center justify-center overflow-hidden px-6 py-16 sm:px-10 sm:py-24"
        >
          {venue.image ? (
            <>
              <BlockImage image={venue.image} className="-z-20" sizes="100vw" />
              <div aria-hidden="true" className="absolute inset-0 -z-10 inv-scrim" data-from="center" />
            </>
          ) : (
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-inv-primary" />
          )}

          <VenueFacts venue={venue} tone="onImage" align="center" emphasis="hero" />
        </div>
      ))}

      {content.note && (
        <BlockContainer className="py-12">
          <BlockNote note={content.note} className="text-center" />
        </BlockContainer>
      )}
    </BlockSection>
  );
}
