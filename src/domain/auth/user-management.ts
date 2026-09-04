import { type ClientActor, type MembershipRole, type UserRole, hasRoleAtLeast } from './actor';

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
 * Invitar a alguien al equipo del cliente.
 *
 * Solo el dueño, y esa es la simplificación de 2026-09-04: antes bastaba con ser `admin`, y
 * entonces el escalón de abajo podía fabricar el de arriba —invitar a un `owner` de paja,
 * entrar con ese correo y quedarse con el cliente—. Poniendo la frontera en el dueño esa
 * escalada deja de existir, y con ella deja de tener sentido el rol intermedio: hoy el
 * formulario solo ofrece «Colaborador».
 *
 * La segunda regla se queda porque sigue siendo cierta y no depende de la primera: **nadie
 * puede conceder un rol superior al suyo**. Es lo que impide que ampliar los roles asignables
 * en la interfaz vuelva a abrir el mismo agujero sin que nadie lo note aquí.
 */
export function canInviteUser(actor: ClientActor, role: UserRole): PermissionCheck {
  if (!hasRoleAtLeast(actor, 'owner')) {
    return denied('Solo el dueño de la cuenta puede invitar personas.');
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
  if (!hasRoleAtLeast(actor, 'owner')) {
    return denied('Solo el dueño de la cuenta puede cambiar roles.');
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
  if (!hasRoleAtLeast(actor, 'owner')) {
    return denied('Solo el dueño de la cuenta puede activar o desactivar.');
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

/* ─────────────────────────────────────────────────────────────────────────────
 * Accesos a UN evento
 *
 * Son otra frontera que el equipo del cliente y por eso son otras funciones: aquí no existe la
 * regla de «no dejar el cliente sin dueño» —un evento sin ningún acceso externo es el estado
 * normal, así nace— ni la de no conceder por encima del rol propio, porque el rol no lo elige
 * nadie en un formulario. Lo que sí hay es una regla que el equipo no tiene: quien concede
 * necesita alcanzar el CLIENTE entero.
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * El rol con el que se concede un acceso de evento.
 *
 * Es una constante y no un campo del formulario, y esa es la decisión de producto: un selector
 * de rol al lado del correo de los novios invita a la equivocación cara —dar escritura a alguien
 * que solo venía a mirar— y a cambio no resuelve ningún caso que hoy exista. Ampliarlo es un
 * cambio de código, no un clic distraído.
 */
export const EVENT_ACCESS_ROLE = 'viewer' satisfies MembershipRole;

/** Lo mínimo que hay que saber de un acceso de evento para decidir si se puede tocar. */
export interface EventAccessTarget {
  readonly userId: string;
  readonly role: MembershipRole;
}

/**
 * Dar acceso a un evento.
 *
 * El primer candado es el que no se ve venir: hace falta alcance de CLIENTE (`eventId === null`),
 * y no es una regla de producto que se pueda ablandar desde la interfaz. La política RLS de
 * `users` exige `app.current_event_id() is null`, así que en contexto de evento la lista de
 * accesos sale sin un solo correo — la única columna por la que la pantalla existe. Se comprueba
 * aquí para poder explicarlo en vez de enseñar una tabla vacía.
 *
 * El rol no se compara con el de quien concede, al contrario que en el equipo. No hace falta: un
 * visor es estrictamente más débil que cualquier miembro del cliente, sobre un evento que ese
 * miembro ya alcanza entero. Lo que se comprueba es que el rol pedido sea de los que admiten
 * alcance evento, que es lo mismo que impone el CHECK `memberships_role_scope`.
 *
 * `app.grant_membership()` vuelve a comprobarlo todo contra la base de datos. Está en los dos
 * sitios por lo de siempre: este explica, aquel impone.
 */
export function canGrantEventAccess(actor: ClientActor, role: MembershipRole): PermissionCheck {
  if (actor.eventId !== null) {
    return denied('Tu acceso es solo a este evento, así que no puedes dárselo a nadie más.');
  }

  if (role === 'owner' || role === 'admin') {
    return denied('Ese rol alcanza el cliente entero; no se puede dar sobre un solo evento.');
  }

  return ALLOWED;
}

/**
 * Retirar o devolver un acceso de evento.
 *
 * No recibe el estado nuevo, al contrario que `canSetStatus`, y la ausencia es deliberada:
 * quitar y devolver exigen exactamente lo mismo, y un parámetro que ninguna rama consulta es una
 * asimetría anunciada que nadie va a mantener cierta.
 *
 * Tampoco mira `hasPlatformRole`: una cuenta de plataforma no tiene ninguna membresía, y ese es
 * el primer invariante que verifica `npm run db:check`.
 */
export function canChangeEventAccess(
  actor: ClientActor,
  target: EventAccessTarget,
): PermissionCheck {
  if (actor.eventId !== null) {
    return denied('Tu acceso es solo a este evento, así que no puedes cambiar el de nadie más.');
  }

  if (target.userId === actor.userId) {
    return denied('No puedes quitarte tu propio acceso.');
  }

  /*
   * Un dueño o un administrador alcanzan este evento desde el cliente, no desde una membresía de
   * evento, así que su acceso no se retira aquí: se administra en el equipo. Si esta pantalla lo
   * permitiera, quitarle el acceso a un compañero en una boda daría a entender que ya no la ve
   * —y la seguiría viendo por la otra vía—, que es la peor clase de botón: el que dice que hizo
   * algo que no hizo.
   */
  if (target.role === 'owner' || target.role === 'admin') {
    return denied('Esa persona alcanza el cliente entero; su acceso se administra en el equipo.');
  }

  return ALLOWED;
}
