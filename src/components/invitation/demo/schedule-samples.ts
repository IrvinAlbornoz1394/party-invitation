import { scheduleContentSchema, type ScheduleContent } from '@/domain/invitation/blocks/schedule';
import type { DemoSample } from './sample';

/**
 * Contenido de ejemplo para ver un cronograma sin tener que crear un evento.
 *
 * Mismas claves que el resto de bloques para poder saltar de la portada al cronograma sin que
 * cambie el evento debajo. Los dos cubren lo que hay que probar antes de elegir una forma:
 *
 *   · **Boda**: siete hitos con iconos. El cronograma largo, donde se nota cuál de las siete
 *     variantes aguanta y cuál se hace interminable.
 *   · **XV**: seis hitos en modo **solo puntos**. Es la comprobación de que todas se sostienen sin
 *     iconos — y de paso, cómo se ve una invitación más sobria.
 *
 * Los hitos son los que de verdad distinguen a los dos eventos: una boda tiene ceremonia, cóctel y
 * primer baile; unos XV tienen misa, vals y chambelanes. El componente es el mismo; lo que cuenta,
 * no.
 */

export const SCHEDULE_SAMPLES: readonly DemoSample<ScheduleContent>[] = [
  {
    key: 'boda',
    name: 'Boda',
    content: scheduleContentSchema.parse({
      eyebrow: 'Cómo será el día',
      title: 'El orden del día',
      subtitle: 'Para que llegues a tiempo a lo que no te quieres perder.',
      marker: 'icon',
      items: [
        {
          timeLabel: '17:00',
          title: 'Ceremonia religiosa',
          description: 'En el Convento de San Antonio de Padua.',
          icon: 'church',
        },
        {
          timeLabel: '18:15',
          title: 'Fotos con los novios',
          description: 'En el atrio, antes de salir hacia la hacienda.',
          icon: 'camera',
        },
        { timeLabel: '19:30', title: 'Cóctel de bienvenida', description: null, icon: 'toast' },
        {
          timeLabel: '20:30',
          title: 'Cena',
          description: 'Servicio en mesa; encontrarás tu lugar en el plano de la entrada.',
          icon: 'food',
        },
        { timeLabel: '22:00', title: 'Primer baile', description: null, icon: 'heart' },
        {
          timeLabel: '22:30',
          title: 'Fiesta',
          description: 'Grupo en vivo y después música hasta el cierre.',
          icon: 'party',
        },
        { timeLabel: '02:00', title: 'Última canción', description: null, icon: 'sparkles' },
      ],
      note: 'Los horarios son aproximados; lo importante es que vengas.',
    }),
  },
  {
    key: 'quince',
    name: 'XV Años',
    content: scheduleContentSchema.parse({
      eyebrow: 'La noche, paso a paso',
      title: 'Programa',
      subtitle: null,
      /* Solo puntos: sin iconos, lo único que destaca es la hora. Es lo que pide una invitación
         formal y lo que salva a un programa de seis momentos parecidos. */
      marker: 'dot',
      items: [
        {
          timeLabel: '19:00',
          title: 'Misa de acción de gracias',
          description: 'Iglesia de San Servacio, en el centro.',
          icon: 'church',
        },
        { timeLabel: '20:15', title: 'Sesión de fotos', description: null, icon: 'camera' },
        {
          timeLabel: '21:00',
          title: 'Recepción',
          description: 'En la Hacienda Santa Cruz.',
          icon: 'sparkles',
        },
        {
          timeLabel: '21:45',
          title: 'Vals y chambelanes',
          description: 'El baile que llevamos meses ensayando.',
          icon: 'music',
        },
        { timeLabel: '22:30', title: 'Cena', description: null, icon: 'food' },
        {
          timeLabel: '23:30',
          title: 'Baile',
          description: 'Hasta que se acabe la música.',
          icon: 'party',
        },
      ],
      note: null,
    }),
  },
];
