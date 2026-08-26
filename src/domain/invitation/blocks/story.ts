import { z } from 'zod';
import { blockImageSchema, line } from './shared';

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
 ## Por qué la historia no tiene botón
 *
 * Lo tuvo, y era un error de bloque. El contenido de demo lo llenaba con «Confirmar asistencia»
 * apuntando a `#rsvp`, o sea que el bloque que **cuenta** terminaba con la llamada a la acción del
 * bloque que **pide** — dos veces la misma petición en la misma invitación, y la primera antes de
 * haber dado la fecha o el lugar. En una invitación el remate de la historia es la firma
 * manuscrita, y después viene el resto de la página.
 *
 * No se quita solo del render: se quita del contrato. Un campo que ninguna de las cinco variantes
 * pinta es una pregunta que el panel seguiría haciendo y que nadie responde — la misma razón por
 * la que `hero.quince` no mete su «XV» en el contrato de las seis portadas.
 *
 * `event_blocks.config` puede traerlo de eventos ya guardados y no pasa nada: el esquema no es
 * estricto, así que la clave sobrante se descarta al validar.
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
});

/** El contenido de una historia, ya validado y con los valores por defecto puestos. */
export type StoryContent = z.output<typeof storyContentSchema>;

/** Lo que se guarda en `event_blocks.config`, antes de aplicar los valores por defecto. */
export type StoryContentInput = z.input<typeof storyContentSchema>;

/**
 * La cita que hay que pintar: la misma, sin autor cuando la firma ya dice ese nombre.
 *
 * De las dos piezas se sacrifica el autor y se conserva la firma, y no al revés. La firma es la
 * única manuscrita del bloque y su remate; el autor en versalitas cae justo encima de un botón
 * que también va en versalitas espaciadas, así que quitándolo desaparece además una tercera
 * línea del mismo registro seguida de otras dos.
 *
 * Vive en el dominio y no en la variante porque son cuatro las que pintan una historia: la
 * primera que se olvidara de aplicarlo volvería a enseñar el nombre repetido, y esta es
 * exactamente la clase de decisión que `paragraphsFromText` ya toma una vez para todas.
 */
export function visibleHighlight(content: StoryContent): StoryContent['highlight'] {
  const { highlight, signature } = content;
  if (!highlight?.author) return highlight;
  if (!sameSignatory(highlight.author, signature)) return highlight;
  return { ...highlight, author: null };
}

/**
 * ¿El autor de la cita y la firma son la misma persona?
 *
 * Existe porque la historia tiene **dos** campos que suelen traer el mismo nombre sin que nadie
 * se equivoque al llenarlos: `highlight.author` es quién dice la frase destacada, y `signature`
 * es quién firma el bloque. Son datos distintos —la cita puede ser de la abuela y la firma de
 * los novios— y por eso los dos siguen existiendo. Pero cuando coinciden, la sección enseña el
 * mismo nombre dos veces seguidas en dos tipografías distintas, y eso no se lee como dos piezas
 * de una lámina: se lee como un fallo.
 *
 * La comparación es tolerante a propósito, porque el parecido que hay que detectar es el que ve
 * un invitado y no el que ve un `===`. «Ana y Diego» y «Ana & Diego» son el mismo nombre escrito
 * dos veces por la misma persona en dos casillas de un formulario; también lo son «ANA Y DIEGO»
 * y «Ana y Diego». Así que se comparan sin mayúsculas, sin tildes, sin puntuación y con el `&`
 * leído como la «y» que es.
 *
 * Lo que **no** hace es adivinar más allá de eso: «Ana» y «Ana y Diego» son nombres distintos, y
 * «Con cariño, tus papás» junto a «Tus papás» también. En la duda se pintan los dos, que es el
 * lado seguro: sobra un nombre, no falta uno.
 */
function sameSignatory(one: string | null, other: string | null): boolean {
  if (!one || !other) return false;
  return foldName(one) === foldName(other);
}

/** El nombre reducido a lo que se compara: minúsculas, sin tildes y sin adornos. */
function foldName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' y ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

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
