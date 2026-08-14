import type { AuthRepository } from '@/domain/auth/auth-repository';
import { normalizeEmail } from '@/domain/auth/email-address';
import { generateOtpCode } from '@/domain/auth/otp-code';
import { type OtpChannel, otpChannelLabel } from '@/domain/auth/otp-channel';
import type { OtpSenderRouter } from '@/domain/auth/otp-sender';
import { OTP_TTL_MS } from '@/domain/auth/session';

export interface RequestOtpInput {
  readonly email: string;
  /** Canal pedido por el usuario. null usa la preferencia de la cuenta. */
  readonly channel: OtpChannel | null;
  readonly clientIp: string | null;
  readonly userAgent: string | null;
}

/**
 * Lo que la interfaz puede saber del resultado.
 *
 * `accepted` NO significa "el código se envió". Significa "si esa cuenta existe, el
 * código va en camino". Es la única respuesta posible sin convertir el formulario en un
 * buscador de correos registrados, y por eso el tipo no tiene ningún caso que diga
 * "usuario no encontrado": si no existe en el tipo, no se puede filtrar por descuido en
 * una pantalla.
 */
export type RequestOtpResult =
  | {
      readonly outcome: 'accepted';
      /**
       * Canal por el que iría el mensaje, para poder escribir "revisa tu correo" o
       * "revisa tu WhatsApp".
       *
       * Es el canal PEDIDO, no el resuelto. Si alguien pide WhatsApp y la cuenta no
       * tiene teléfono, el código sale por correo pero aquí se sigue diciendo WhatsApp:
       * decir la verdad revelaría que esa cuenta existe y que no tiene teléfono, y esa
       * es información sobre una cuenta que quizá no es la de quien está preguntando.
       */
      readonly channel: OtpChannel;
      readonly channelLabel: string;
    }
  /** Forma del correo inválida. Esto sí se puede decir: no toca la base de datos. */
  | { readonly outcome: 'invalid-email' }
  | { readonly outcome: 'rate-limited' }
  /**
   * El canal existe pero no está configurado en este despliegue. Es un problema de
   * operación, no del usuario, y la interfaz debe decirlo como tal en lugar de dejarlo
   * esperando un mensaje que nunca va a llegar.
   */
  | { readonly outcome: 'channel-unavailable'; readonly channel: OtpChannel };

/**
 * Caso de uso: pedir un código para entrar al panel.
 *
 * ## El orden de los pasos es la seguridad
 *
 * 1. Validar la forma del correo. Antes de tocar la base de datos, para que un envío
 *    malformado no consuma el presupuesto de intentos de nadie.
 * 2. Generar el código. Lo hace la aplicación, no Postgres: es la única forma de que el
 *    valor en claro exista solo en memoria y en el mensaje, y de que a la base de datos
 *    entre únicamente su HMAC.
 * 3. Emitir contra el repositorio, que aplica los límites y sella el código anterior de
 *    forma atómica.
 * 4. Entregar. Al final, porque un fallo de entrega no debe dejar el límite sin aplicar.
 *
 * ## Qué pasa si el correo no sale
 *
 * El código ya está emitido y el anterior ya está invalidado. Se devuelve `accepted` de
 * todas formas cuando el fallo es del proveedor: el usuario puede reintentar y, si el
 * problema persiste, el tope de tres emisiones lo detiene. Lo que no se hace es decirle
 * "hubo un error enviando el correo a esa dirección", porque eso sí confirmaría que la
 * dirección está registrada.
 */
export class RequestOtp {
  constructor(
    private readonly auth: AuthRepository,
    private readonly senders: OtpSenderRouter,
  ) {}

  async execute(input: RequestOtpInput): Promise<RequestOtpResult> {
    const identifier = normalizeEmail(input.email);
    if (identifier === null) return { outcome: 'invalid-email' };

    const requestedChannel = input.channel;

    /*
     * Se comprueba que el canal pedido tenga adaptador ANTES de emitir. Si no lo tiene,
     * emitir dejaría el código anterior invalidado y consumiría una de las tres
     * emisiones de la ventana a cambio de nada: el usuario perdería el código que sí
     * tenía y no recibiría el nuevo.
     */
    if (requestedChannel !== null && this.senders.senderFor(requestedChannel) === null) {
      return { outcome: 'channel-unavailable', channel: requestedChannel };
    }

    const code = generateOtpCode();

    const issued = await this.auth.issueOtp({
      identifier,
      requestedChannel,
      code,
      ttlMs: OTP_TTL_MS,
      clientIp: input.clientIp,
      userAgent: input.userAgent,
    });

    if (issued.outcome === 'rate-limited') return { outcome: 'rate-limited' };

    /*
     * La cuenta no existe. Se responde exactamente igual que si existiera —mismo tipo,
     * mismo canal, misma etiqueta— y no se envía nada. El canal que se reporta es el
     * pedido o el correo por defecto, porque sin cuenta no hay preferencia que consultar.
     */
    const announcedChannel = requestedChannel ?? 'email';

    if (issued.outcome === 'no-account') {
      return {
        outcome: 'accepted',
        channel: announcedChannel,
        channelLabel: otpChannelLabel(announcedChannel),
      };
    }

    await this.deliver({
      channel: issued.channel,
      destination: issued.destination,
      recipientName: issued.name,
      code,
      expiresAt: issued.expiresAt,
    });

    return {
      outcome: 'accepted',
      channel: announcedChannel,
      channelLabel: otpChannelLabel(announcedChannel),
    };
  }

  private async deliver(message: {
    readonly channel: OtpChannel;
    readonly destination: string;
    readonly recipientName: string;
    readonly code: string;
    readonly expiresAt: Date;
  }): Promise<void> {
    const sender = this.senders.senderFor(message.channel);

    /*
     * El canal resuelto puede no tener adaptador aunque el pedido sí lo tuviera: es el
     * caso de una cuenta cuya preferencia guardada es WhatsApp cuando WhatsApp todavía
     * no está configurado. No hay nada que hacer salvo dejar rastro; el código emitido
     * caduca solo en diez minutos.
     */
    if (sender === null) return;

    const expiresInMinutes = Math.max(
      1,
      Math.round((message.expiresAt.getTime() - Date.now()) / 60_000),
    );

    await sender.send({
      destination: message.destination,
      recipientName: message.recipientName,
      code: message.code,
      expiresInMinutes,
    });
  }
}
