import { z } from 'zod';
import { blockActionSchema, blockImageSchema, line } from './shared';

/**
 * El contenido del bloque **historia**, y con él el contrato de sus cuatro variantes.
 *
 * Es el bloque que cuenta por qué existe la celebración: los tres años de una niña, cómo se
 * conocieron los novios, qué se agradece. Las cuatro variantes lo colocan de forma muy
 * distinta —imagen a un lado, imagen al otro, columna centrada, texto sobre la fotografía— y
 * las cuatro reciben exactamente esto. Cambiar de variante en un evento no toca ni un dato.
 *
 * ## Por qué el cuerpo es una lista de párrafos
 *
 * `events.story` es hoy una sola columna de texto, y la tentación es pasarla tal cual y
 * partirla al pintar. No se hace: cada variante tendría que decidir por su cuenta dónde parte
 * —o peor, una lo haría y otra no—, y ahí se acaba la promesa de que las cuatro pintan el
 * mismo contenido. La separación en párrafos es una decisión de **contenido**, se toma una vez
 * al guardar (ver {@link paragraphsFromText}) y llega decidida a las variantes.
 *
 * El tope de seis párrafos no es arbitrario: la historia es un bloque de una invitación que se
 * lee en el móvil, no un artículo. Pasado eso conviene otro bloque, no un texto más largo.
 *
 * ## Qué es opcional y por qué
 *
 * Todo menos el título y el cuerpo. La imagen sobre todo: hay eventos que llegan sin una sola
 * foto usable, y las cuatro variantes tienen que sostenerse sin ella —incluida la que la pone
 * de fondo—. Que el bloque se vea bien vacío es lo que permite que el admin lo arme por partes
 * en lugar de tener que reunir todo el material antes de empezar.
 */

/** Una cita destacada dentro de la historia: la frase que se quiere que quede. */
export const storyHighlightSchema = z.object({
  quote: line(320),
  /** Quién la dice. Sin autor, la cita se lee como voz de quien invita, que suele bastar. */
  author: line(80).nullable().default(null),
});

export const storyContentSchema = z.object({
  /** El rótulo pequeño de arriba: «Tres años de bendiciones», «Nuestra historia». */
  eyebrow: line(60).nullable().default(null),
  title: line(120),
  subtitle: line(200).nullable().default(null),
  /** El texto, ya partido en párrafos. Al menos uno: una historia sin cuerpo no es un bloque. */
  body: z.array(z.string().trim().min(1).max(1200)).min(1).max(6),
  highlight: storyHighlightSchema.nullable().default(null),
  image: blockImageSchema.nullable().default(null),
  /** La firma manuscrita del final: «Con cariño, tus papás». Se pinta con la fuente `script`. */
  signature: line(80).nullable().default(null),
  action: blockActionSchema.nullable().default(null),
});

/** El contenido de una historia, ya validado y con los valores por defecto puestos. */
export type StoryContent = z.output<typeof storyContentSchema>;

/** Lo que se guarda en `event_blocks.config`, antes de aplicar los valores por defecto. */
export type StoryContentInput = z.input<typeof storyContentSchema>;

/**
 * Parte un texto corrido en párrafos.
 *
 * Es la conversión desde `events.story` —una sola columna de texto, como se escribió en su
 * día— al cuerpo del bloque. Vive en el dominio y no en el formulario del panel porque la va a
 * necesitar todo el que traiga contenido de fuera: la migración de los eventos que ya existen,
 * una importación futura, y el propio formulario.
 *
 * Corta por línea en blanco y no por salto de línea simple: en un `<textarea>` la gente
 * separa párrafos con una línea vacía y usa el salto suelto para cortar una frase larga.
 * Cortando por cada salto, un texto normal saldría troceado en frases sueltas.
 */
export function paragraphsFromText(text: string): readonly string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}
