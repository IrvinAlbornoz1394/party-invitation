import { z } from 'zod';
import { WHATSAPP_NUMBER_HINT, normalizeWhatsappNumber } from '../events/whatsapp-number';

/**
 * Una familia invitada: la unidad con la que se invita y con la que se confirma.
 *
 * Es lo que vende la gestión de Premium. Cada familia recibe **su propio enlace** —el mismo
 * formato `/<slug>/<código>` que el general, con el código de la familia— y desde él responde
 * por todos los suyos: si van, cuántos, y si no, por qué. El enlace general de la invitación
 * sigue funcionando para verla, pero no registra respuestas: confirma por WhatsApp, como en los
 * planes sin gestión. Así ninguna respuesta guardada llega sin saber de quién es.
 *
 * ## Lugares y no adultos y niños
 *
 * El esquema separa `max_adults` y `max_children`, y aquí se trabaja con **un solo número**: los
 * lugares apartados. Es lo que se le pregunta al organizador —«¿cuántos son?»— y lo que se le
 * pregunta a la familia —«¿cuántos van?»—. Se guarda en `max_adults` con `max_children` a cero,
 * y la respuesta en `adults_count`; el día que haga falta distinguir, las columnas ya están.
 */

/** El tope de lugares por familia. Más que esto ya no es una familia, es un salón. */
export const MAX_GROUP_SEATS = 30;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable();

/** Lo que el organizador captura de una familia. */
export const guestGroupDraftSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Escribe cómo se llama esta familia o invitado.')
    .max(120, 'El nombre es demasiado largo.'),
  seats: z.coerce
    .number({ error: 'Indica cuántos lugares tiene apartados.' })
    .int('Los lugares van en número entero.')
    .min(1, 'Cada invitación aparta al menos un lugar.')
    .max(MAX_GROUP_SEATS, `Como máximo ${MAX_GROUP_SEATS} lugares por invitación.`),
  /* El WhatsApp de la familia, para mandarle su enlace en un toque. Opcional: hay quien prefiere
     repartirlos a mano. */
  phone: optionalText(40)
    .transform((value) => (value === null ? null : (normalizeWhatsappNumber(value) ?? '')))
    .refine((value) => value !== '', WHATSAPP_NUMBER_HINT),
  notes: optionalText(500),
});

export type GuestGroupDraft = z.output<typeof guestGroupDraftSchema>;

/** Lo que una familia respondió por última vez. */
export interface GuestGroupReply {
  readonly status: 'confirmed' | 'declined';
  /** Cuántos van. Cero cuando no van. */
  readonly attendees: number;
  /** El motivo que dejaron al no poder ir. Opcional, y solo existe al declinar. */
  readonly message: string | null;
  readonly respondedAt: Date;
}

export interface GuestGroup {
  readonly id: string;
  readonly name: string;
  readonly inviteCode: string;
  readonly seats: number;
  readonly phone: string | null;
  readonly notes: string | null;
  /** La respuesta vigente: la última. `null` mientras no responda. */
  readonly reply: GuestGroupReply | null;
}

/** La lista de invitados de un evento, con lo necesario para componer sus enlaces. */
export interface GuestList {
  readonly eventId: string;
  /** El título interno del panel. Solo lo lee el organizador: nunca va en lo que recibe una familia. */
  readonly eventTitle: string;
  /** A quién se celebra, como lo nombra la invitación: «María y José». Es lo que lee el invitado. */
  readonly celebrant: string;
  readonly eventSlug: string;
  readonly eventStatus: string;
  readonly groups: readonly GuestGroup[];
}

/** Las cifras que importan para organizar: cuántos vienen y cuántos faltan por responder. */
export interface RsvpSummary {
  readonly families: number;
  readonly seats: number;
  readonly confirmedFamilies: number;
  readonly attendees: number;
  readonly declinedFamilies: number;
  readonly pendingFamilies: number;
  /** Los lugares de las familias que no han respondido: lo que todavía puede llegar. */
  readonly pendingSeats: number;
}

export function summarizeGuestList(groups: readonly GuestGroup[]): RsvpSummary {
  let seats = 0;
  let confirmedFamilies = 0;
  let attendees = 0;
  let declinedFamilies = 0;
  let pendingFamilies = 0;
  let pendingSeats = 0;

  for (const group of groups) {
    seats += group.seats;

    if (group.reply?.status === 'confirmed') {
      confirmedFamilies += 1;
      attendees += group.reply.attendees;
    } else if (group.reply?.status === 'declined') {
      declinedFamilies += 1;
    } else {
      pendingFamilies += 1;
      pendingSeats += group.seats;
    }
  }

  return {
    families: groups.length,
    seats,
    confirmedFamilies,
    attendees,
    declinedFamilies,
    pendingFamilies,
    pendingSeats,
  };
}

/**
 * El mensaje con el que el organizador le manda a una familia su enlace.
 *
 * Nombra a la familia y dice que el enlace es suyo: es lo que hace que respondan desde ese y no
 * desde el general que les reenvió alguien más.
 *
 * Nombra la celebración por quien se celebra y no por el título del evento: ese título es el
 * rótulo interno del panel («Boda Pérez – salón 2») y no está escrito para que lo lea un invitado.
 * La frase es la misma que usan los mensajes de confirmación de la invitación.
 */
export function guestInviteMessage(groupName: string, celebrant: string, url: string): string {
  return `¡Hola, ${groupName}! Con mucho cariño les compartimos su invitación a la celebración de ${celebrant}. Este enlace es solo para ustedes; ahí mismo pueden confirmar su asistencia: ${url}`;
}
