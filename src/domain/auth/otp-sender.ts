import type { OtpChannel } from './otp-channel';

/**
 * Puerto de entrega del código.
 *
 * Un puerto por canal, resueltos por un router, en lugar de una sola función con un
 * `switch` dentro: así el adaptador de WhatsApp se escribe y se registra sin abrir el
 * de correo, y el que no esté configurado falla al usarse en vez de al arrancar.
 */

export interface OtpMessage {
  /** Correo en E.164 o dirección de correo, según el canal. Ya normalizado. */
  readonly destination: string;
  /** Nombre de la persona, para encabezar el mensaje. */
  readonly recipientName: string;
  readonly code: string;
  /** Minutos de validez, para decirlo en el mensaje. */
  readonly expiresInMinutes: number;
}

export type OtpDeliveryResult =
  | { readonly outcome: 'sent'; readonly providerId: string | null }
  /**
   * El canal no está configurado en este despliegue (falta la credencial del proveedor).
   * Se distingue de un fallo porque no es un incidente: en desarrollo es lo normal.
   */
  | { readonly outcome: 'not-configured' }
  | { readonly outcome: 'failed'; readonly reason: string };

export interface OtpSender {
  readonly channel: OtpChannel;
  send(message: OtpMessage): Promise<OtpDeliveryResult>;
}

/**
 * Elige el adaptador que corresponde al canal.
 *
 * Existe como interfaz propia para que el caso de uso dependa de "algo que sabe
 * entregar por un canal" y no de un mapa concreto de adaptadores.
 */
export interface OtpSenderRouter {
  /** Devuelve null si no hay ningún adaptador registrado para ese canal. */
  senderFor(channel: OtpChannel): OtpSender | null;
}
