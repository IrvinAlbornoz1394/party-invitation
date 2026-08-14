import { detailsContentSchema, type DetailsContent } from '@/domain/invitation/blocks/details';
import type { DemoSample } from './sample';

/**
 * Contenido de ejemplo para ver los detalles sin tener que crear un evento.
 *
 * Mismas claves que los ejemplos de portada e historia —los mismos tres eventos imaginarios—,
 * para que al saltar de bloque en la previsualización no cambie el evento debajo.
 *
 * Los tres tienen distinto número de detalles a propósito: **tres, cinco y seis**. Es el eje
 * en el que se rompen estas cuatro variantes —una rejilla con cinco elementos deja hueco, una
 * lista con tres se queda corta, el panel con seis empieza a apretar— y es lo que hay que ver
 * antes de asignar una a un evento, no después.
 *
 * El de XV Años va **sin fotografía**, igual que en el resto de bloques: es el ejemplo con el
 * que se comprueba que las cuatro variantes se sostienen antes de que el cliente mande las
 * fotos, que es como se arma la mayoría de los eventos.
 */

const unsplash = (id: string): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

export const DETAILS_SAMPLES: readonly DemoSample<DetailsContent>[] = [
  {
    key: 'presentacion',
    name: 'Presentación',
    content: detailsContentSchema.parse({
      eyebrow: 'Lo que necesitas saber',
      title: 'Detalles del día',
      subtitle: 'Todo lo práctico en un solo sitio, por si lo quieres consultar después.',
      items: [
        {
          icon: 'church',
          title: 'Misa de acción de gracias',
          description: 'Templo de Nuestra Señora de Guadalupe, 12:00 PM. Llega diez minutos antes.',
          action: { label: 'Cómo llegar', href: 'https://maps.google.com/?q=Merida' },
        },
        {
          icon: 'cake',
          title: 'La fiesta',
          description: 'En casa de la familia, a partir de las 2:00 PM. Habrá comida para todos.',
        },
        {
          icon: 'gift',
          title: 'Sugerencia de regalo',
          description: 'Juguetes para tres años, libros o un detalle con cariño.',
          action: { label: 'Ver ideas', href: 'https://www.google.com/search?q=juguetes+3+anios' },
        },
      ],
      image: {
        url: unsplash('photo-1607344645866-009c320b63e0'),
        alt: 'Mesa de dulces decorada para la fiesta infantil',
      },
      note: 'Si vienes con niños, avísanos para tenerlos en cuenta en la mesa de dulces.',
    }),
  },
  {
    key: 'xv-anios',
    name: 'XV Años',
    content: detailsContentSchema.parse({
      eyebrow: 'Antes de la fiesta',
      title: 'Lo que hay que saber',
      subtitle: null,
      items: [
        {
          icon: 'calendar',
          title: 'Sábado 6 de noviembre',
          description: 'La recepción empieza a las 8:00 PM en punto.',
        },
        {
          icon: 'location',
          title: 'Hacienda San Isidro',
          description: 'Carretera a Chichimilá km 3, Valladolid.',
          action: { label: 'Abrir el mapa', href: 'https://maps.google.com/?q=Valladolid+Yucatan' },
        },
        {
          icon: 'dress',
          title: 'Etiqueta',
          description: 'Formal. Te pedimos reservar el color rojo para la festejada.',
        },
        {
          icon: 'parking',
          title: 'Estacionamiento',
          description: 'Gratuito dentro de la hacienda, con acomodadores desde las 7:30 PM.',
        },
        {
          icon: 'gift',
          title: 'Mesa de regalos',
          description: 'Registrada a nombre de Renata Villanueva.',
          action: { label: 'Ver mesa de regalos', href: 'https://www.liverpool.com.mx' },
        },
      ],
      // Sin fotografía: el estado en el que se arma la mayoría de los eventos.
      image: null,
      note: 'Confirma tu asistencia antes del 20 de octubre para apartar tu lugar.',
    }),
  },
  {
    key: 'boda',
    name: 'Boda',
    content: detailsContentSchema.parse({
      eyebrow: 'Nuestro día',
      title: 'Detalles de la boda',
      subtitle: 'Un par de cosas para que no tengas que preguntar nada.',
      items: [
        {
          icon: 'church',
          title: 'Ceremonia',
          description: 'Ex convento de San Antonio, 5:00 PM.',
          action: { label: 'Cómo llegar', href: 'https://maps.google.com/?q=Izamal' },
        },
        {
          icon: 'clock',
          title: 'Recepción',
          description: 'A las 7:00 PM, a diez minutos de la ceremonia.',
        },
        {
          icon: 'dress',
          title: 'Código de vestimenta',
          description: 'Formal de jardín. El piso es de piedra: tenlo en cuenta con los tacones.',
        },
        {
          icon: 'camera',
          title: 'Ceremonia sin celulares',
          description: 'Nos encantaría verte a ti, no a tu pantalla. Después habrá fotos para todos.',
        },
        {
          icon: 'music',
          title: 'La fiesta',
          description: 'Grupo en vivo hasta la una y música hasta que aguantemos.',
        },
        {
          icon: 'gift',
          title: 'Mesa de regalos',
          description: 'Si quieres tener un detalle con nosotros, aquí están nuestras opciones.',
          action: { label: 'Ver opciones', href: 'https://www.amazon.com.mx' },
        },
      ],
      image: {
        url: unsplash('photo-1560421683-6856ea585c78'),
        alt: 'Mesa larga montada al aire libre para la recepción',
      },
      note: 'Por el tipo de recepción, esta invitación es para adultos. Gracias por entenderlo.',
    }),
  },
];
