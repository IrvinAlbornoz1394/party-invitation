import type { Actor } from './actor';
import type { OtpIssueRequest, OtpIssueResult, OtpVerifyRequest, OtpVerifyResult } from './otp-challenge';

/**
 * Puerto de salida del subsistema de autenticación.
 *
 * Ni una firma menciona hash, HMAC, Postgres ni SQL. Los códigos y los tokens entran
 * **en claro** y es la implementación la que decide cómo se guardan. Eso puede parecer
 * al revés, pero es lo correcto: cómo se protege una credencial en reposo es una
 * decisión de persistencia, y ponerla en la interfaz obligaría a todo caso de uso a
 * conocerla —y a poder equivocarse con ella.
 *
 * Consecuencia práctica: los casos de uso de auth se prueban con una implementación en
 * memoria, sin Postgres y sin secretos.
 *
 * Ya no hay nada aquí sobre elegir cliente. Cuando existía la impersonación, este puerto
 * cargaba además con listar los clientes accesibles y cambiar el activo, dos operaciones
 * que no son de autenticación sino de administración de plataforma. Al separarlas
 * —`ClientRepository`, `EventRepository`— este archivo volvió a tratar de una sola cosa:
 * quién eres y si tu sesión vale.
 */
export interface AuthRepository {
  /**
   * Emite un código para el identificador dado, invalidando los anteriores.
   *
   * Es una sola operación porque el límite de emisión, la invalidación del código previo
   * y el registro del intento tienen que ser atómicos entre sí. Si el límite se
   * comprobara antes, en la aplicación, dos peticiones simultáneas leerían el mismo
   * contador y ambas pasarían.
   */
  issueOtp(request: OtpIssueRequest): Promise<OtpIssueResult>;

  /**
   * Canjea el código y abre sesión si es correcto.
   *
   * También una sola operación: marcar el código como usado y crear la sesión en la
   * misma transacción es lo que garantiza que un código sirva exactamente una vez, sin
   * ventana entre comprobar y consumir.
   */
  verifyOtp(request: OtpVerifyRequest): Promise<OtpVerifyResult>;

  /** Valida el token de la cookie. Devuelve null para cualquier motivo de rechazo. */
  resolveSession(sessionToken: string): Promise<Actor | null>;

  /** Cierra la sesión. Idempotente: repetirlo con un token ya revocado no es un error. */
  revokeSession(sessionToken: string): Promise<void>;
}
