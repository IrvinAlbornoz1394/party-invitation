import { closingContentSchema, type ClosingContent } from '@/domain/invitation/blocks/closing';
import type { DemoSample } from './sample';

/**
 * Contenido de ejemplo para ver el mensaje final sin tener que crear un evento.
 *
 * Mismas claves que el resto de bloques —los mismos tres eventos imaginarios—, y los tres
 * cubren lo que decide qué componente elegir: con fotografía y sin ella, con firma y sin ella, y
 * con la última llamada a la acción o sin nada que pedir.
 */

const unsplash = (id: string, width: number, height: number): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;

export const CLOSING_SAMPLES: readonly DemoSample<ClosingContent>[] = [
  {
    key: 'presentacion',
    name: 'Presentación',
    content: closingContentSchema.parse({
      eyebrow: 'Con mucho cariño',
      title: 'Tu presencia hará este día aún más especial.',
      message:
        'Gracias por acompañarnos a dar gracias por su vida y a celebrar sus tres años con nosotros.',
      signature: 'Con cariño, sus papás',
      icon: 'heart',
      image: {
        url: unsplash('photo-1513151233558-d860c5398176', 900, 1150),
        alt: 'Confeti de colores lanzado al aire durante la celebración',
      },
      action: { label: 'Confirmar asistencia', href: '#rsvp' },
    }),
  },
  {
    key: 'xv-anios',
    name: 'XV Años',
    content: closingContentSchema.parse({
      eyebrow: 'Te espero',
      title: 'Quince años no se cumplen dos veces.',
      message: null,
      signature: 'Renata',
      icon: 'sparkles',
      // Sin fotografía: el estado en el que los tres componentes tienen que sostenerse solos.
      image: null,
      action: { label: 'Confirmar mi lugar', href: '#rsvp' },
    }),
  },
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
      image: {
        url: unsplash('photo-1560421683-6856ea585c78', 900, 1150),
        alt: 'Mesa larga montada al aire libre para la recepción',
      },
      // Sin acción: la confirmación ya se pidió en su bloque y repetirla aquí resta.
      action: null,
    }),
  },
];
