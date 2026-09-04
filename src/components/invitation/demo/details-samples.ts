import { detailsContentSchema, type DetailsContent } from '@/domain/invitation/blocks/details';
import type { DemoSample } from './sample';

/**
 * Contenido de ejemplo para ver los detalles sin tener que crear un evento.
 *
 * Mismas claves que los ejemplos de portada e historia, para que al saltar de bloque en la
 * previsualización no cambie el evento debajo.
 *
 * Los dos tienen distinto número de detalles a propósito —**seis y cuatro**—. Es el eje en el que
 * se rompen estas cuatro variantes: una rejilla con cuatro deja hueco, una lista con seis empieza
 * a alargarse, y el panel de color con seis aprieta. Hay que verlo antes de asignar una a un
 * evento, no después.
 *
 * El de XV va **sin fotografía**, y es el único bloque donde se conserva ese caso: es con el que
 * se comprueba que las cuatro variantes se sostienen antes de que el cliente mande las fotos, que
 * es como se arma la mayoría de los eventos. En el escaparate no se nota, porque este bloque no
 * enseña foto en ninguna de las plantillas de XV.
 */

export const DETAILS_SAMPLES: readonly DemoSample<DetailsContent>[] = [
  {
    key: 'boda',
    name: 'Boda',
    content: detailsContentSchema.parse({
      eyebrow: 'Lo que necesitas saber',
      title: 'Detalles del día',
      subtitle: 'Todo lo práctico en un solo sitio, por si lo quieres consultar después.',
      items: [
        {
          icon: 'church',
          title: 'Ceremonia',
          description: 'Convento de San Antonio de Padua, 5:00 PM. Te pedimos llegar antes.',
          action: { label: 'Cómo llegar', href: 'https://maps.google.com/?q=Convento+Izamal' },
        },
        {
          icon: 'car',
          title: 'Transporte',
          description: 'Sale del centro a las 19:00 y regresa a las 2:00. Sin costo.',
          action: null,
        },
        {
          icon: 'dress',
          title: 'Etiqueta',
          description: 'Formal de jardín. El piso del patio es de piedra: tacón cómodo.',
          action: null,
        },
        {
          icon: 'guests',
          title: 'Solo adultos',
          description: 'Con mucho cariño, nos gustaría que esta noche fuera de los grandes.',
          action: null,
        },
        {
          icon: 'gift',
          title: 'Mesa de regalos',
          description: 'Tu presencia es más que suficiente, pero si insistes…',
          action: { label: 'Ver la mesa', href: 'https://www.liverpool.com.mx' },
        },
        {
          icon: 'parking',
          title: 'Estacionamiento',
          description: 'Hay valet en la entrada principal de la hacienda.',
          action: null,
        },
      ],
      image: null,
      note: 'Si algo cambia, te avisamos por aquí mismo.',
    }),
  },
  {
    key: 'quince',
    name: 'XV Años',
    content: detailsContentSchema.parse({
      eyebrow: 'Detalles',
      title: 'Lo que hay que saber',
      subtitle: null,
      items: [
        {
          icon: 'church',
          title: 'Misa',
          description: 'Iglesia de San Servacio, 7:00 PM.',
          action: { label: 'Cómo llegar', href: 'https://maps.google.com/?q=San+Servacio' },
        },
        {
          icon: 'music',
          title: 'El vals',
          description: 'A las 9:45. Es la parte que no me quiero perder contigo ahí.',
          action: null,
        },
        {
          icon: 'dress',
          title: 'Etiqueta',
          description: 'Formal. Te pido evitar el azul cielo, que es mi color esa noche.',
          action: null,
        },
        {
          icon: 'gift',
          title: 'Regalos',
          description: 'Si quieres regalarme algo, un sobre me ayuda con el viaje de estudios.',
          action: null,
        },
      ],
      /* Sin fotografía: el estado en el que las cuatro variantes tienen que sostenerse solas. */
      image: null,
      note: null,
    }),
  },
];
