import { heroContentSchema, type HeroContent } from '@/domain/invitation/blocks/hero';
import { demoImage, QUINCE_PHOTOS, WEDDING_PHOTOS } from './photos';
import type { DemoSample } from './sample';

/**
 * Contenido de ejemplo para ver una portada sin tener que crear un evento.
 *
 * Dos eventos imaginarios, los dos que el producto vende: una boda y unos XV. Las claves son las
 * mismas en los doce bloques para que una demo se cuente entera con un solo juego.
 *
 * Lo que cambia entre ellos —y por lo que las cinco portadas se prueban con los dos— es la forma
 * del nombre y el registro de la voz: la boda habla en plural («nuestra boda», «nuestros
 * padres») y los XV en primera persona del singular («mis XV años»). Una portada que solo se
 * probara con la boda dejaría pasar un diseño que apila dos nombres y no sabe qué hacer con uno.
 */

export const HERO_SAMPLES: readonly DemoSample<HeroContent>[] = [
  {
    key: 'boda',
    name: 'Boda',
    content: heroContentSchema.parse({
      eventTypeLabel: 'Nuestra boda',
      intro: 'Con la bendición de nuestros padres',
      celebrantName: 'Ana & Diego',
      celebrantLastName: null,
      tagline: 'Queremos que estés con nosotros el día en que empezamos a contar de a dos.',
      dateLabel: 'Sábado 12 de junio, 2027',
      city: 'Izamal, Yucatán',
      startsAt: '2027-06-12T17:00:00-06:00',
      image: demoImage(WEDDING_PHOTOS.couple, 1600, 2100),
    }),
  },
  {
    key: 'quince',
    name: 'XV Años',
    content: heroContentSchema.parse({
      eventTypeLabel: 'Mis XV años',
      intro: 'Mis papás y yo te invitamos a celebrar',
      celebrantName: 'Renata',
      celebrantLastName: 'Villanueva Sosa',
      tagline: 'Una noche para bailar, reír y quedarnos con el recuerdo.',
      dateLabel: 'Sábado 6 de noviembre, 2027',
      city: 'Valladolid, Yucatán',
      startsAt: '2027-11-06T19:00:00-06:00',
      image: demoImage(QUINCE_PHOTOS.portrait, 1600, 2100),
    }),
  },
];
