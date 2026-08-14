import type { UserRole } from './actor';
import type { OtpChannel } from './otp-channel';
import type { ManagedUser } from './user-management';

/** Una persona del equipo, tal como se lista en el panel. */
export interface TeamMember extends ManagedUser {
  readonly email: string;
  readonly name: string;
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

export interface InviteUserInput {
  readonly clientId: string;
  readonly email: string;
  readonly name: string;
  readonly role: UserRole;
  readonly phone: string | null;
}

export type InviteUserResult =
  | { readonly outcome: 'invited'; readonly userId: string }
  /**
   * El correo ya está en el equipo de quien invita.
   *
   * Se distingue del siguiente caso a propósito: aquí la información es del propio cliente
   * y decirla es lo útil.
   */
  | { readonly outcome: 'already-in-team' }
  /**
   * El correo tiene cuenta, pero en otro cliente.
   *
   * Esto SÍ revela que la dirección existe en la plataforma, y es una fuga aceptada
   * conscientemente: sin ella, quien invita ve un fallo sin explicación y no puede hacer
   * nada. El sondeo requiere ser administrador de un cliente real, va de uno en uno y solo
   * dice "existe", nunca de quién es. El único global de `users.email` obliga a que el caso
   * exista; lo que se elige aquí es qué se cuenta de él.
   */
  | { readonly outcome: 'email-taken' };

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

}
