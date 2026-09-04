import type { MembershipRole, UserRole } from './actor';
import type { OtpChannel } from './otp-channel';
import type { ManagedUser } from './user-management';

/** Una persona del equipo, tal como se lista en el panel. */
export interface TeamMember extends ManagedUser {
  readonly email: string;
  /**
   * Nullable desde que la identidad dejó de exigir nombre: un acceso de solo lectura se
   * concede con el correo y nada más. La pantalla cae al correo cuando no hay nombre.
   */
  readonly name: string | null;
  readonly phone: string | null;
  readonly preferredChannel: OtpChannel;
  readonly lastLoginAt: Date | null;
  readonly createdAt: Date;
}

/**
 * Foto completa del equipo de un cliente.
 *
 * Se devuelve entero y no en consultas sueltas porque cada decisión de permiso necesita el
 * conjunto: "¿queda otro dueño?" no se puede responder mirando solo a la persona que se
 * está modificando. Traerlo de una vez evita además la carrera de leer el conteo en una
 * consulta y decidir con él en otra.
 */
export interface TeamSnapshot {
  /**
   * Nombre del cliente.
   *
   * Va aquí y no en una consulta aparte porque quien carga el equipo siempre lo necesita: la
   * pantalla lo encabeza y el correo de invitación lo nombra. Un viaje menos y un dato menos
   * que pueda quedar desincronizado con la lista que lo acompaña.
   */
  readonly clientName: string;
  readonly members: readonly TeamMember[];
  /** Dueños que pueden entrar: `active` e `invited`. Un `disabled` no cuenta. */
  readonly activeOwners: number;
}

/**
 * Una persona con acceso a UN evento.
 *
 * No reutiliza `TeamMember`, y la diferencia no es de campos sino de significado. `TeamMember`
 * lleva `hasPlatformRole` —que aquí es imposible— y se cuenta dentro de un `TeamSnapshot` con
 * `activeOwners`, que responde «¿queda otro dueño?»: una pregunta que un evento no se hace. Un
 * solo tipo con la mitad de los campos sin sentido obligaría a cada pantalla a saber cuál de las
 * dos cosas está mirando.
 *
 * Se identifica por `membershipId` y no por `userId`: la misma persona puede tener membresía de
 * alcance cliente Y de este evento, y lo que se retira desde aquí es solo la segunda.
 */
export interface EventAccessMember {
  readonly membershipId: string;
  readonly userId: string;
  readonly email: string;
  /** Nullable: el acceso se concede con el correo y nada más. */
  readonly name: string | null;
  /** «Los novios», «Mamá de la quinceañera». Es lo que se pinta cuando no hay nombre. */
  readonly label: string | null;
  readonly role: MembershipRole;
  readonly status: ManagedUser['status'];
  readonly lastLoginAt: Date | null;
  readonly createdAt: Date;
}

/**
 * Los accesos de un evento, con lo que el correo de aviso necesita nombrar.
 *
 * `eventTitle` y `clientName` viajan aquí por el mismo motivo que `TeamSnapshot.clientName`:
 * quien carga esto siempre los necesita —la pantalla encabeza con uno y el correo nombra los
 * dos— y salen de la misma transacción, así que no pueden desincronizarse con la lista.
 */
export interface EventAccessSnapshot {
  readonly eventTitle: string;
  readonly clientName: string;
  readonly members: readonly EventAccessMember[];
}

export interface InviteUserInput {
  readonly clientId: string;
  /**
   * Quién concede. Va al repositorio y no se queda en la capa de aplicación porque
   * `app.grant_membership()` revalida su rol contra la base de datos: los candados del
   * dominio explican el motivo en la interfaz, y este los vuelve a aplicar donde no se
   * pueden esquivar.
   */
  readonly actorUserId: string;
  /**
   * `null` = alcance cliente, o sea el equipo. Con evento, el acceso es a ese evento y a nada
   * más.
   *
   * El campo es nuevo y el camino no: `app.grant_membership()` acepta `p_event_id` desde que
   * existe, y el repositorio le pasaba `null::uuid` fijo. La capacidad estaba en la base de
   * datos y no en el puerto.
   */
  readonly eventId: string | null;
  readonly email: string;
  /** Nullable: a un visor no se le pide ningún dato personal, solo su correo. */
  readonly name: string | null;
  /** Cómo llama el cliente a esta persona. Solo tiene sentido en el alcance evento. */
  readonly label: string | null;
  /** `MembershipRole` y no `UserRole`, porque `viewer` es justo el rol de este camino. */
  readonly role: MembershipRole;
  readonly phone: string | null;
}

