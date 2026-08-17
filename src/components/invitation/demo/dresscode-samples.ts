import {
  dresscodeContentSchema,
  type DresscodeContent,
} from '@/domain/invitation/blocks/dresscode';
import type { DemoSample } from './sample';

/**
 * Contenido de ejemplo para ver el código de vestimenta sin tener que crear un evento.
 *
 * Mismas claves que el resto de bloques —los mismos tres eventos imaginarios— para poder saltar de
 * la portada al código de vestimenta sin que cambie el evento debajo.
 *
 * Los tres cubren las decisiones que este bloque tiene que aguantar:
 *
 *   · **Presentación**: paleta corta, **con nombres** y sin metálicos. Es el caso en el que la fila
 *     de muestras es información anunciable — ver `DresscodePalette`.
 *   · **XV Años**: seis muestras, el tope del contrato, y dos metálicas. Es la comprobación de que
 *     la fila envuelve en un móvil sin descuadrarse y de que el brillo funciona en dos tonos
 *     distintos.
 *   · **Boda**: cinco muestras **sin nombre** y un marfil casi del color del papel. Las dos cosas
 *     que se rompen solas: la fila queda decorativa, y el marfil solo se ve si el filete exterior
 *     está donde tiene que estar.
 */

export const DRESSCODE_SAMPLES: readonly DemoSample<DresscodeContent>[] = [
  {
    key: 'presentacion',
    name: 'Presentación',
    content: dresscodeContentSchema.parse({
      eyebrow: 'Para la foto de familia',
      title: 'Código de vestimenta',
      description:
        'Vestimenta casual elegante. Para la foto de todos juntos nos gustaría que fuera en estos tonos, pero ven como estés más cómodo.',
      palette: [
        { color: '#c8d3c5', label: 'Verde agua', finish: 'flat' },
        { color: '#efe3d3', label: 'Arena', finish: 'flat' },
        { color: '#d9b7a5', label: 'Terracota', finish: 'flat' },
      ],
      action: null,
      note: 'Los niños, cómodos: hay brincolín y jardín.',
    }),
  },
  {
    key: 'xv-anios',
    name: 'XV Años',
    content: dresscodeContentSchema.parse({
      eyebrow: 'La noche pide etiqueta',
      title: 'Dress code',
      description:
        'Etiqueta formal: vestido largo y traje oscuro. Te pedimos evitar el blanco y el rosa palo, que son los colores de la festejada.',
      /* Seis, el tope del contrato, y dos con brillo. La fila tiene que envolver en un móvil sin
         que las muestras se aplasten. */
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
  {
    key: 'boda',
    name: 'Boda',
    content: dresscodeContentSchema.parse({
      eyebrow: 'Para que vayamos a juego',
      title: 'Dress code',
      description:
        'Formal de jardín. Nos hace muy felices que uses estos tonos, y te pedimos reservar el blanco para la novia.',
      /*
       * Sin nombres a propósito: es como se entrega casi toda la papelería, y el estado en el que
       * la fila de muestras pasa a ser decorativa. El marfil es además el color que desaparece si
       * al componente se le olvida el filete exterior.
       */
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
];
