import { z } from 'zod';
import { isSupportedTimeZone } from './event-time-zone';

/**
 * Los datos del alta de un evento que se pueden corregir después: título, fecha y hora, plan,
 * plantilla y tema.
 *
 * Es «editar el evento», y es otra cosa que «editar la invitación». Esto es lo que se vendió y
 * cómo se arma —la parte de la plataforma—; el contenido que leen los invitados se edita en
 * `/admin/eventos/[id]/contenido` y lo describe `event-content-draft.ts`.
 *
 * ## Lo que se queda fuera, a propósito
 *
 * - **La dirección.** Una invitación publicada ya se repartió con ese enlace; cambiarlo deja a
 *   todos los invitados con una dirección muerta.
 * - **El cliente y el tipo de celebración.** Cambiar cualquiera de los dos es, en la práctica,
 *   otro evento.
 * - **Quién celebra.** Es contenido: se corrige en la portada, desde el editor de la invitación.
 *
 * ## Cambiar plan o plantilla rehace la composición
 *
 * Qué secciones lleva la invitación se decidió al darla de alta copiando la plantilla y apagando
 * lo que el plan no cubre. Si cambia cualquiera de las dos, esa decisión se vuelve a tomar —lo
 * hace el repositorio, en la misma transacción—. Ver `EventRepository.updateDetails`.
 *
 * ## Cambiar algo despublica
 *
 * Un evento publicado que cambia cualquiera de estos datos vuelve a borrador: la invitación deja de
 * verse hasta que alguien la revise y la vuelva a publicar. La vigencia no se reinicia al
 * republicar. Es la misma regla que aplica el editor de la invitación a su contenido.
 */

/** El evento tal como lo necesita el formulario de edición, con la fecha ya en su hora local. */
export interface EditableEventDetails {
  readonly id: string;
  readonly clientId: string;
  readonly status: string;
  readonly title: string;
  readonly eventTypeKey: string;
  readonly planKey: string;
  readonly templateId: string;
  readonly themeId: string;
  /** `YYYY-MM-DD` en la zona del evento. Ver `new-event.ts` sobre por qué viaja partida. */
  readonly date: string;
  /** `HH:MM` en la zona del evento. */
  readonly time: string;
  readonly timeZone: string;
}

export const eventDetailsSchema = z.object({
  title: z.string().trim().min(2, 'Escribe cómo se llamará el evento en el panel.').max(160),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige la fecha del evento.'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Elige la hora del evento.'),
  timeZone: z
    .string()
    .refine(isSupportedTimeZone, 'Elige la zona horaria en la que ocurre el evento.'),
  planKey: z.string().trim().min(1, 'Elige el plan contratado.'),
  templateId: z.uuid('Elige la plantilla con la que se arma la invitación.'),
  themeId: z.uuid('Elige el tema con el que se ve la invitación.'),
});

export type EventDetails = z.output<typeof eventDetailsSchema>;
export type EventDetailsInput = z.input<typeof eventDetailsSchema>;

export type UpdateEventDetailsResult =
  /** `unpublished`: estaba publicado y, como algo cambió, volvió a borrador. */
  | { readonly outcome: 'updated'; readonly unpublished: boolean }
  /** La plantilla no se ofrece para el tipo de este evento o para el plan elegido. */
  | { readonly outcome: 'incompatible-template' }
  /** El plan, la plantilla o el tema no existen. Solo pasa con una petición hecha a mano. */
  | { readonly outcome: 'unknown-catalog' }
  /** No existe, o no se puede abrir el contexto de su cliente. No se distinguen. */
  | { readonly outcome: 'forbidden' };
