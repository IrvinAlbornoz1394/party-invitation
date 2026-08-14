import type { Actor } from '@/domain/auth/actor';
import type { AuthRepository } from '@/domain/auth/auth-repository';
import { normalizeEmail } from '@/domain/auth/email-address';
import { normalizeOtpCode } from '@/domain/auth/otp-code';
import { SESSION_TTL_MS, generateSessionToken } from '@/domain/auth/session';

export interface VerifyOtpInput {
  readonly email: string;
  readonly code: string;
  readonly clientIp: string | null;
  readonly userAgent: string | null;
}

export type VerifyOtpResult =
  | {
      readonly outcome: 'verified';
      readonly actor: Actor;
      /** Token en claro para la cookie. Solo existe aquí y en la respuesta HTTP. */
      readonly sessionToken: string;
      readonly expiresAt: Date;
    }
  /** Código equivocado, o correo con forma inválida. Se juntan a propósito. */
  | { readonly outcome: 'invalid' }
  | { readonly outcome: 'expired' }
  | { readonly outcome: 'too-many-attempts' }
  | { readonly outcome: 'rate-limited' }
  | { readonly outcome: 'account-disabled' };

/**
 * Caso de uso: canjear el código y abrir sesión.
 *
 * El token de sesión se genera aquí, antes de llamar al repositorio, por el mismo motivo
 * que el código: así el valor en claro nace en memoria de la aplicación y a la base de
 * datos entra solo su HMAC. Se genera aunque el código resulte estar mal —cuesta 32
 * bytes de azar— porque la alternativa sería crear la sesión en un segundo viaje después
 * de validar, y entre los dos viajes habría una ventana en la que el código está
 * consumido y la sesión no existe: un canje correcto que acaba sin sesión.
 *
 * Un correo malformado devuelve `invalid`, igual que un código incorrecto. Aquí sí se
 * unifican —al contrario que en la emisión, donde `invalid-email` es útil para el
 * formulario— porque en esta pantalla el correo ya se validó en el paso anterior: si
 * llega mal, es que alguien está llamando al endpoint a mano, y a ese no hay que
 * ayudarle a distinguir qué parte falló.
 */
export class VerifyOtp {
  constructor(private readonly auth: AuthRepository) {}

  async execute(input: VerifyOtpInput): Promise<VerifyOtpResult> {
    const identifier = normalizeEmail(input.email);
    if (identifier === null) return { outcome: 'invalid' };

    const code = normalizeOtpCode(input.code);
    if (code === null) return { outcome: 'invalid' };

    const sessionToken = generateSessionToken();

    const verified = await this.auth.verifyOtp({
      identifier,
      code,
      sessionToken,
      sessionTtlMs: SESSION_TTL_MS,
      clientIp: input.clientIp,
      userAgent: input.userAgent,
    });

    if (verified.outcome !== 'verified') return verified;

    return {
      outcome: 'verified',
      actor: verified.actor,
      sessionToken,
      expiresAt: verified.expiresAt,
    };
  }
}
