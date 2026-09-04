import { type ClientActor, displayNameOf } from '@/domain/auth/actor';
import { normalizeEmail } from '@/domain/auth/email-address';
import type { InvitationNotifier } from '@/domain/auth/invitation-notifier';
import {
  EVENT_ACCESS_ROLE,
  canChangeEventAccess,
  canGrantEventAccess,
} from '@/domain/auth/user-management';
import type {
  EventAccessMember,
  EventAccessSnapshot,
  UserRepository,
} from '@/domain/auth/user-repository';
import type { ManageUserResult } from './manage-users';

/**
 * Quién puede entrar al panel de UN evento.
 *
 * Vive aparte de `manage-users.ts`, y no es una separación por tema sino porque casi nada se
 * puede compartir:
 *
 * - **El actor requerido es otro.** Aquellos casos de uso los llaman pantallas que ya pasaron
 *   por `requireClientScope()`; estos van detrás de `requireEventAccess()`, que devuelve un
 *   actor cuyo `eventId` puede estar puesto. La primera regla de este camino es justamente
 *   sobre ese campo, y `ListTeam` no la tiene ni la quiere.
 * - **El retorno significa otra cosa.** `TeamSnapshot.activeOwners` existe para responder
 *   «¿queda otro dueño?», que es una pregunta que un evento no se hace.
 * - **Las validaciones son incompatibles.** `InviteUser` exige un nombre y este flujo tiene
 *   prohibido pedirlo: el acceso se concede con el correo y nada más. Un parámetro para
 *   saltarse una validación es el síntoma de dos casos de uso metidos en un solo abrigo.
 *
 * Lo que sí se comparte es el puerto `UserRepository.invite`, porque detrás hay una sola
 * función SQL y duplicar su llamada daría dos sitios que mantener al día con sus estados.
 */

export type GrantEventAccessResult =
  | { readonly outcome: 'granted'; readonly email: string; readonly notified: boolean }
  /** Tenía acceso y se le había retirado: se le devolvió, en vez de crearlo otra vez. */
  | { readonly outcome: 'restored'; readonly email: string }
  | { readonly outcome: 'denied'; readonly reason: string }
  | { readonly outcome: 'invalid'; readonly reason: string }
  /** El evento no es de este cliente, o ya no existe. La pantalla responde 404. */
  | { readonly outcome: 'not-found' };

export interface GrantEventAccessCommand {
  readonly eventId: string;
  readonly email: string;
  /** Opcional. Si no viene, el correo de aviso no tiene a quién saludar y no saluda a nadie. */
  readonly label: string | null;
}

/**
 * A dónde lleva el aviso de acceso.
 *
 * Es la dirección limpia del evento y no `/acceso?volver=…`: la pantalla de acceso ya sabe
 * recordar el destino —lo hace `safeReturnTo()`—, y una URL que nombra el evento sobrevive a que
 * alguien la guarde en favoritos y la abra un mes después.
 */
export function eventPanelUrlFor(siteUrl: string, eventId: string): string {
  return `${siteUrl}/panel/eventos/${eventId}`;
}

export class ListEventAccess {
  constructor(private readonly users: UserRepository) {}

  /** `null` cuando el evento no está en el alcance, o cuando el actor no alcanza el cliente. */
  async execute(actor: ClientActor, eventId: string): Promise<EventAccessSnapshot | null> {
    /*
     * Un actor de alcance evento no puede ni LEER esta lista: la política de `users` cierra la
     * tabla entera cuando hay contexto de evento, así que la consulta saldría sin correos. Se
     * corta aquí para que la pantalla responda 404 en vez de enseñar una tabla mutilada.
     */
    if (actor.eventId !== null) return null;

    return this.users.loadEventAccess({ clientId: actor.clientId, eventId });
  }
}

export class GrantEventAccess {
  constructor(
    private readonly users: UserRepository,
    private readonly notifier: InvitationNotifier,
    private readonly siteUrl: string,
  ) {}

