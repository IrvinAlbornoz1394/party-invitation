import 'server-only';

import type { OtpChannel } from '@/domain/auth/otp-channel';
import type { OtpDeliveryResult, OtpMessage, OtpSender } from '@/domain/auth/otp-sender';
import { otpEmailSubject, otpHtmlBody, otpPlainTextBody } from './otp-message';
import type { ResendClient } from './resend-client';

/**
 * Entrega del código de acceso por correo.
 *
 * Es un adaptador delgado a propósito: la mecánica de hablar con el proveedor —tiempos de
 * espera, errores, redacción de los fallos— vive en `ResendClient`, compartida con el correo
 * de invitación al equipo. Aquí solo queda traducir un `OtpMessage` del dominio a un correo.
 */
export class ResendEmailSender implements OtpSender {
  readonly channel: OtpChannel = 'email';

  constructor(private readonly client: ResendClient) {}

  async send(message: OtpMessage): Promise<OtpDeliveryResult> {
    const result = await this.client.sendEmail({
      to: message.destination,
      subject: otpEmailSubject(message.code),
      html: otpHtmlBody(message),
      text: otpPlainTextBody(message),
    });

    return result.outcome === 'sent'
      ? { outcome: 'sent', providerId: result.providerId }
      : { outcome: 'failed', reason: result.reason };
  }
}
