import { welcomeContentSchema, type WelcomeContent } from '@/domain/invitation/blocks/welcome';
import type { DemoSample } from './sample';

/**
 * Contenido de ejemplo para la pantalla de bienvenida.
 *
 * Las tres claves son las mismas que en el resto de bloques —`presentacion`, `xv-anios`,
 * `boda`—, y eso no es una convención estética: es lo que permite que una plantilla de
 * demostración elija un evento imaginario y todos sus bloques hablen del mismo. Un ejemplo con
 * otra clave saldría con la bienvenida de una boda encima de la portada de unos XV.
 *
 * Los tres están elegidos por la **forma del nombre**, que es lo que rompe esta pantalla: uno
 * largo de dos palabras, uno de una sola con dos apellidos y uno de pareja con símbolo. Solo el
 * tercero da monograma de dos letras y nombres apilados —ver `welcome-name.ts`—, así que las
 * variantes que dependen de eso se prueban con los tres y no solo con el que les conviene.
 *
 * ## Las fotografías
 *
 * Verticales y de personas, porque estas pantallas se ven **en un teléfono en vertical** y casi
 * todas apoyan el nombre sobre el retrato. Una foto apaisada de una mesa montada —que sirve para
 * un bloque de detalles— aquí deja franjas vacías arriba y abajo. Son de Unsplash, el origen ya
 * permitido en `next.config.ts`.
 */

const unsplash = (id: string): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;

export const WELCOME_SAMPLES: readonly DemoSample<WelcomeContent>[] = [
  {
    key: 'presentacion',
    name: 'Presentación',
    content: welcomeContentSchema.parse({
      eventTypeLabel: 'Mi presentación · 3 años',
      celebrantName: 'Valentina Sofía',
      celebrantLastName: 'Robles Cámara',
      dateLabel: 'Sábado 17 de abril, 2027',
      note: 'Mis papás y yo te esperamos.',
      venue: 'Parroquia de la Candelaria · Mérida, Yucatán',
      startsAt: '2027-04-17T12:00:00-06:00',
      image: {
        url: unsplash('photo-1602631985686-1bb0e6a8696e'),
        alt: 'Mesa de fiesta infantil decorada con globos de colores',
      },
      openLabel: 'Abrir invitación',
    }),
  },
  {
    key: 'xv-anios',
    name: 'XV Años',
    content: welcomeContentSchema.parse({
      eventTypeLabel: 'Mis XV años',
      celebrantName: 'Renata',
      celebrantLastName: 'Villanueva Sosa',
      dateLabel: 'Sábado 6 de noviembre, 2027',
      note: 'Acompáñame a celebrar el inicio de una nueva etapa en mi vida.',
      venue: 'Hacienda Santa Cruz · Valladolid, Yucatán',
      startsAt: '2027-11-06T20:00:00-06:00',
      image: {
        url: unsplash('photo-1640827013600-1f5411ec366b'),
        alt: 'Joven con vestido de gala bordado sosteniendo un ramo de flores en una iglesia',
      },
      openLabel: 'Entrar',
    }),
  },
  {
    key: 'boda',
    name: 'Boda',
    content: welcomeContentSchema.parse({
      eventTypeLabel: 'Nuestra boda',
      celebrantName: 'Ana & Diego',
      celebrantLastName: null,
      dateLabel: 'Sábado 12 de junio, 2027',
      note: 'Junto a nuestros familiares, tenemos el honor de invitarte a nuestra unión.',
      venue: 'Hacienda San José · Izamal, Yucatán',
      startsAt: '2027-06-12T17:00:00-06:00',
      image: {
        url: unsplash('photo-1606216794074-735e91aa2c92'),
        alt: 'Pareja de novios caminando de la mano frente a una palmera, al atardecer',
      },
      openLabel: 'Abrir invitación',
    }),
  },
];