  async execute(
    actor: ClientActor,
    command: GrantEventAccessCommand,
  ): Promise<GrantEventAccessResult> {
    const permission = canGrantEventAccess(actor, EVENT_ACCESS_ROLE);
    if (!permission.allowed) return { outcome: 'denied', reason: permission.reason };

    const email = normalizeEmail(command.email);
    if (email === null) {
      return { outcome: 'invalid', reason: 'Ese correo no parece válido.' };
    }

    /*
     * Aquí NO se exige nombre, y la ausencia es la funcionalidad: es lo único que se le pide a
     * quien va a mirar una invitación. Si algún día alguien añade la validación por simetría con
     * `InviteUser`, este comentario es lo que debería detenerle.
     */
    const label = command.label?.trim() || null;

    const snapshot = await this.users.loadEventAccess({
      clientId: actor.clientId,
      eventId: command.eventId,
    });
    if (snapshot === null) return { outcome: 'not-found' };

    /*
     * Dar un visor a alguien que ya es del equipo le ESTRECHARÍA el acceso, no se lo ampliaría.
     * Los dos únicos parciales de `memberships` son independientes, así que la misma persona
     * puede tener las dos membresías — y `membershipForEvent()` prefiere la más específica, así
     * que un colaborador al que se le «da acceso» a una boda dejaría de poder editarla.
     *
     * Es un pie de bala silencioso: la operación tendría éxito y el efecto sería el contrario
     * del que se buscaba. Cuesta una consulta que ya se hace en el equipo, así que se paga.
     */
    const team = await this.users.loadTeam(actor.clientId);
    if (team.members.some((member) => member.email === email)) {
      return {
        outcome: 'invalid',
        reason: 'Esa persona es de tu equipo y ya ve este evento. No hace falta darle acceso.',
      };
    }

    const existing = snapshot.members.find((member) => member.email === email);
    if (existing) {
      return existing.status === 'disabled'
        ? this.restore(actor, command.eventId, existing)
        : { outcome: 'invalid', reason: 'Esa persona ya tiene acceso a este evento.' };
    }

    const result = await this.users.invite({
      clientId: actor.clientId,
      actorUserId: actor.userId,
      eventId: command.eventId,
      email,
      name: null,
      label,
      role: EVENT_ACCESS_ROLE,
      phone: null,
    });

    switch (result.outcome) {
      case 'already-in-team':
        // Carrera: alguien concedió el mismo correo entre la lectura de arriba y esta escritura.
        return { outcome: 'invalid', reason: 'Esa persona ya tiene acceso a este evento.' };
      case 'access-revoked':
        return this.restore(actor, command.eventId, {
          membershipId: result.membershipId,
          userId: result.userId,
          role: EVENT_ACCESS_ROLE,
          email,
        });
      case 'rejected':
        /*
         * La base de datos revalidó el rol del actor y se negó. Los candados del dominio ya
         * pararon los casos reales con su motivo, así que llegar aquí significa que algo llamó
         * al caso de uso con un actor que no es quien dice ser: no hay nada que explicar.
         */
        return { outcome: 'denied', reason: 'No se pudo dar ese acceso.' };
      case 'invited':
        break;
    }

    /*
     * El aviso se manda DESPUÉS de conceder y su fallo no deshace nada, igual que al invitar al
     * equipo: el correo no lleva ninguna credencial, así que si no llega, la persona ya tiene
     * acceso y entra pidiendo su código. Lo que sí se cuenta es si salió, para que la pantalla
     * pueda decir «avísale tú» en vez de dar por hecho que llegó.
     */
    const delivery = await this.notifier.sendEventAccess({
      email,
      label,
      eventTitle: snapshot.eventTitle,
      clientName: snapshot.clientName,
      inviterName: displayNameOf(actor),
      eventUrl: eventPanelUrlFor(this.siteUrl, command.eventId),
    });

    return { outcome: 'granted', email, notified: delivery.outcome === 'sent' };
  }

  /**
   * Devolver un acceso retirado.
   *
   * Es reactivar y no volver a conceder porque el único parcial `memberships_event_scope_idx`
   * impide que exista una segunda fila para la misma persona en el mismo evento. Sin esto, un
   * acceso retirado sería irrecuperable desde la interfaz.
   */
  private async restore(
    actor: ClientActor,
    eventId: string,
    target: Pick<EventAccessMember, 'membershipId' | 'userId' | 'role' | 'email'>,
  ): Promise<GrantEventAccessResult> {
    const permission = canChangeEventAccess(actor, target);
    if (!permission.allowed) return { outcome: 'denied', reason: permission.reason };

    await this.users.setEventAccessStatus({
      clientId: actor.clientId,
      eventId,
      membershipId: target.membershipId,
      userId: target.userId,
      status: 'active',
      actorUserId: actor.userId,
    });

    return { outcome: 'restored', email: target.email };
  }
}

export class SetEventAccessStatus {
  constructor(private readonly users: UserRepository) {}

  async execute(
    actor: ClientActor,
    input: {
      readonly eventId: string;
      readonly membershipId: string;
      readonly status: 'active' | 'disabled';
    },
  ): Promise<ManageUserResult> {
    /*
     * Mismo patrón que los casos de uso del equipo: cargar el estado real, decidir con el
     * dominio y solo entonces escribir. Entre que alguien abre la lista y pulsa el botón, otra
     * persona pudo haber retirado ese mismo acceso.
     */
    const snapshot = await this.users.loadEventAccess({
      clientId: actor.clientId,
      eventId: input.eventId,
    });
    if (snapshot === null) return { outcome: 'not-found' };

    const target = snapshot.members.find(
      (member) => member.membershipId === input.membershipId,
    );
    if (!target) return { outcome: 'not-found' };

    const permission = canChangeEventAccess(actor, target);
    if (!permission.allowed) return { outcome: 'denied', reason: permission.reason };

    await this.users.setEventAccessStatus({
      clientId: actor.clientId,
      eventId: input.eventId,
      membershipId: target.membershipId,
      userId: target.userId,
      status: input.status,
      actorUserId: actor.userId,
    });

    return { outcome: 'ok' };
  }
}
