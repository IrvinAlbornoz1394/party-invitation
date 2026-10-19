import type { TenantScope } from '../auth/actor';
import type { GuestGroupDraft, GuestList } from './guest-group';
import type { SubmitRsvpRequest, SubmitRsvpResult } from './rsvp-reply';

/**
 * Puerto hacia la lista de invitados y sus confirmaciones.
 *
 * Tiene dos lados con autorizaciones que no se parecen en nada: el panel, que llega con un
 * alcance de membresía, y la invitación pública, que llega con un slug y un código. Los dos
 * escriben en las mismas tablas, y por eso viven en el mismo puerto.
 */
export interface GuestRepository {
  /** La lista con la última respuesta de cada familia. `null` si el evento no está en el alcance. */
  loadGuestList(scope: TenantScope, eventId: string): Promise<GuestList | null>;

  /** Da de alta una familia con su código. `false` si el evento no está en el alcance. */
  createGroup(scope: TenantScope, eventId: string, draft: GuestGroupDraft): Promise<boolean>;

  updateGroup(
    scope: TenantScope,
    eventId: string,
    groupId: string,
    draft: GuestGroupDraft,
  ): Promise<boolean>;

  /** Borra la familia y, en cascada, sus respuestas. */
  deleteGroup(scope: TenantScope, eventId: string, groupId: string): Promise<boolean>;

  /**
   * Guarda la respuesta de una familia desde su enlace.
   *
   * La autorización es el propio enlace, y por eso pasa por la misma función que abre la
   * invitación —con su límite por IP—: no hay una segunda puerta con reglas distintas.
   */
  submitReply(request: SubmitRsvpRequest): Promise<SubmitRsvpResult>;
}
