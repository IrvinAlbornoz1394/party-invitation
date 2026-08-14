import type { ClientActor, UserRole } from '@/domain/auth/actor';
import { normalizeEmail } from '@/domain/auth/email-address';
import type { InvitationNotifier } from '@/domain/auth/invitation-notifier';
import { normalizePhoneNumber } from '@/domain/auth/phone-number';
import {
  canChangeRole,
  canInviteUser,
  canSetStatus,
  type ManagedUser,
} from '@/domain/auth/user-management';
import type { TeamMember, TeamSnapshot, UserRepository } from '@/domain/auth/user-repository';

/**
 * Casos de uso de administración de cuentas.
 *
 * Un patrón se repite en los tres que modifican algo, y es deliberado: **cargar el equipo
 * entero, decidir con el dominio, y solo entonces escribir**. Es un viaje más a la base de
 * datos que comprobar sobre la marcha, y compra dos cosas que valen mucho más:
 *
 *   · Las reglas se evalúan sobre el estado real y actual, no sobre lo que la interfaz
 *     mostraba cuando se pintó la pantalla. Entre que alguien abre la lista y pulsa un
 *     botón, otro administrador pudo haber cambiado los roles.
 *   · La decisión es una función pura que se puede probar sin Postgres.
 */

export type ManageUserResult =
  | { readonly outcome: 'ok' }
  /** El dominio rechazó la operación; `reason` es un texto ya escrito para el usuario. */
  | { readonly outcome: 'denied'; readonly reason: string }
  /** La persona ya no está en el equipo (la borraron o nunca fue de este cliente). */
  | { readonly outcome: 'not-found' };

export type InviteResult =
  | { readonly outcome: 'invited'; readonly email: string; readonly name: string }
  | { readonly outcome: 'denied'; readonly reason: string }
  | { readonly outcome: 'invalid'; readonly reason: string };

/** Lista el equipo del cliente en la que se está trabajando. */
export class ListTeam {
  constructor(private readonly users: UserRepository) {}

  async execute(actor: ClientActor): Promise<TeamSnapshot> {
    return this.users.loadTeam(actor.clientId);
  }
}

export interface InviteUserCommand {
  readonly email: string;
  readonly name: string;
  readonly role: UserRole;
  readonly phone: string | null;
}

/**
 * Invita a alguien al equipo.
 *
 * No emite ninguna credencial ni token: la persona entra por la pantalla de acceso normal
 * pidiendo su código. Con OTP, un token de invitación sería una segunda credencial que
 * caduca, que hay que reenviar y que hay que poder revocar, a cambio de nada — el correo ya
 * es la prueba de que la dirección es suya.
 */
export class InviteUser {
  constructor(
    private readonly users: UserRepository,
    private readonly notifier: InvitationNotifier,
  ) {}

  async execute(actor: ClientActor, command: InviteUserCommand): Promise<InviteResult> {
    const permission = canInviteUser(actor, command.role);
    if (!permission.allowed) return { outcome: 'denied', reason: permission.reason };

    const email = normalizeEmail(command.email);
    if (email === null) {
      return { outcome: 'invalid', reason: 'Ese correo no parece válido.' };
    }

    const name = command.name.trim();
    if (name.length === 0) {
      return { outcome: 'invalid', reason: 'Escribe el nombre de la persona.' };
    }

    /*
     * El teléfono es opcional, pero si viene escrito y no se puede interpretar, se rechaza
     * en lugar de guardarlo tal cual o descartarlo en silencio. Guardar un número que no
     * está en E.164 haría que el mensaje de WhatsApp no llegue nunca, y la API responde 200
     * igual: sería un fallo sin síntoma hasta que alguien no pudiera entrar.
     */
    let phone: string | null = null;
    if (command.phone && command.phone.trim().length > 0) {
      phone = normalizePhoneNumber(command.phone);
      if (phone === null) {
        return { outcome: 'invalid', reason: 'Ese teléfono no parece válido. Usa 10 dígitos.' };
      }
    }

    const team = await this.users.loadTeam(actor.clientId);

    const result = await this.users.invite({
      clientId: actor.clientId,
      email,
      name,
      role: command.role,
      phone,
    });

    switch (result.outcome) {
      case 'already-in-team':
        return { outcome: 'invalid', reason: 'Esa persona ya está en tu equipo.' };
      case 'email-taken':
        return {
          outcome: 'invalid',
          reason: 'Ese correo ya tiene una cuenta en la plataforma. Escríbenos para moverla.',
        };
      case 'invited':
        break;
    }

    /*
     * El aviso se manda DESPUÉS de crear la cuenta, y su fallo no deshace nada. Es lo
     * correcto porque el correo no lleva ninguna credencial: si no llega, la persona ya tiene
     * acceso y entra igual pidiendo su código. Al revés —abortar el alta porque el correo
     * falló— dejaría al administrador sin poder invitar cada vez que el proveedor tuviera un
     * mal minuto.
     */
    await this.notifier.send({
      email,
      recipientName: name,
      inviterName: actor.name,
      clientName: team.clientName,
    });

    return { outcome: 'invited', email, name };
  }
}

/** Cambia el rol de alguien del equipo. */
export class ChangeUserRole {
  constructor(private readonly users: UserRepository) {}

  async execute(
    actor: ClientActor,
    input: { readonly userId: string; readonly role: UserRole },
  ): Promise<ManageUserResult> {
    const team = await this.users.loadTeam(actor.clientId);
    const target = findMember(team, input.userId);
    if (target === null) return { outcome: 'not-found' };

    const permission = canChangeRole(actor, target, input.role, { activeOwners: team.activeOwners });
    if (!permission.allowed) return { outcome: 'denied', reason: permission.reason };

    // Cambiar el rol NO corta la sesión de esa persona, y no hace falta: `resolve_session`
    // lee el rol de la tabla en cada petición, así que el cambio tiene efecto inmediato sin
    // echar a nadie. Solo desactivar exige revocar.
    await this.users.changeRole({
      clientId: actor.clientId,
      userId: target.id,
      role: input.role,
      actorUserId: actor.userId,
    });

    return { outcome: 'ok' };
  }
}

/** Activa o desactiva una cuenta del equipo. */
export class SetUserStatus {
  constructor(private readonly users: UserRepository) {}

  async execute(
    actor: ClientActor,
    input: { readonly userId: string; readonly status: ManagedUser['status'] },
  ): Promise<ManageUserResult> {
    const team = await this.users.loadTeam(actor.clientId);
    const target = findMember(team, input.userId);
    if (target === null) return { outcome: 'not-found' };

    const permission = canSetStatus(actor, target, input.status, {
      activeOwners: team.activeOwners,
    });
    if (!permission.allowed) return { outcome: 'denied', reason: permission.reason };

    await this.users.setStatus({
      clientId: actor.clientId,
      userId: target.id,
      status: input.status,
      actorUserId: actor.userId,
    });

    return { outcome: 'ok' };
  }
}

function findMember(team: TeamSnapshot, userId: string): TeamMember | null {
  return team.members.find((member) => member.id === userId) ?? null;
}
