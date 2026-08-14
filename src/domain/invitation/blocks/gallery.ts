import { z } from 'zod';
import { blockImageSchema, line } from './shared';

/**
 * El contenido del bloque **galería**, y con él el contrato de sus cinco componentes.
 *
 * Es el bloque que más se mira y el que más pesa: seis o doce fotografías en la invitación que
 * se abre desde WhatsApp con datos móviles. Todo lo que hay aquí está pensado alrededor de eso.
 *
 * ## Por qué las medidas viajan con la foto
 *
 * `width` y `height` son opcionales pero valiosos, y no son un detalle técnico: sin ellos el
 * navegador no sabe cuánto sitio reservar y la página **salta** cada vez que carga una imagen
 * —el invitado está leyendo y el texto se le mueve—. Además, la mampostería necesita conocer la
 * proporción de cada foto antes de tenerla: es lo que la distingue de una rejilla.
 *
 * La tabla `event_gallery_items` ya guarda las dos columnas, así que el dato existe desde el
 * día en que se sube la foto. Cuando falta —una URL pegada a mano— los componentes se apañan:
 * ver `aspectRatioOf`.
 *
 * ## Por qué no hay ninguna opción de disposición
 *
 * Ni columnas, ni alto, ni «mostrar en carrusel». Eso es precisamente lo que distingue a un
 * componente de otro: si la galería en rejilla tuviera una opción de columnas y la de
 * mampostería otra de anchura, el contenido dejaría de poder pasar de una a otra sin
 * reconfigurarse — y cambiar de componente es justo lo que tiene que ser gratis.
 */

/**
 * Una fotografía de la galería.
 *
 * `caption` es opcional y casi siempre sobra: una galería de recuerdos se lee sola. Existe para
 * los casos en los que la foto necesita contexto —«La casa donde crecimos», «Mérida, 2019»— y
 * los componentes la enseñan al ampliar la imagen, no encima de la rejilla, donde convertiría
 * un mosaico en una lista de pies de foto.
 */
export const galleryItemSchema = blockImageSchema.extend({
  caption: line(160).nullable().default(null),
  /** Ancho y alto reales en píxeles. Evitan el salto de maqueta y alimentan la mampostería. */
  width: z.number().int().positive().max(20000).nullable().default(null),
  height: z.number().int().positive().max(20000).nullable().default(null),
});

export type GalleryItem = z.output<typeof galleryItemSchema>;

export const galleryContentSchema = z.object({
  /** El rótulo pequeño de arriba: «Tres años de recuerdos». */
  eyebrow: line(60).nullable().default(null),
  title: line(120),
  subtitle: line(200).nullable().default(null),
  /**
   * Las fotografías, en el orden en que se enseñan.
   *
   * Mínimo dos: con una sola no hay galería, hay una imagen —y para eso la historia y los
   * detalles ya tienen la suya—. El tope de veinticuatro es de producto y no de código: pasado
   * ese número, ninguna disposición evita que el invitado deje de mirarlas, y el peso de la
   * página deja de ser razonable en una conexión móvil.
   */
  items: z.array(galleryItemSchema).min(2).max(24),
  /** La nota al pie: «Habrá álbum compartido después del evento». */
  note: line(240).nullable().default(null),
});

/** El contenido de una galería, ya validado y con los valores por defecto puestos. */
export type GalleryContent = z.output<typeof galleryContentSchema>;

/** Lo que se guarda en `event_blocks.config`, antes de aplicar los valores por defecto. */
export type GalleryContentInput = z.input<typeof galleryContentSchema>;

/**
 * Las proporciones de reserva, cuando la foto no trae medidas.
 *
 * No es una lista decorativa: son las cuatro proporciones que produce un teléfono —vertical de
 * retrato, cuadrada, vertical suave y apaisada—, y se reparten por posición para que una
 * mampostería sin medidas siga pareciendo una mampostería y no una rejilla disfrazada.
 */
const FALLBACK_RATIOS = [4 / 5, 1, 3 / 4, 4 / 3] as const;

/**
 * La proporción de una foto: la real si se conoce, y si no una estable por posición.
 *
 * «Estable» es la palabra importante. Podría sortearse al azar y quedaría más variado, pero
 * cambiaría en cada render —y en cada recarga la galería se recolocaría entera—, además de dar
 * HTML distinto en el servidor y en el cliente. Derivarla del índice la hace idéntica siempre.
 */
export function aspectRatioOf(item: GalleryItem, index: number): number {
  if (item.width && item.height) return item.width / item.height;

  return FALLBACK_RATIOS[index % FALLBACK_RATIOS.length] as number;
}
