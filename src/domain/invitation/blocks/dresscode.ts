import { z } from 'zod';
import { blockActionSchema, line } from './shared';

/**
 * El contenido del bloque **código de vestimenta**, y con él el contrato de sus componentes.
 *
 * Es la sección que responde a la única pregunta que un invitado se hace delante del armario:
 * «¿de qué me visto?». Y la responde **enseñando la paleta**, que es la parte que un texto no
 * consigue: «tonos tierra y verdes suaves» significa una cosa distinta para cada persona, y
 * cinco círculos de color no dejan lugar a interpretación.
 *
 * ## Por qué no es un detalle más de la lista de detalles
 *
 * Porque los colores no caben en `DetailItem`. Un detalle es un icono, un rótulo y un texto; una
 * paleta es una lista de valores de color que el componente tiene que **pintar**. Con el bloque
 * de detalles habría dos salidas y las dos malas: escribir los colores en la descripción —«verde
 * oliva, arena, marfil», o sea otra vez palabras— o meter un campo de colores en un contrato que
 * comparten cuatro variantes que no lo usarían.
 *
 * El código de vestimenta que **sí** cabe en los detalles sigue cabiendo: «Etiqueta rigurosa» con
 * su icono de camisa es un detalle. Este bloque es para cuando la paleta es la instrucción.
 *
 * ## Por qué el color es un hexadecimal y nada más
 *
 * Estos valores acaban en el atributo `style` de un elemento, y ese es el sitio donde un texto
 * libre se convierte en un problema: `rgba()` y `color-mix()` son legítimos, pero admitir texto
 * libre obliga a decidir qué se hace con `;`, con `url(` y con lo que venga detrás. Un
 * hexadecimal se valida con una expresión regular de una línea y expresa todo lo que una paleta
 * de vestimenta necesita, incluida la transparencia. Es la misma decisión que en
 * `domain/invitation/theme.ts`, un paso más estricta porque aquí el valor lo escribe un cliente
 * y no quien mantiene el catálogo.
 */

/**
 * Un color en hexadecimal: `#abc`, `#abcd`, `#aabbcc` o `#aabbccdd`.
 *
 * Se guarda tal como se escribe, sin normalizar a seis dígitos. Es contenido de un evento y lo
 * más probable es que venga copiado de la paleta que la novia armó en otra herramienta;
 * reescribirlo haría que lo que se guarda no coincida con lo que se pegó, y eso confunde a quien
 * vuelve a abrir el panel a comprobarlo.
 */
const hexColor = z
  .string()
  .trim()
  .regex(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i, 'Debe ser un color hexadecimal: #7d8b6a');

/**
 * El acabado de una muestra.
 *
 * `metallic` es el dorado, el cobre y el champán, y no es un capricho: son los colores que más
 * aparecen en una paleta de boda y los únicos que un color plano no puede representar. Un dorado
 * pintado como un plano beige se lee como beige, y el invitado que va a comprar una corbata se
 * equivoca de tienda. El brillo lo dibuja el componente; el contenido solo dice qué es metálico.
 */
export const swatchFinishSchema = z.enum(['flat', 'metallic']).default('flat');

export type SwatchFinish = z.output<typeof swatchFinishSchema>;

export const dresscodeSwatchSchema = z.object({
  color: hexColor,
  /**
   * Cómo se llama el color: «Verde oliva», «Arena».
   *
   * Opcional porque una paleta no siempre se nombra —y en la papelería casi nunca—, pero cuando
   * está es lo que hace que la sección funcione para quien no distingue los colores o no ve la
   * pantalla. Los componentes lo aprovechan: con nombres, la fila de muestras es información
   * anunciable; sin ellos es decoración, y se marca como tal. Ver `DresscodePalette`.
   */
  label: line(40).nullable().default(null),
  finish: swatchFinishSchema,
});

export type DresscodeSwatch = z.output<typeof dresscodeSwatchSchema>;

export const dresscodeContentSchema = z.object({
  /** El rótulo pequeño de arriba: «Para que vayamos a juego». */
  eyebrow: line(60).nullable().default(null),
  title: line(120),
  /**
   * La instrucción, en cuerpo de lectura.
   *
   * Es donde va lo que el color no dice: «etiqueta», «evita el blanco», «tacón bajo, la
   * ceremonia es en el jardín». La paleta enseña el tono; esto pone las reglas.
   */
  description: line(400).nullable().default(null),
  /**
   * La paleta, en el orden en que se enseña.
   *
   * Mínimo dos —una sola muestra no es una paleta, es un detalle— y máximo seis: pasado ese
   * número deja de ser una indicación y se convierte en un muestrario en el que ya cabe
   * cualquier cosa, que es justo lo contrario de lo que el bloque viene a resolver.
   */
  palette: z.array(dresscodeSwatchSchema).min(2).max(6),
  /** La salida a más ideas: un tablero de Pinterest, una carpeta de fotos. */
  action: blockActionSchema.nullable().default(null),
  /** La nota al pie: «Si tienes dudas, escríbenos y te ayudamos». */
  note: line(240).nullable().default(null),
});

/** El contenido del código de vestimenta, ya validado y con los valores por defecto puestos. */
export type DresscodeContent = z.output<typeof dresscodeContentSchema>;

/** Lo que se guarda en `event_blocks.config`, antes de aplicar los valores por defecto. */
export type DresscodeContentInput = z.input<typeof dresscodeContentSchema>;
