import { footerContentSchema, type FooterContent } from '@/domain/invitation/blocks/footer';
import type { DemoSample } from './sample';

/**
 * Contenido de ejemplo para ver el pie sin tener que crear un evento.
 *
 * Mismas claves que el resto de bloques. Lo que cambia entre los tres es lo que decide si un pie
 * funciona: **el largo del nombre** y cuántos contactos hay.
 *
 *   · **Presentación**: nombre completo largo y tres contactos. Es el que aprieta al pie en
 *     cinta y el que hace que el rótulo en movimiento se lea como un texto corriendo.
 *   · **XV Años**: un solo nombre y un contacto. El caso en el que el rótulo luce.
 *   · **Boda**: dos nombres unidos y dos contactos, sin monograma — para ver que el hueco de las
 *     iniciales no deja un agujero cuando no las hay.
 */

export const FOOTER_SAMPLES: readonly DemoSample<FooterContent>[] = [
  {
    key: 'presentacion',
    name: 'Presentación',
    content: footerContentSchema.parse({
      monogram: 'V',
      names: 'Valentina Sofía Robles Cámara',
      dateLabel: 'Sábado 17 de abril, 2027',
      city: 'Mérida, Yucatán',
      message: 'Gracias por acompañarnos en un día tan importante para nosotros.',
      links: [
        { icon: 'phone', label: '999 123 4567', href: 'tel:9991234567' },
        { icon: 'guests', label: 'WhatsApp', href: 'https://wa.me/529991234567' },
        { icon: 'camera', label: '@familiarobles', href: 'https://instagram.com/familiarobles' },
      ],
      credits: '© 2027 · Ana Cámara y Luis Robles',
      topAction: { label: 'Volver al inicio', href: '#inicio' },
    }),
  },
  {
    key: 'xv-anios',
    name: 'XV Años',
    content: footerContentSchema.parse({
      monogram: 'R',
      names: 'Renata',
      dateLabel: 'Sábado 6 de noviembre, 2027',
      city: 'Valladolid, Yucatán',
      message: null,
      links: [{ icon: 'phone', label: '985 100 2030', href: 'tel:9851002030' }],
      credits: '© 2027 · Familia Villanueva Sosa',
      topAction: { label: 'Volver al inicio', href: '#inicio' },
    }),
  },
  {
    key: 'boda',
    name: 'Boda',
    content: footerContentSchema.parse({
      // Sin monograma: para comprobar que su ausencia no deja un hueco en ninguno de los tres.
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
];
