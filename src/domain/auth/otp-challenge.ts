import type { Actor } from './actor';
import type { OtpChannel } from './otp-channel';

/**
 * Tipos del reto OTP: lo que se pide al emitirlo y lo que puede pasar al verificarlo.
 *
 * Los resultados son uniones discriminadas y no un booleano con mensaje porque el
 * compilador tiene que forzar que la capa de presentación trate todos los casos. Aquí
 * un `else` que se come un resultado inesperado es un fallo de autenticación.
 */

export interface OtpIssueRequest {
  /** Correo normalizado. Es la identidad de la cuenta y la clave de todos los límites. */
  readonly identifier: string;
  /** Canal pedido por el usuario; null significa "usa la preferencia de la cuenta". */
  readonly requestedChannel: OtpChannel | null;
  /** Código en claro. El repositorio decide cómo se persiste; el dominio no lo sabe. */
  readonly code: string;
  readonly ttlMs: number;
  readonly clientIp: string | null;
  readonly userAgent: string | null;
}

/**
 * Resultado de emitir.
 *
 * `no-account` existe para que el caso de uso sepa que no hay a quién enviarle nada,
 * NO para que la respuesta HTTP lo distinga. Hacia el cliente, `issued` y `no-account`
 * tienen que verse exactamente igual: en cuanto se diferencien, el formulario de login
 * se convierte en un buscador de correos registrados, y la lista de clientes de un
 * SaaS de eventos es información comercial que no se regala.
 */
export type OtpIssueResult =
  | {
      readonly outcome: 'issued';
      readonly userId: string;
      readonly name: string;
      readonly channel: OtpChannel;
      /** Correo o teléfono al que hay que enviar el código, ya normalizado. */
      readonly destination: string;
      readonly expiresAt: Date;
    }
  | { readonly outcome: 'no-account' }
  /** Demasiadas emisiones para este correo o desde esta IP. */
  | { readonly outcome: 'rate-limited' };

export interface OtpVerifyRequest {
  readonly identifier: string;
  readonly code: string;
  /** Token de la sesión que se abrirá si el código es correcto, en claro. */
  readonly sessionToken: string;
  readonly sessionTtlMs: number;
  readonly clientIp: string | null;
  readonly userAgent: string | null;
}

/**
 * Resultado de verificar.
 *
 * `expired` se distingue de `invalid` porque mejora mucho la experiencia —"tu código
 * venció, pide otro" frente a un "código incorrecto" que hace dudar de lo que se
 * teclea— y no filtra nada: para obtener `expired` hay que haber acertado el código,
 * cosa que solo puede hacer quien lo recibió.
 *
 * `too-many-attempts`, en cambio, SÍ podría filtrar la existencia de una cuenta si se
 * contara por reto, porque solo habría reto para un correo registrado. Por eso el
 * contador que decide este resultado se lleva por identificador en `auth_attempts`, que
 * registra también los correos que no existen. El comportamiento observable es idéntico
 * con cuenta y sin ella.
 */
export type OtpVerifyResult =
  | { readonly outcome: 'verified'; readonly actor: Actor; readonly expiresAt: Date }
  | { readonly outcome: 'invalid' }
  | { readonly outcome: 'expired' }
  /** Se agotaron los intentos de este correo; el código quedó quemado. */
  | { readonly outcome: 'too-many-attempts' }
  /** Tope de la IP alcanzado. */
  | { readonly outcome: 'rate-limited' }
  /** El código era correcto, pero la cuenta se desactivó entre la emisión y el canje. */
  | { readonly outcome: 'account-disabled' };
