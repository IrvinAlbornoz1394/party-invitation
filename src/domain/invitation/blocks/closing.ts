import { z } from 'zod';
import { blockActionSchema, blockIconSchema, blockImageSchema, line } from './shared';

/**
 * El contenido del bloque **mensaje final**, y con él el contrato de sus tres componentes.
 *
 * Es la despedida: la frase con la que se cierra la invitación —«tu presencia hará este día aún
 * más especial»— y la última cosa que el invitado lee antes de decidir si confirma. No es un
 * bloque decorativo: es el que convierte una lista de datos en una invitación de alguien a
 * alguien.
 *
 * ## Por qué el título es largo y el mensaje corto
 *
 * Al revés de lo que parece. Aquí el «título» **es la frase**, lo que se quiere que quede, y por
 * eso admite doscientos caracteres y se pinta en cuerpo grande. El `message` es la explicación
 * que va debajo en cuerpo de lectura, y casi siempre sobra: una despedida que necesita cuatro
 * líneas de aclaración ya no es una despedida.
 *
 * ## El icono
 *
 * Decorativo y con corazón por defecto. Es el único bloque donde un icono no señala nada —no
 * hay un detalle ni un hito que marcar— y su papel es puramente de remate: el punto final de la
 * invitación. Se deja configurable porque un corazón no encaja en un evento empresarial y una
 * copa sí.
 */
export const closingContentSchema = z.object({
  /** El rótulo pequeño de arriba: «Con mucho cariño». */
  eyebrow: line(60).nullable().default(null),
  /** La frase de despedida. Es lo que se pinta grande: aquí el título es el mensaje. */
  title: line(200),
  /** La explicación que acompaña, en cuerpo de lectura. Casi siempre sobra. */
  message: line(400).nullable().default(null),
  /** La firma manuscrita: «Con cariño, sus papás». Se pinta con la tipografía `script`. */
  signature: line(80).nullable().default(null),
  /** El remate decorativo. Corazón por defecto; una copa para un evento de empresa. */
  icon: blockIconSchema.default('heart'),
  image: blockImageSchema.nullable().default(null),
  /** La última llamada a la acción: «Confirmar asistencia». */
  action: blockActionSchema.nullable().default(null),
});

/** El contenido del mensaje final, ya validado y con los valores por defecto puestos. */
export type ClosingContent = z.output<typeof closingContentSchema>;

/** Lo que se guarda en `event_blocks.config`, antes de aplicar los valores por defecto. */
export type ClosingContentInput = z.input<typeof closingContentSchema>;
