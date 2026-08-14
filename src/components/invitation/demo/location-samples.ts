import { locationContentSchema, type LocationContent } from '@/domain/invitation/blocks/location';
import type { DemoSample } from './sample';

/**
 * Contenido de ejemplo para ver la ubicación sin tener que crear un evento.
 *
 * Mismas claves que el resto de bloques —los mismos tres eventos imaginarios— para poder saltar
 * de la portada a la ubicación sin que cambie el evento debajo.
 *
 * Los tres cubren exactamente los estados que deciden qué componente elegir:
 *
 *   · **Presentación**: dos sedes con fotografía. El caso de las tres del grupo de dos sedes.
 *   · **XV Años**: una sola sede y **sin** fotografía. El caso de las tres del grupo de una, y
 *     la comprobación de que el respaldo del icono sostiene la composición.
 *   · **Boda**: dos sedes, una con foto y otra sin ella. El caso mezclado, que es el que
 *     descuadra las maquetaciones que dan por hecho que las fotos van todas o ninguna.
 *
 * Merece la pena cruzarlos al revés: abrir `location.single` con el ejemplo de dos sedes y
 * `location.dual-venue` con el de una. Ninguno se rompe —esa es la regla de la biblioteca— y
 * ver cómo se degradan es lo que dice si el nombre del componente es un consejo o una trampa.
 */

const unsplash = (id: string, width: number, height: number): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;

export const LOCATION_SAMPLES: readonly DemoSample<LocationContent>[] = [
  {
    key: 'presentacion',
    name: 'Presentación',
    content: locationContentSchema.parse({
      eyebrow: 'Dónde nos vemos',
      title: 'Ubicaciones',
      subtitle: 'Los dos sitios están a diez minutos uno del otro.',
      venues: [
        {
          kind: 'church',
          label: 'Misa de acción de gracias',
          name: 'Templo de Nuestra Señora de Guadalupe',
          address: 'Calle 45 #201 x 26 y 28, Col. Dolores Otero, Mérida, Yucatán',
          detail: 'Te pedimos llegar diez minutos antes para acomodarnos.',
          timeLabel: '12:00',
          mapAction: {
            label: 'Cómo llegar',
            href: 'https://www.google.com/maps/search/?api=1&query=Merida+Yucatan',
          },
          image: {
            url: unsplash('photo-1602631985686-1bb0e6a8696e', 1200, 900),
            alt: 'Fachada del templo decorada para la celebración',
          },
        },
        {
          kind: 'reception',
          label: 'La fiesta',
          name: 'Casa de la familia Robles Cámara',
          address: 'Calle 43 #185 x 28 y 30, Col. Dolores Otero, Mérida, Yucatán',
          detail: 'Hay lugar para estacionarse sobre la calle 43.',
          timeLabel: '2:00 PM',
          mapAction: {
            label: 'Abrir el mapa',
            href: 'https://www.google.com/maps/search/?api=1&query=Merida+Yucatan',
          },
          image: {
            url: unsplash('photo-1607344645866-009c320b63e0', 1200, 900),
            alt: 'Patio decorado con globos para la fiesta infantil',
          },
        },
      ],
      note: 'Si necesitas aventón del templo a la casa, avísanos y lo organizamos.',
    }),
  },
  {
    key: 'xv-anios',
    name: 'XV Años',
    content: locationContentSchema.parse({
      eyebrow: 'Dónde será',
      title: 'La hacienda',
      subtitle: null,
      // Una sola sede y sin fotografía: el estado en el que se arma la mayoría de los eventos.
      venues: [
        {
          kind: 'reception',
          label: 'Recepción y fiesta',
          name: 'Hacienda San Isidro',
          address: 'Carretera a Chichimilá km 3, Valladolid, Yucatán',
          detail: 'Estacionamiento gratuito dentro de la hacienda, con acomodadores.',
          timeLabel: '8:00 PM',
          mapAction: {
            label: 'Cómo llegar',
            href: 'https://www.google.com/maps/search/?api=1&query=Valladolid+Yucatan',
          },
          image: null,
        },
      ],
      note: 'Las puertas se cierran a las 8:30 PM; procura llegar antes.',
    }),
  },
  {
    key: 'boda',
    name: 'Boda',
    content: locationContentSchema.parse({
      eyebrow: 'Nuestro día',
      title: 'Dónde nos casamos',
      subtitle: 'De la ceremonia a la recepción hay diez minutos en coche.',
      venues: [
        {
          kind: 'church',
          label: 'La ceremonia',
          name: 'Ex convento de San Antonio',
          address: 'Calle 31 s/n, Centro, Izamal, Yucatán',
          detail: 'El atrio es de piedra: tenlo en cuenta con los tacones.',
          timeLabel: '5:00 PM',
          mapAction: {
            label: 'Cómo llegar',
            href: 'https://www.google.com/maps/search/?api=1&query=Izamal+Yucatan',
          },
          image: {
            url: unsplash('photo-1560421683-6856ea585c78', 1200, 900),
            alt: 'Pasillo del convento decorado con flores para la ceremonia',
          },
        },
        {
          kind: 'reception',
          label: 'La recepción',
          name: 'Hacienda Santa Rosa',
          address: 'Carretera Izamal–Sudzal km 5, Yucatán',
          detail: 'Habrá transporte de vuelta al centro a la 1:00 y a las 2:00 AM.',
          timeLabel: '7:00 PM',
          mapAction: {
            label: 'Abrir en el mapa',
            href: 'https://www.google.com/maps/search/?api=1&query=Izamal+Yucatan',
          },
          // Sin foto todavía: el caso mezclado, que es como llega el material de verdad.
          image: null,
        },
      ],
      note: null,
    }),
  },
];
