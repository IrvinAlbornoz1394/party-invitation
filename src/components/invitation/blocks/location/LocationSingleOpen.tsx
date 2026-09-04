import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { VenueFacts, VenueMedia, type LocationVariantProps } from './location-parts';

/**
 * `location.single-open` — la sede al aire: la fotografía suelta sobre el papel, los datos
 * centrados debajo y nada que los encierre.
 *
 * Es el octavo componente de ubicación y el cuarto pensado para una sede. La comparación que
 * importa es con `single-card`, que también centra una sede:
 *
 *   `single-card`  todo dentro de una **tarjeta**: filete alrededor, fondo de `surface` y la foto
 *                  como banda superior pegada a los cantos. La sede es un objeto sobre la página.
 *   `single-open`  no hay tarjeta. La imagen es un rectángulo que flota con el radio del tema y
 *                  los datos caen debajo, sobre el papel. La sede **es** la página.
 *
 * Es la misma distinción que separa a `calendar.sheet` de `calendar.month` en esta estructura, y
 * responde a lo mismo: aquí no hay ni una caja en toda la invitación, y meter la única sección
 * con marco justo donde va el mapa la convertiría en un aparato incrustado — que es exactamente
 * la estética que `docs/COMPONENTES.md` rechaza cuando explica por qué no se empotra Google Maps.
 *
 * ## Los datos van con `emphasis="hero"`, y eso trae el botón
 *
 * `VenueFacts` decide con ese ajuste dos cosas: el nombre de la sede crece, y el enlace al mapa
 * se compone como **botón** en vez de como enlace de texto. Las dos son correctas aquí. Sin
 * tarjeta que lo sostenga, un enlace subrayado al pie de una columna centrada se pierde; y la
 * referencia remata cada sede exactamente así, con un botón bajo el plano.
 *
 * ## Varias sedes se apilan, no se reparten
 *
 * Como en las otras tres «single»: el nombre es un consejo, no una restricción, y el componente
 * pinta todas las sedes que traiga el evento. Aquí se apilan con mucho aire entre ellas —no hay
 * filete que las separe— y cada una repite foto, datos y botón. Con dos sedes se lee como dos
 * páginas seguidas, que es peor que compararlas de un vistazo pero nunca esconde una.
 */
export function LocationSingleOpen({ content }: LocationVariantProps) {
  return (
    <BlockSection block="location" variant="single-open">
      <BlockContainer className="max-w-lg">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleFont="script"
        />

        <div className="mt-10 grid gap-16">
          {content.venues.map((venue, index) => (
            // El índice como clave es correcto aquí: las sedes no se reordenan ni se insertan en
            // caliente, se renderizan una vez desde contenido guardado.
            <article key={index} className="flex flex-col items-center">
              {/*
                La foto con el radio del tema y sin marco. `aspect-[5/3]`: en la referencia el
                plano de situación es apaisado y corto, no una banda panorámica — una franja de
                21:9 en medio de una columna estrecha se lee como una cabecera de sección.
              */}
              <VenueMedia
                venue={venue}
                className="aspect-[5/3] w-full rounded-inv-lg"
                sizes="(min-width: 640px) 512px, 100vw"
                priority={index === 0}
              />

              <VenueFacts venue={venue} align="center" emphasis="hero" className="mt-8" />
            </article>
          ))}
        </div>

        {content.note && <BlockNote note={content.note} className="mt-12 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
