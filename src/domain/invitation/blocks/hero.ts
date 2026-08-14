import { z } from 'zod';
import { blockActionSchema, blockImageSchema, isoInstant, line } from './shared';

/**
 * El contenido del bloque **portada**, y con él el contrato que toda variante cumple.
 *
 * `docs/PROJECT.md` lo pide en una línea —«todas las variantes deberán implementar la misma
 * interfaz»— y este archivo es donde eso deja de ser una intención. Una variante no recibe lo
 * que le convenga a su diseño: recibe esto, entero, y decide cómo pintarlo. Por eso cambiar
 * `hero.classic` por `hero.split` en un evento no toca ningún dato ni ninguna otra parte del
 * sistema.
 *
 * ## Por qué vive en el dominio y no junto a los componentes
 *
 * Porque es la forma de `event_blocks.config` —la columna jsonb donde el panel guarda lo que
 * el admin escribe—, y esa forma tiene que existir antes y por encima de cualquier
 * componente. El esquema es a la vez el contrato de render y el validador de escritura: si
 * alguien guarda una portada sin fecha, falla al guardarla, no al renderizarla en el móvil de
 * un invitado.
 *
 * ## Por qué campos partidos y no un bloque de texto
 *
 * `celebrantName` y `celebrantLastName` van separados, igual que en la tabla `events`, porque
 * cada variante los compone distinto: la clásica los apila, la partida pone el apellido en
 * versalitas debajo y una futura variante podría querer solo el nombre. Unirlos aquí obligaría
 * a que todas eligieran la misma composición — que es justo lo que una variante debe poder
 * decidir.
 *
 * ## Qué NO está aquí
 *
 * Colores, tipografías y espaciados. Eso lo pone el tema, y un tema nunca viaja dentro del
 * contenido: si `heroContentSchema` tuviera un campo `color`, cambiar de tema dejaría de
 * cambiar el aspecto del evento y habría que editar cada bloque a mano.
 */

export const heroContentSchema = z.object({
  /** El rótulo pequeño de arriba: «Mis XV años», «Nuestra boda». */
  eventTypeLabel: line(60).nullable().default(null),
  /** La frase de invitación previa al nombre: «Con la bendición de Dios te invitamos a…». */
  intro: line(240).nullable().default(null),
  celebrantName: line(80),
  celebrantLastName: line(80).nullable().default(null),
  tagline: z.string().trim().max(400).nullable().default(null),
  /**
   * La fecha **tal como se lee** («Sábado 17 de octubre, 2026»), aparte del instante.
   *
   * No se deriva de `startsAt` formateando en el servidor porque las dos cosas no siempre
   * coinciden: hay invitaciones que muestran «Octubre 2026» o «El día de nuestra boda» y aun
   * así necesitan el instante exacto para la cuenta regresiva. Derivarla obligaría a meter un
   * catálogo de formatos en el bloque para cubrir casos que se resuelven escribiéndola.
   */
  dateLabel: line(80),
  city: line(80).nullable().default(null),
  /** El instante del evento, en ISO con zona. Alimenta la cuenta regresiva. */
  startsAt: isoInstant,
  image: blockImageSchema.nullable().default(null),
  /** Si la portada muestra la cuenta regresiva. Es contenido, no diseño: el organizador decide. */
  showCountdown: z.boolean().default(true),
  action: blockActionSchema.nullable().default(null),
});

/**
 * El contenido de una portada, ya validado.
 *
 * `z.input` sería el objeto que se guarda —con campos ausentes—; este es el de salida, con los
 * `null` y los `true` ya puestos. Las variantes reciben siempre esta forma, así que ninguna
 * tiene que escribir `content.showCountdown ?? true` ni preguntarse si un campo llegó.
 */
export type HeroContent = z.output<typeof heroContentSchema>;

/** Lo que se guarda en `event_blocks.config`, antes de aplicar los valores por defecto. */
export type HeroContentInput = z.input<typeof heroContentSchema>;
