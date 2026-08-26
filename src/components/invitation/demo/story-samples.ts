import { storyContentSchema, type StoryContent } from '@/domain/invitation/blocks/story';
import { demoImage, QUINCE_PHOTOS, WEDDING_PHOTOS } from './photos';
import type { DemoSample } from './sample';
/**
 * Contenido de ejemplo para ver una historia sin tener que crear un evento.
 *
 * Las claves son las mismas que las de las portadas —`boda` y `quince`— y los textos hablan del
 * mismo evento imaginario. No es cosmética: en la previsualización se salta de `hero.split` a
 * `story.overlay` sin cerrar la ventana, y con contenidos de eventos distintos se compararía
 * cualquier cosa menos los dos bloques.
 *
 * Los dos tienen distinta longitud a propósito —cuatro párrafos largos y tres medianos— porque es
 * exactamente donde una variante de historia se rompe: la centrada aguanta mal lo que la partida
 * lleva sin despeinarse, y eso hay que verlo antes de asignarla.
 */
export const STORY_SAMPLES: readonly DemoSample<StoryContent>[] = [
  {
    key: 'boda',
    name: 'Boda',
    content: storyContentSchema.parse({
      eyebrow: 'Cómo empezó todo',
      title: 'Nuestra historia',
      subtitle: 'Nueve años, dos ciudades y un perro de por medio.',
      body: [
        'Nos conocimos en una fila para entrar a un concierto al que ninguno de los dos quería ir. Diego iba acompañando a su hermana; Ana, porque le sobraba un boleto y le daba pena desperdiciarlo.',
        'Tres años después compartíamos un departamento diminuto en el centro, con una ventana que daba a una pared y una planta que sobrevivió de milagro.',
        'Vinieron una mudanza, dos trabajos nuevos, un perro llamado Tomás y la certeza tranquila de que esto no era una etapa.',
        'El 12 de junio queremos decirlo en voz alta, delante de las personas que nos han acompañado todo este tiempo. Nos encantaría que fueras una de ellas.',
      ],
      highlight: {
        quote: 'No fue un flechazo. Fue una decisión que llevamos nueve años tomando todos los días.',
        author: 'Ana y Diego',
      },
      image: demoImage(WEDDING_PHOTOS.exit, 1600, 1100),
      signature: 'Ana & Diego',
    }),
  },
  {
    key: 'quince',
    name: 'XV Años',
    content: storyContentSchema.parse({
      eyebrow: 'Nuestra historia',
      title: 'De niña a mujer',
      subtitle: 'Quince años que se pasaron volando y que quiero celebrar contigo.',
      body: [
        'Parece que fue ayer cuando aprendía a andar en bicicleta en la calle de la casa y se caía cada dos metros, decidida a no soltar el manubrio.',
        'Esa misma terquedad la llevó al ballet, a los exámenes de matemáticas y a las tardes enteras ensayando el vals que verás esa noche.',
        'Nos gustaría que estuvieras ahí para verlo. No hace falta traer nada: con que vengas a bailar es suficiente.',
      ],
      highlight: {
        quote: 'Quince años no se cumplen dos veces, y no quiero celebrarlos sin ti.',
        author: null,
      },
      image: demoImage(QUINCE_PHOTOS.dress, 1600, 1100),
      signature: 'Renata',
    }),
  },
];
