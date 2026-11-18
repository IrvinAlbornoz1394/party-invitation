/**
 * Lo que un notificador necesita de un proveedor de correo: mandar un mensaje y saber si salió.
 *
 * Hay dos implementaciones —`ResendClient` por HTTP y `GmailSmtpClient` por SMTP— y los
 * notificadores (código de acceso, invitación al equipo, avisos de evento y de prospectos)
 * dependen de esta interfaz, no de ninguna de las dos. Cambiar de proveedor es cambiar qué
 * construye el contenedor, sin tocar a quien redacta los correos.
 */
export type SendEmailResult =
  | { readonly outcome: 'sent'; readonly providerId: string | null }
  | { readonly outcome: 'failed'; readonly reason: string };

export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

export interface EmailClient {
  sendEmail(message: EmailMessage): Promise<SendEmailResult>;
}
