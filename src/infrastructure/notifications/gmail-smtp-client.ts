import 'server-only';

import nodemailer, { type Transporter } from 'nodemailer';

import type { EmailClient, EmailMessage, SendEmailResult } from './email-client';

/**
 * Envío por el SMTP de Gmail, con una contraseña de aplicación.
 *
 * ## Para qué existe
 *
 * Resend solo escribe a cualquier destinatario desde un dominio verificado. Mientras no haya
 * dominio propio, Gmail permite mandar a quien sea desde la cuenta personal (unos 500 correos al
 * día). Es un puente: en cuanto haya dominio, se quitan `GMAIL_USER` y `GMAIL_APP_PASSWORD` y el
 * contenedor vuelve solo a Resend.
 *
 * ## El remitente lo pone Gmail
 *
 * Gmail reescribe el `From` con la cuenta autenticada, así que aquí se fija a esa cuenta y solo se
 * elige el nombre visible. Mandar como otra dirección no funcionaría y, si funcionara, fallaría
 * SPF/DMARC y acabaría en spam.
 *
 * ## SMTP en serverless
 *
 * El aviso de `ResendClient` sigue en pie: una conexión SMTP puede quedarse a medias si la función
 * se congela. Por eso se espera al `sendMail` completo dentro de la petición y se ponen topes de
 * tiempo cortos, para fallar con un motivo en lugar de colgarse.
 */

/** Mismo tope que Resend: el usuario está mirando un botón de cargando. */
const TIMEOUT_MS = 8_000;

export class GmailSmtpClient implements EmailClient {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(user: string, appPassword: string, senderName = 'MiEvento') {
    this.from = `"${senderName}" <${user}>`;
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      // Google muestra la contraseña de aplicación en grupos de cuatro con espacios; se aceptan
      // tal cual se copian.
      auth: { user, pass: appPassword.replace(/\s+/g, '') },
      connectionTimeout: TIMEOUT_MS,
      greetingTimeout: TIMEOUT_MS,
      socketTimeout: TIMEOUT_MS,
    });
  }

  async sendEmail(message: EmailMessage): Promise<SendEmailResult> {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });

      if (info.rejected.length > 0) {
        return { outcome: 'failed', reason: 'gmail: el servidor rechazó al destinatario' };
      }

      return { outcome: 'sent', providerId: info.messageId ?? null };
    } catch (error: unknown) {
      // Igual que en Resend: el motivo sí, el destinatario y el contenido nunca.
      return {
        outcome: 'failed',
        reason: `gmail: ${error instanceof Error ? error.message : 'error desconocido'}`,
      };
    }
  }
}
