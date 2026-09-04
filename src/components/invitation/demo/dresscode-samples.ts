import {
  dresscodeContentSchema,
  type DresscodeContent,
} from '@/domain/invitation/blocks/dresscode';
import type { DemoSample } from './sample';

/**
 * Contenido de ejemplo para ver el código de vestimenta sin tener que crear un evento.
 *
 * Mismas claves que el resto de bloques para poder saltar de la portada aquí sin que cambie el
 * evento debajo. Los dos cubren las decisiones que este bloque tiene que aguantar:
 *
 *   · **Boda**: cinco muestras **sin nombre** y un marfil casi del color del papel. Las dos cosas
 *     que se rompen solas: la fila queda decorativa —un lector de pantalla no puede leer
 *     «#f4efe6» de forma útil—, y el marfil solo se ve si el filete exterior está donde debe.
 *   · **XV**: seis muestras, el tope del contrato, dos de ellas metálicas y todas **con nombre**.
 *     Comprueba que la fila envuelve en un móvil sin aplastarse y que el brillo funciona en dos
 *     tonos distintos.
 *
 * La petición de reservar un color —el blanco en una boda, el color de la festejada en unos XV— es
 * la misma idea contada distinto, y es lo que hace que este bloque no sea intercambiable entre los
 * dos tipos de evento aunque el componente sí lo sea.
 */

export const DRESSCODE_SAMPLES: readonly DemoSample<DresscodeContent>[] = [
  {
    key: 'boda',
    name: 'Boda',
    content: dresscodeContentSchema.parse({
      eyebrow: 'Para que vayamos a juego',
      title: 'Dress code',
      description:
        'Formal de jardín. Nos hace muy felices que uses estos tonos, y te pedimos reservar el blanco para la novia.',
      palette: [
        { color: '#5a6350', label: null, finish: 'flat' },
        { color: '#8d9479', label: null, finish: 'flat' },
        { color: '#d7c8b0', label: null, finish: 'flat' },
        { color: '#f4efe6', label: null, finish: 'flat' },
        { color: '#b79a63', label: null, finish: 'metallic' },
      ],
      action: null,
      note: null,
    }),
  },
  {
    key: 'quince',
    name: 'XV Años',
    content: dresscodeContentSchema.parse({
      eyebrow: 'La noche pide etiqueta',
      title: 'Dress code',
      description:
        'Etiqueta formal: vestido largo y traje oscuro. Te pido evitar el azul cielo, que es el color de la festejada.',
      palette: [
        { color: '#1d2230', label: 'Azul noche', finish: 'flat' },
        { color: '#4a3f5c', label: 'Ciruela', finish: 'flat' },
        { color: '#8e7d9b', label: 'Lavanda', finish: 'flat' },
        { color: '#c9a227', label: 'Oro', finish: 'metallic' },
        { color: '#b8b5b0', label: 'Plata', finish: 'metallic' },
        { color: '#2f3b34', label: 'Verde botella', finish: 'flat' },
      ],
      action: { label: 'Ver ideas de atuendo', href: 'https://www.pinterest.com' },
      note: 'Tacón cómodo: la pista es de madera y no pensamos parar.',
    }),
  },
];
