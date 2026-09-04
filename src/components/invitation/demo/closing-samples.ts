import { closingContentSchema, type ClosingContent } from '@/domain/invitation/blocks/closing';
import { demoImage, QUINCE_PHOTOS, WEDDING_PHOTOS } from './photos';
import type { DemoSample } from './sample';

/**
 * Contenido de ejemplo para ver el mensaje final sin tener que crear un evento.
 *
 * Mismas claves que el resto de bloques —los dos eventos imaginarios—, y entre los dos cubren lo
 * que decide qué componente elegir: con firma y sin llamada a la acción, y con las dos cosas.
 * Los dos llevan fotografía, que es como se ven en el escaparate; el estado «todavía no hay
 * fotos» lo cubre el ejemplo de detalles, donde no estropea la demo.
 */

export const CLOSING_SAMPLES: readonly DemoSample<ClosingContent>[] = [
  {
    key: 'boda',
    name: 'Boda',
    content: closingContentSchema.parse({
      eyebrow: 'Nos vemos el 12 de junio',
      title: 'Gracias por caminar con nosotros hasta aquí.',
      message:
        'No queremos una boda perfecta; queremos una boda con la gente que nos ha acompañado estos nueve años.',
      signature: 'Ana & Diego',
      icon: 'toast',
      image: demoImage(WEDDING_PHOTOS.arch, 900, 1150),
      /* Sin acción: la confirmación ya se pidió en su bloque y repetirla aquí resta. */
      action: null,
    }),
  },
  {
    key: 'quince',
    name: 'XV Años',
    content: closingContentSchema.parse({
      eyebrow: 'Te espero',
      title: 'Quince años no se cumplen dos veces.',
      message: 'Gracias por acompañarme en una noche que voy a recordar toda la vida.',
      signature: 'Renata',
      icon: 'sparkles',
      image: demoImage(QUINCE_PHOTOS.night, 900, 1150),
      action: { label: 'Confirmar mi lugar', href: '#rsvp' },
    }),
  },
];
