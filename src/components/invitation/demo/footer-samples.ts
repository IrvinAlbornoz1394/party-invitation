import { footerContentSchema, type FooterContent } from '@/domain/invitation/blocks/footer';
import type { DemoSample } from './sample';

/**
 * Contenido de ejemplo para ver el pie sin tener que crear un evento.
 *
 * Mismas claves que el resto de bloques. Lo que cambia entre los dos es lo que decide si un pie
 * funciona: **el largo del nombre** y cuántos contactos hay.
 *
 *   · **Boda**: dos nombres unidos por un símbolo, dos contactos y sin monograma — para ver que
 *     el hueco de las iniciales no deja un agujero cuando no las hay.
 *   · **XV**: un nombre largo con dos apellidos y tres contactos. Es el que aprieta al pie en
 *     cinta y el que hace que el rótulo en movimiento se lea como un texto corriendo.
 */

export const FOOTER_SAMPLES: readonly DemoSample<FooterContent>[] = [
  {
    key: 'boda',
    name: 'Boda',
    content: footerContentSchema.parse({
      monogram: null,
      names: 'Ana & Diego',
      dateLabel: 'Sábado 12 de junio, 2027',
      city: 'Izamal, Yucatán',
      message: 'Cualquier duda, escríbenos. De verdad.',
      links: [
        { icon: 'guests', label: 'Escríbenos por WhatsApp', href: 'https://wa.me/529999876543' },
        { icon: 'location', label: 'Cómo llegar', href: '#ubicacion' },
      ],
      credits: '© 2027 · Ana & Diego',
      topAction: { label: 'Volver al inicio', href: '#inicio' },
    }),
  },
  {
    key: 'quince',
    name: 'XV Años',
    content: footerContentSchema.parse({
      monogram: 'R',
      names: 'Renata Villanueva Sosa',
      dateLabel: 'Sábado 6 de noviembre, 2027',
      city: 'Valladolid, Yucatán',
      message: 'Gracias por acompañarme en una noche tan importante para mí.',
      links: [
        { icon: 'phone', label: '985 100 2030', href: 'tel:9851002030' },
        { icon: 'guests', label: 'WhatsApp', href: 'https://wa.me/529851002030' },
        { icon: 'camera', label: '@renata.xv', href: 'https://instagram.com/renata.xv' },
      ],
      credits: '© 2027 · Familia Villanueva Sosa',
      topAction: { label: 'Volver al inicio', href: '#inicio' },
    }),
  },
];
