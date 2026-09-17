import { locationContentSchema, type LocationContent } from '@/domain/invitation/blocks/location';
import { demoImage, QUINCE_PHOTOS, WEDDING_PHOTOS } from './photos';
import type { DemoSample } from './sample';

/**
 * Contenido de ejemplo para ver la ubicación sin tener que crear un evento.
 *
 * Mismas claves que el resto de bloques. Los dos llevan **dos sedes** —templo y salón—, que es lo
 * normal tanto en una boda como en unos XV en México, y es lo que permite comprobar de un vistazo
 * cómo se degradan las cuatro variantes pensadas para una sola: nunca esconden la segunda, la
 * apilan. Ver «Una sede o dos» en `docs/COMPONENTES.md`.
 *
 * La diferencia entre los dos ejemplos está en la fotografía: la boda enseña la mesa montada de la
 * recepción y los XV la iglesia iluminada de noche. Las dos salen de `photos.ts` con su
 * descripción; aquí no se escribe ningún `alt`.
 */

export const LOCATION_SAMPLES: readonly DemoSample<LocationContent>[] = [
  {
    key: 'boda',
    name: 'Boda',
    content: locationContentSchema.parse({
      eyebrow: 'Dónde nos vemos',
      title: 'Ubicación',
      /* Sin bajada, como el ejemplo de XV. La llevaba —«los dos sitios están a diez minutos en
         coche»— y era un dato inventado sobre dos sedes reales que están a la distancia que
         están: en el escaparate se lee como información del lugar, no como texto de ejemplo. El
         campo sigue existiendo para un evento que quiera explicar el trayecto. */
      subtitle: null,
      venues: [
        {
          kind: 'church',
          label: 'Ceremonia',
          name: 'Convento de San Antonio de Padua',
          address: 'Calle 31 s/n, Centro, Izamal, Yucatán',
          detail: null,
          timeLabel: '17:00',
          mapAction: {
            label: 'Cómo llegar',
            href: 'https://maps.google.com/?q=Convento+de+San+Antonio+de+Padua+Izamal',
          },
          image: demoImage(WEDDING_PHOTOS.ceremony, 1200, 1500),
        },
        {
          kind: 'reception',
          label: 'Recepción',
          name: 'Hacienda San José',
          address: 'Carretera Izamal-Sudzal km 4',
          /* Sin detalle, como el del templo. Lo que decía —«hay valet en la entrada
             principal»— lo dice ya el bloque de detalles de esta misma demo
             (`details-samples.ts`), y un dato repetido dos secciones más abajo no enseña una
             variante: enseña una invitación mal montada. */
          detail: null,
          timeLabel: '19:30',
          mapAction: {
            label: 'Cómo llegar',
            href: 'https://maps.google.com/?q=Hacienda+San+Jose+Izamal',
          },
          image: demoImage(WEDDING_PHOTOS.venue, 1400, 1000),
        },
      ],
      /* Sin nota, como el ejemplo de XV. Era el tercer texto inventado alrededor de dos sedes
         reales —tras la bajada y los dos detalles—, y una indicación de trayecto solo es cierta
         para quien venga de donde diga: en el escaparate se lee como información y no como
         relleno. El campo sigue existiendo para un evento que quiera darla de verdad. */
      note: null,
    }),
  },
  {
    key: 'quince',
    name: 'XV Años',
    content: locationContentSchema.parse({
      eyebrow: 'Dónde',
      title: 'La misa y la fiesta',
      subtitle: null,
      venues: [
        {
          kind: 'church',
          label: 'Misa de acción de gracias',
          name: 'Iglesia de San Servacio',
          address: 'Calle 41 por 40, Centro, Valladolid, Yucatán',
          detail: 'Frente al parque principal.',
          timeLabel: '19:00',
          mapAction: {
            label: 'Cómo llegar',
            href: 'https://maps.google.com/?q=Iglesia+de+San+Servacio+Valladolid',
          },
          image: demoImage(QUINCE_PHOTOS.church, 1200, 1500),
        },
        {
          kind: 'reception',
          label: 'Recepción',
          name: 'Hacienda Santa Cruz',
          address: 'Carretera Valladolid-Chichén Itzá km 6',
          detail: null,
          timeLabel: '21:00',
          mapAction: {
            label: 'Cómo llegar',
            href: 'https://maps.google.com/?q=Hacienda+Santa+Cruz+Valladolid',
          },
          image: demoImage(QUINCE_PHOTOS.venue, 1400, 1000),
        },
      ],
      note: null,
    }),
  },
];
