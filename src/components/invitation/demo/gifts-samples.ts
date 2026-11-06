import { giftsContentSchema, type GiftsContent } from '@/domain/invitation/blocks/gifts';
import { demoImage, WEDDING_PHOTOS } from './photos';
import type { DemoSample } from './sample';

/**
 * Ejemplos de la mesa de regalos. La boda trae los dos casos de casi todas las bodas en México: una
 * tienda con su número de evento y la lluvia de sobres. Los XV, solo la lluvia de sobres y sin
 * foto, para que la demo enseñe la tarjeta sobre el papel.
 */
export const GIFTS_SAMPLES: readonly DemoSample<GiftsContent>[] = [
  {
    key: 'boda',
    name: 'Boda',
    content: giftsContentSchema.parse({
      eyebrow: null,
      title: 'Su presencia es nuestro regalo',
      message:
        'No necesitan traernos nada: que estén ese día con nosotros es lo más importante. Si aun así quieren hacernos un regalo, aquí les dejamos nuestra mesa para ayudarnos a empezar esta nueva etapa.',
      registries: [
        {
          label: 'Liverpool',
          detail: 'Número de evento 51234567',
          action: { label: 'Ver mesa', href: 'https://mesaderegalos.liverpool.com.mx/' },
        },
        { label: 'Lluvia de sobres', detail: 'Habrá una caja a la entrada de la recepción.', action: null },
      ],
      image: demoImage(WEDDING_PHOTOS.exit, 1600, 1000),
      note: '¡Gracias por tanto cariño!',
    }),
  },
  {
    key: 'quince',
    name: 'XV Años',
    content: giftsContentSchema.parse({
      eyebrow: 'Mesa de regalos',
      title: 'Lluvia de sobres',
      message: 'Tu compañía es mi mejor regalo. Si quieres tener un detalle conmigo, habrá una caja para sobres en la recepción.',
      registries: [],
      image: null,
      note: null,
    }),
  },
];
