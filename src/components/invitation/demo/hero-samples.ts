import { heroContentSchema, type HeroContent } from '@/domain/invitation/blocks/hero';
import type { DemoSample } from './sample';

/**
 * Contenido de ejemplo para ver una portada sin tener que crear un evento.
 *
 * Son tres y no uno porque una variante se juzga mal con un solo contenido: la que se ve
 * elegante con «Ana & Diego» puede romperse con «Valentina Sofía Robles Cámara», y ese es
 * exactamente el fallo que hay que descubrir en el panel y no en la invitación de un cliente.
 * Los tres ejemplos están elegidos por su forma —nombre corto con símbolo, nombre largo con
 * dos apellidos, nombre de una sola palabra—, no por variedad decorativa.
 *
 * ## Por qué pasan por el esquema
 *
 * `heroContentSchema.parse` corre al importar este archivo, así que un ejemplo mal formado
 * revienta en el arranque del panel en lugar de pintar una previsualización que no se parece a
 * lo que hará una invitación real. El ejemplo es una prueba del contrato, no una maqueta.
 *
 * Las fotografías son de Unsplash, el mismo origen ya permitido en `next.config.ts`. No se
 * usan imágenes del proyecto —las de la presentación de Kamilah— a propósito: una portada
 * de ejemplo con contenido de un cliente real se acaba colando en una captura de pantalla.
 */

const unsplash = (id: string): string =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

export const HERO_SAMPLES: readonly DemoSample<HeroContent>[] = [
  {
    key: 'presentacion',
    name: 'Presentación',
    content: heroContentSchema.parse({
      eventTypeLabel: 'Mi presentación · 3 años',
      intro: 'Con la bendición de Dios te invitamos a celebrar',
      celebrantName: 'Valentina Sofía',
      celebrantLastName: 'Robles Cámara',
      tagline:
        'Tres años de bendiciones. Primero damos gracias ante Cristo y después… ¡que empiece la fiesta!',
      dateLabel: 'Sábado 17 de abril, 2027',
      city: 'Mérida, Yucatán',
      startsAt: '2027-04-17T12:00:00-06:00',
      image: {
        url: unsplash('photo-1602631985686-1bb0e6a8696e'),
        alt: 'Mesa de fiesta infantil decorada con globos de colores',
      },
      action: { label: 'Saber más', href: '#historia' },
    }),
  },
  {
    key: 'xv-anios',
    name: 'XV Años',
    content: heroContentSchema.parse({
      eventTypeLabel: 'Mis XV años',
      intro: 'Mis papás y yo te invitamos a celebrar',
      celebrantName: 'Renata',
      celebrantLastName: 'Villanueva Sosa',
      tagline: 'Una noche para bailar, reír y quedarnos con el recuerdo.',
      dateLabel: 'Sábado 6 de noviembre, 2027',
      city: 'Valladolid, Yucatán',
      startsAt: '2027-11-06T20:00:00-06:00',
      image: {
        url: unsplash('photo-1530103862676-de8c9debad1d'),
        alt: 'Salón iluminado con luces cálidas durante una celebración',
      },
      action: { label: 'Ver la invitación', href: '#historia' },
    }),
  },
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
      image: {
        url: unsplash('photo-1560421683-6856ea585c78'),
        alt: 'Mesa larga montada al aire libre para una boda',
      },
      action: { label: 'Confirmar asistencia', href: '#rsvp' },
    }),
  },
];
