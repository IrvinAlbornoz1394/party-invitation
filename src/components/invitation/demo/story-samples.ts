import { storyContentSchema, type StoryContent } from '@/domain/invitation/blocks/story';
import type { DemoSample } from './sample';

/**
 * Contenido de ejemplo para ver una historia sin tener que crear un evento.
 *
 * Las claves son las mismas que las de las portadas —`presentacion`, `xv-anios`, `boda`— y los
 * textos hablan del mismo evento imaginario. No es cosmética: en la previsualización se salta
 * de `hero.split` a `story.overlay` sin cerrar la ventana, y con contenidos de eventos
 * distintos se compararía cualquier cosa menos los dos bloques.
 *
 * Los tres tienen distinta longitud a propósito —dos párrafos cortos, tres medianos, cuatro
 * largos— porque es exactamente donde una variante de historia se rompe: la centrada aguanta
 * mal lo que la partida lleva sin despeinarse, y eso hay que verlo antes de asignarla.
 */

const unsplash = (id: string): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

export const STORY_SAMPLES: readonly DemoSample<StoryContent>[] = [
  {
    key: 'presentacion',
    name: 'Presentación',
    content: storyContentSchema.parse({
      eyebrow: 'Tres años de bendiciones',
      title: 'Su presentación',
      subtitle: 'Damos gracias por su vida antes de empezar la fiesta.',
      body: [
        'Hace tres años llegó a nuestra vida la sonrisa que nos cambió todo: los horarios, las prioridades y la manera de mirarnos.',
        'Hoy queremos llevarla ante Cristo para dar gracias por su vida, por su salud y por cada travesura, y después celebrarlo con las personas que la queremos.',
      ],
      highlight: {
        quote: 'Gracias por ser parte de su historia desde el primer día.',
        author: 'Sus papás',
      },
      image: {
        url: unsplash('photo-1607344645866-009c320b63e0'),
        alt: 'Detalle de la decoración de la fiesta con globos y flores',
      },
      signature: 'Con cariño, sus papás',
      action: { label: 'Ver el cronograma', href: '#cronograma' },
    }),
  },
  {
    key: 'xv-anios',
    name: 'XV Años',
    content: storyContentSchema.parse({
      eyebrow: 'Nuestra historia',
      title: 'De niña a mujer',
      subtitle: 'Quince años que se pasaron volando y que queremos celebrar contigo.',
      body: [
        'Parece que fue ayer cuando aprendía a andar en bicicleta en la calle de la casa y se caía cada dos metros, decidida a no soltar el manubrio.',
        'Esa misma terquedad la llevó al ballet, a los exámenes de matemáticas y a las tardes enteras ensayando el vals que verás esta noche.',
        'Nos gustaría que estuvieras ahí para verlo. No hace falta traer nada: con que vengas a bailar es suficiente.',
      ],
      highlight: {
        quote: 'Quince años no se cumplen dos veces, y no queremos celebrarlos sin ti.',
        author: null,
      },
      /*
       * Sin fotografía a propósito. El ejemplo de XV Años es, en todos los bloques, el que
       * prueba el estado «todavía no hay fotos» — que es como llega la mitad de los eventos al
       * panel. Sin un ejemplo así, las variantes se dan por buenas viendo solo el caso fácil.
       */
      image: null,
      signature: 'Renata',
      action: null,
    }),
  },
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
      image: {
        url: unsplash('photo-1513151233558-d860c5398176'),
        alt: 'Confeti de colores lanzado al aire durante una celebración',
      },
      signature: 'Ana & Diego',
      action: { label: 'Confirmar asistencia', href: '#rsvp' },
    }),
  },
];