export type InviteUserResult =
  | { readonly outcome: 'invited'; readonly userId: string }
  /**
   * El correo ya alcanza este cliente.
   *
   * Es el único resultado que distingue algo, y se puede contar porque la información es del
   * propio cliente: quien invita ya podía verlo en su propia lista de equipo.
   */
  | { readonly outcome: 'already-in-team' }
  /**
   * Ya tenía este mismo acceso y **se le retiró**.
   *
   * Se cuenta aparte de `already-in-team` porque no son el mismo hecho, y la diferencia es
   * accionable: el único parcial de `memberships` impide volver a insertar la fila, así que
   * reintentar no arregla nada y lo que corresponde es reactivarla. Sin este caso, quien
   * concede lee «ya está en el equipo» de alguien que no puede entrar.
   */
  | { readonly outcome: 'access-revoked'; readonly membershipId: string; readonly userId: string }
  /**
   * La base de datos se negó: el actor no tiene rol para conceder, o intenta conceder uno por
   * encima del suyo.
   *
   * No debería llegar nunca, porque los candados del dominio lo paran antes con un mensaje
   * explicado. Que exista este caso es lo que hace que la revalidación de la base de datos no
   * sea decorativa.
   */
  | { readonly outcome: 'rejected' };

/**
 * ## Lo que ya no hace falta contar
 *
 * Existía un tercer resultado, `email-taken`: el correo tenía cuenta en OTRO cliente. Era una
 * fuga aceptada a conciencia —revelaba que la dirección existe en la plataforma— porque el
 * único de `users.email` es global y el caso no se podía evitar.
 *
 * Con las membresías el caso deja de ser un conflicto: se reutiliza la identidad y se le añade
 * una membresía a este cliente. La respuesta es `invited` igual que si el correo fuera nuevo,
 * así que quien invita no averigua nada sobre en qué otros clientes está. La fuga desapareció
 * al cambiar el modelo, no al taparla.
 */

/**
 * Puerto de persistencia para la gestión de cuentas.
 *
 * Separado de `AuthRepository` porque son dos responsabilidades distintas: aquel resuelve
 * credenciales y sesiones sin contexto de tenant; este administra usuarios **dentro** de un
 * cliente y todo lo suyo pasa por `withTenant()`. Juntarlos daría una interfaz que a
 * veces trabaja con contexto y a veces sin él, que es justo la ambigüedad que hace difícil
 * saber si una consulta está protegida por Row-Level Security.
 */
export interface UserRepository {
  /** Equipo del cliente activo. RLS garantiza que no salga nadie de otra. */
  loadTeam(clientId: string): Promise<TeamSnapshot>;

  /**
   * Crea la cuenta en estado `invited`.
   *
   * No emite ninguna credencial: con OTP no hace falta un token de invitación, porque la
   * persona entra pidiendo su código y el correo ES la verificación. Un token de invitación
   * solo añadiría una segunda credencial que caduca, que se reenvía y que hay que revocar.
   */
  invite(input: InviteUserInput): Promise<InviteUserResult>;

  changeRole(input: {
    readonly clientId: string;
    readonly userId: string;
    readonly role: UserRole;
    readonly actorUserId: string;
  }): Promise<void>;

  /**
   * Cambia el estado de la cuenta.
   *
   * Al desactivar, **corta también las sesiones abiertas**. Sin eso, quitarle el acceso a
   * alguien no tendría efecto hasta que su sesión venciera —hasta 30 días—, que es
   * exactamente lo contrario de lo que espera quien pulsa "desactivar", y normalmente lo
   * pulsa porque alguien acaba de dejar la empresa.
   */
  setStatus(input: {
    readonly clientId: string;
    readonly userId: string;
    readonly status: ManagedUser['status'];
    readonly actorUserId: string;
  }): Promise<void>;

  /**
   * Los accesos de alcance evento de un evento.
   *
   * Devuelve `null` si el evento no es de este cliente. Es el mismo caso que «no existe» para
   * quien llama, y contarlos por separado convertiría la pantalla en un oráculo de
   * identificadores de evento.
   */
  loadEventAccess(input: {
    readonly clientId: string;
    readonly eventId: string;
  }): Promise<EventAccessSnapshot | null>;

  /**
   * Retira o devuelve un acceso de evento.
   *
   * Es un método aparte de `setStatus()` y no un parámetro suyo por dos cosas que no se pueden
   * compartir: identifica la fila por `membershipId` en vez de por `userId` —la misma persona
   * puede tener las dos membresías— y **no corta ninguna sesión**. El porqué de lo segundo está
   * en la implementación, y es importante.
   */
  setEventAccessStatus(input: {
    readonly clientId: string;
    readonly eventId: string;
    readonly membershipId: string;
    readonly userId: string;
    readonly status: 'active' | 'disabled';
    readonly actorUserId: string;
  }): Promise<void>;
}
