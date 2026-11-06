import { z } from 'zod';
import { blockActionSchema, blockImageSchema, line } from './shared';

/**
 * El contenido del bloque **mesa de regalos**: cómo regalar, si se quiere.
 *
 * Es la sección «Your presence is a gift» de las plantillas de boda de mercado, y la pregunta que
 * más llega por WhatsApp después de «¿a qué hora es?»: dónde está la mesa. En México casi siempre
 * son una o dos tiendas —Liverpool, Palacio de Hierro, Amazon— con su número de evento, y muchas
 * veces la lluvia de sobres o una transferencia.
 *
 * ## Por qué cada mesa es texto y no un catálogo de tiendas
 *
 * Porque lo que cambia de una boda a otra es justo lo que no cabe en un catálogo: «Liverpool,
 * evento 51234567», «Lluvia de sobres el día de la boda», «Transferencia a BBVA, CLABE …». Con
 * `label` + `detail` + un enlace opcional caben todas sin que nadie tenga que mantener una lista de
 * tiendas y sus logotipos.
 *
 * ## Vive en el `config` del bloque
 *
 * Como los detalles: ninguna columna del evento sabe dónde está su mesa de regalos. El panel edita
 * las mesas como lista (ver `domain/events/event-block-lists.ts`).
 *
 * Las mesas pueden ser cero: hay parejas que solo quieren decir «su presencia es el mejor regalo»,
 * y la sección se compone con el mensaje solo.
 */

export const giftRegistrySchema = z.object({
  /** Dónde: «Liverpool», «Lluvia de sobres», «Transferencia». */
  label: line(60),
  /** El dato que hace falta para regalar: el número de evento, la CLABE, cuándo se entregan. */
  detail: line(240).nullable().default(null),
  /** El enlace a la mesa, si la tienda tiene página. */
  action: blockActionSchema.nullable().default(null),
});

export type GiftRegistry = z.output<typeof giftRegistrySchema>;

export const giftsContentSchema = z.object({
  eyebrow: line(60).nullable().default(null),
  title: line(120),
  /** El mensaje de siempre: que la presencia basta, y que si aun así quieren, aquí está la mesa. */
  message: line(600).nullable().default(null),
  registries: z.array(giftRegistrySchema).max(4).default([]),
  image: blockImageSchema.nullable().default(null),
  note: line(240).nullable().default(null),
});

export type GiftsContent = z.output<typeof giftsContentSchema>;

export type GiftsContentInput = z.input<typeof giftsContentSchema>;
