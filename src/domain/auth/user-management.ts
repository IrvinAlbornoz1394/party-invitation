import { type ClientActor, type UserRole, hasRoleAtLeast } from './actor';

/**
 * Quién puede hacerle qué a quién dentro de un cliente.
 *
 * Row-Level Security ya garantiza que nadie toque usuarios de otro cliente. Lo que RLS no
 * puede decidir es lo de dentro: si un `admin` puede ascender a alguien a `owner`, si
 * alguien puede desactivarse a sí mismo, si se puede dejar un cliente sin dueño. Esas
 * son reglas de negocio y viven aquí, en funciones puras que se pueden probar sin base de
 * datos.
 *
 * Todas devuelven una unión discriminada en vez de un booleano. El motivo es concreto: la
 * interfaz tiene que poder explicar POR QUÉ no se puede, y un `false` obliga a reconstruir
 * el motivo en la capa de arriba —normalmente mal, y normalmente distinto en cada pantalla.
 */

export type PermissionCheck =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: string };

const ALLOWED: PermissionCheck = { allowed: true };

function denied(reason: string): PermissionCheck {
  return { allowed: false, reason };
}

/** Lo mínimo que hay que saber de alguien para decidir si se le puede modificar. */
export interface ManagedUser {
  readonly id: string;
  readonly role: UserRole;
  readonly status: 'active' | 'invited' | 'disabled';
  /** Si tiene rol de plataforma. Se usa para protegerlo, nunca para concederlo. */
  readonly hasPlatformRole: boolean;
}

/**
 * Contexto del cliente sobre la que se decide.
 *
 * `activeOwners` incluye a los dueños en estado `active` e `invited`, porque un dueño que
 * todavía no ha entrado sigue siendo capaz de entrar: no dejaría el cliente huérfana.
 */
export interface ClientContext {
  readonly activeOwners: number;
}

/**
 * Invitar a alguien nuevo.
 *
 * La regla central es que **nadie puede conceder un rol superior al suyo**. Sin ella, un
 * `admin` invitaría a un `owner` de paja, entraría con ese correo y tendría el control de
 * el cliente: la jerarquía de roles no valdría nada, porque el escalón de abajo podría
 * fabricar el de arriba.
 */
export function canInviteUser(actor: ClientActor, role: UserRole): PermissionCheck {
  if (!hasRoleAtLeast(actor, 'admin')) {
    return denied('Solo un administrador o el dueño de la cuenta puede invitar personas.');
  }

  if (!hasRoleAtLeast(actor, role)) {
    return denied('No puedes dar a otra persona un rol superior al tuyo.');
  }

  return ALLOWED;
}

/**
 * Cambiar el rol de alguien.
 *
 * Tres candados, y cada uno cierra un camino distinto:
 *
 *   · No se puede conceder por encima del rol propio (misma razón que al invitar).
 *   · No se puede modificar a alguien de rango superior. Si no, un `admin` degradaría al
 *     `owner` a `staff` y se quedaría siendo el mayor del cliente — escalada por la
 *     vía de bajar a los demás en lugar de subirse uno.
 *   · No se puede dejar el cliente sin ningún dueño, porque nadie podría volver a
 *     nombrar uno y el cliente quedaría bloqueado sin arreglo desde la propia aplicación.
 */
export function canChangeRole(
  actor: ClientActor,
  target: ManagedUser,
  newRole: UserRole,
  client: ClientContext,
): PermissionCheck {
  if (!hasRoleAtLeast(actor, 'admin')) {
    return denied('Solo un administrador o el dueño de la cuenta puede cambiar roles.');
  }

  if (target.id === actor.userId) {
    return denied('No puedes cambiarte el rol a ti mismo.');
  }

  if (!hasRoleAtLeast(actor, target.role)) {
    return denied('No puedes modificar a alguien con un rol superior al tuyo.');
  }

  if (!hasRoleAtLeast(actor, newRole)) {
    return denied('No puedes dar a otra persona un rol superior al tuyo.');
  }

  if (target.hasPlatformRole) {
    return denied('Esa cuenta la administra la plataforma.');
  }

  if (target.role === 'owner' && newRole !== 'owner' && client.activeOwners <= 1) {
    return denied('El cliente se quedaría sin dueño. Nombra otro antes de cambiar este.');
  }

  return ALLOWED;
}

/**
 * Activar o desactivar una cuenta.
 *
 * Desactivarse a uno mismo está prohibido, y no es paternalismo: la sesión se corta al
 * instante y ya no habría forma de volver a entrar ni de deshacerlo. El único camino de
 * vuelta sería que otro administrador lo reactivara, y en un cliente de una sola
 * persona ese otro no existe.
 */
export function canSetStatus(
  actor: ClientActor,
  target: ManagedUser,
  newStatus: ManagedUser['status'],
  client: ClientContext,
): PermissionCheck {
  if (!hasRoleAtLeast(actor, 'admin')) {
    return denied('Solo un administrador o el dueño de la cuenta puede activar o desactivar.');
  }

  if (target.id === actor.userId) {
    return denied('No puedes desactivar tu propia cuenta.');
  }

  if (!hasRoleAtLeast(actor, target.role)) {
    return denied('No puedes modificar a alguien con un rol superior al tuyo.');
  }

  if (target.hasPlatformRole) {
    return denied('Esa cuenta la administra la plataforma.');
  }

  if (newStatus === 'disabled' && target.role === 'owner' && client.activeOwners <= 1) {
    return denied('Es el único dueño del cliente. Nombra otro antes de desactivarlo.');
  }

  return ALLOWED;
}
