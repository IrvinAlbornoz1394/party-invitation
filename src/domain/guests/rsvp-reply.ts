import { z } from 'zod';

/**
 * Lo que una familia responde desde su enlace.
 *
 * Unión discriminada y no campos sueltos: quien va dice **cuántos** y quien no va puede decir
 * **por qué**, y ninguna de las dos cosas tiene sentido en la otra rama. Un «no voy, somos 4»
 * guardado no significaría nada y ensuciaría la cuenta de lugares.
 *
 * El tope de asistentes no está aquí porque no es del contrato sino de la familia: lo comprueba
 * el repositorio contra su cupo, en la misma transacción en la que guarda.
 */
export const RSVP_MESSAGE_MAX = 500;

export const rsvpReplySchema = z.discriminatedUnion('attending', [
  z.object({
    attending: z.literal(true),
    attendees: z.number().int().min(1, 'Confirma al menos un lugar.'),
  }),
  z.object({
    attending: z.literal(false),
    message: z
      .string()
      .trim()
      .max(RSVP_MESSAGE_MAX, `El mensaje admite hasta ${RSVP_MESSAGE_MAX} caracteres.`)
      .transform((value) => (value.length === 0 ? null : value))
      .nullable()
      .default(null),
  }),
]);

export type RsvpReply = z.output<typeof rsvpReplySchema>;

export type SubmitRsvpResult =
  | { readonly outcome: 'saved' }
  /** El enlace no es de una familia, o la invitación ya no acepta respuestas. */
  | { readonly outcome: 'closed' }
  | { readonly outcome: 'invalid'; readonly reason: string }
  | { readonly outcome: 'rate-limited' }
  | { readonly outcome: 'denied' };

export interface SubmitRsvpRequest {
  readonly slug: string;
  readonly code: string;
  readonly reply: RsvpReply;
  readonly clientIp: string | null;
  readonly userAgent: string | null;
}
