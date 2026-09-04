import { welcomeContentSchema, type WelcomeContent } from '@/domain/invitation/blocks/welcome';
import { demoImage, QUINCE_PHOTOS, WEDDING_PHOTOS } from './photos';
import type { DemoSample } from './sample';

/**
 * Contenido de ejemplo para la pantalla de bienvenida.
 *
 * Las dos claves —`boda` y `quince`— son las mismas en los doce bloques, y eso no es una
 * convención estética: es lo que permite que una demo elija un evento imaginario y todos sus
 * bloques hablen del mismo. Un ejemplo con otra clave saldría con la bienvenida de una boda
 * encima de la portada de unos XV.
 *
 * Eran tres —había una presentación infantil— y ahora son dos. El producto se vende para bodas y
 * para XV, y con un tercer juego a medio escribir lo que se comparaba en el escaparate no era la
 * plantilla sino el contenido.
 *
 * Los dos están elegidos también por la **forma del nombre**, que es lo que rompe esta pantalla:
 * uno de pareja con símbolo y uno de una sola palabra con dos apellidos. Solo el primero da
 * monograma de dos letras y nombres apilados —ver `welcome-name.ts`—, así que las variantes que
 * dependen de eso se prueban con los dos y no solo con el que les conviene.
 *
 * ## Las fotografías
 *
 * Verticales y de personas, porque estas pantallas se ven **en un teléfono en vertical** y casi
 * todas apoyan el nombre sobre el retrato. Salen de `photos.ts`, donde cada imagen viaja con su
 * descripción: aquí no se escribe ningún `alt` a mano.
 */

export const WELCOME_SAMPLES: readonly DemoSample<WelcomeContent>[] = [
  {
    key: 'boda',
    name: 'Boda',
    content: welcomeContentSchema.parse({
      eventTypeLabel: 'Nuestra boda',
      celebrantName: 'Ana & Diego',
      celebrantLastName: null,
      dateLabel: 'Sábado 12 de junio, 2027',
      note: 'Junto a nuestros familiares, tenemos el honor de invitarte a nuestra unión.',
      venue: 'Convento de San Antonio · Izamal, Yucatán',
      startsAt: '2027-06-12T17:00:00-06:00',
      image: demoImage(WEDDING_PHOTOS.couple, 1400, 1900),
      openLabel: 'Abrir invitación',
    }),
  },
  {
    key: 'quince',
    name: 'XV Años',
    content: welcomeContentSchema.parse({
      eventTypeLabel: 'Mis XV años',
      celebrantName: 'Renata',
      celebrantLastName: 'Villanueva Sosa',
      dateLabel: 'Sábado 6 de noviembre, 2027',
      note: 'Acompáñame a celebrar el inicio de una nueva etapa.',
      venue: 'Iglesia de San Servacio · Valladolid, Yucatán',
      startsAt: '2027-11-06T19:00:00-06:00',
      image: demoImage(QUINCE_PHOTOS.portrait, 1400, 1900),
      openLabel: 'Entrar',
    }),
  },
];
