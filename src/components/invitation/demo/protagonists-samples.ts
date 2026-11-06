import {
  protagonistsContentSchema,
  type ProtagonistsContent,
} from '@/domain/invitation/blocks/protagonists';
import { demoImage, QUINCE_PHOTOS } from './photos';
import type { DemoSample } from './sample';

/**
 * Ejemplos del bloque de protagonistas, para los mismos eventos imaginarios del resto de demos.
 *
 * La boda presenta a cada uno con su retrato y unas líneas en primera persona. Los XV presentan a
 * la quinceañera con foto y a sus papás **sin** ella, a propósito: es el caso de cada semana —la
 * foto de los papás llega tarde o no llega— y la demo tiene que enseñar cómo se compone el marco
 * vacío.
 *
 * Los retratos de la boda son de StockSnap (CC0), guardados en `public/assets/demo/protagonists/`
 * con sus créditos al lado.
 */
export const PROTAGONISTS_SAMPLES: readonly DemoSample<ProtagonistsContent>[] = [
  {
    key: 'boda',
    name: 'Boda',
    content: protagonistsContentSchema.parse({
      eyebrow: null,
      title: 'Los novios',
      subtitle: null,
      people: [
        {
          role: 'La novia',
          name: 'Ana Villanueva',
          bio: 'Nos conocimos en un concierto al que ninguno de los dos quería ir. Nueve años después, sigo pensando que fue la mejor decisión que no tomé yo.',
          image: {
            url: '/assets/demo/protagonists/bride-stocksnap-k0uo3i9go3.webp',
            alt: 'La novia sonríe con su vestido de encaje y el ramo en la mano, en un jardín',
          },
        },
        {
          role: 'El novio',
          name: 'Diego Robles',
          bio: 'Le debo a Ana la mitad de mis mejores historias y todas las que empiezan con «no estaba en el plan». El 12 de junio queremos contarles la siguiente.',
          image: {
            url: '/assets/demo/protagonists/groom-stocksnap-jfy2uhox4h.webp',
            alt: 'El novio con traje gris, corbatín y un prendido de flores blancas en la solapa',
          },
        },
      ],
    }),
  },
  {
    key: 'quince',
    name: 'XV Años',
    content: protagonistsContentSchema.parse({
      eyebrow: null,
      title: 'Mis XV años',
      subtitle: null,
      people: [
        {
          role: 'La quinceañera',
          name: 'Renata Villanueva',
          bio: 'Quince años de risas, de bailar en la cocina y de tener a mi lado a las personas que más quiero. Esta noche quiero celebrarla con ustedes.',
          image: demoImage(QUINCE_PHOTOS.portrait, 720, 900),
        },
        {
          role: 'Mis papás',
          name: 'Rodrigo y Mariana',
          bio: 'Con todo nuestro amor, te acompañamos en esta nueva etapa.',
          image: null,
        },
      ],
    }),
  },
];
