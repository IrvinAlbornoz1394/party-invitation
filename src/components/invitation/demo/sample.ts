/**
 * Un contenido de ejemplo con el que ver un bloque sin crear un evento.
 *
 * El tipo es genérico porque cada bloque tiene su propio contrato de contenido, y es el
 * genérico el que permite que el panel ofrezca los ejemplos de un bloque sin saber qué bloque
 * es: la lista se presenta por `key` y `name`, y el `content` solo lo toca quien ya estrechó
 * la entrada del registro y sabe qué tipo tiene delante.
 *
 * Los ejemplos de todos los bloques comparten las mismas claves —`presentacion`, `xv-anios`,
 * `boda`— a propósito. Así, al cambiar de portada a historia en la previsualización, el
 * ejemplo elegido se mantiene y lo que se compara es el bloque, no dos contenidos distintos.
 */
export interface DemoSample<TContent> {
  readonly key: string;
  /** Cómo se ofrece en el selector del panel. */
  readonly name: string;
  readonly content: TContent;
}

/** Los datos que el selector necesita, sin arrastrar el contenido entero. */
export interface DemoSampleOption {
  readonly key: string;
  readonly name: string;
}
