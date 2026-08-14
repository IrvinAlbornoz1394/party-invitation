import { scheduleContentSchema, type ScheduleContent } from '@/domain/invitation/blocks/schedule';
import type { DemoSample } from './sample';

/**
 * Contenido de ejemplo para ver un cronograma sin tener que crear un evento.
 *
 * Mismas claves que el resto de bloques —los mismos tres eventos imaginarios— para poder saltar
 * de la portada al cronograma sin que cambie el evento debajo.
 *
 * Los tres cubren lo que hay que probar antes de elegir una forma:
 *
 *   · **Presentación**: cuatro hitos con iconos. El caso corto y variado, donde los iconos
 *     distinguen de un vistazo la misa, las fotos, la comida y el pastel.
 *   · **XV Años**: seis hitos en modo **solo puntos**. Es la comprobación de que las cuatro
 *     formas se sostienen sin iconos — y de paso, cómo se ve una invitación más sobria.
 *   · **Boda**: siete hitos con iconos. El cronograma largo, donde se nota cuál de las cuatro
 *     aguanta y cuál se hace interminable.
 */

export const SCHEDULE_SAMPLES: readonly DemoSample<ScheduleContent>[] = [
  {
    key: 'presentacion',
    name: 'Presentación',
    content: scheduleContentSchema.parse({
      eyebrow: 'Cómo será el día',
      title: 'El orden del día',
      subtitle: 'Para que llegues a tiempo a lo que no te quieres perder.',
      marker: 'icon',
      items: [
        {
          timeLabel: '12:00',
          title: 'Misa de acción de gracias',
          description: 'En el Templo de Nuestra Señora de Guadalupe.',
          icon: 'church',
        },
        {
          timeLabel: '13:00',
          title: 'Fotos con la festejada',
          description: 'Afuera del templo, antes de irnos a la fiesta.',
          icon: 'camera',
        },
        {
          timeLabel: '14:00',
          title: 'Comida y juegos',
          description: 'Brincolín, mesa de dulces y toda la tarde para jugar.',
          icon: 'food',
        },
        {
          timeLabel: '17:30',
          title: 'Feliz cumpleaños',
          description: 'Acompáñanos a cantar en la mesa del pastel.',
          icon: 'cake',
        },
      ],
      note: 'Los horarios son aproximados; lo importante es que vengas.',
    }),
  },
  {
    key: 'xv-anios',
    name: 'XV Años',
    content: scheduleContentSchema.parse({
      eyebrow: 'La noche, hora por hora',
      title: 'Programa',
      subtitle: null,
      /*
       * En «solo puntos» a propósito. Los iconos siguen guardados en cada hito —cambiar de modo
       * es un interruptor, no volver a elegirlos—, pero aquí no se pintan: seis momentos de una
       * misma noche se distinguen por la hora, no por seis dibujos parecidos.
       */
      marker: 'dot',
      items: [
        { timeLabel: '8:00 PM', title: 'Recepción', description: 'Bienvenida con cóctel en el jardín.', icon: 'guests' },
        { timeLabel: '8:45 PM', title: 'Entrada de la festejada', description: null, icon: 'sparkles' },
        { timeLabel: '9:00 PM', title: 'Vals', description: 'El baile que llevamos meses ensayando.', icon: 'music' },
        { timeLabel: '9:30 PM', title: 'Cena', description: 'Servicio en mesa. Avísanos de cualquier alergia.', icon: 'food' },
        { timeLabel: '10:30 PM', title: 'Brindis y pastel', description: null, icon: 'toast' },
        { timeLabel: '11:00 PM', title: 'A bailar', description: 'Hasta que aguantemos.', icon: 'party' },
      ],
      note: 'La hacienda cierra sus puertas a las 8:30 PM; procura llegar antes.',
    }),
  },
  {
    key: 'boda',
    name: 'Boda',
    content: scheduleContentSchema.parse({
      eyebrow: 'Nuestro día',
      title: 'Así será la boda',
      subtitle: 'Siete momentos, de la ceremonia a la última canción.',
      marker: 'icon',
      items: [
        {
          timeLabel: '5:00 PM',
          title: 'Ceremonia',
          description: 'En el ex convento de San Antonio. Te pedimos llegar diez minutos antes.',
          icon: 'church',
        },
        { timeLabel: '6:00 PM', title: 'Fotos y traslado', description: 'Hay diez minutos de camino hasta la recepción.', icon: 'car' },
        { timeLabel: '7:00 PM', title: 'Cóctel de bienvenida', description: 'En la terraza, mientras cae la tarde.', icon: 'toast' },
        { timeLabel: '8:30 PM', title: 'Cena', description: 'Servicio en mesa, con menú vegetariano a petición.', icon: 'food' },
        { timeLabel: '10:00 PM', title: 'Primer baile', description: null, icon: 'heart' },
        { timeLabel: '10:30 PM', title: 'Fiesta', description: 'Grupo en vivo hasta la una y música hasta el cierre.', icon: 'party' },
        { timeLabel: '2:00 AM', title: 'Última canción', description: 'Y un taco de despedida para el camino.', icon: 'music' },
      ],
      note: 'Habrá transporte de regreso al centro a la 1:00 y a las 2:00 AM.',
    }),
  },
];
