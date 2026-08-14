import 'server-only';

import type { OtpChannel } from '@/domain/auth/otp-channel';
import type { OtpSender, OtpSenderRouter } from '@/domain/auth/otp-sender';

/**
 * Resuelve el adaptador de cada canal.
 *
 * Es un mapa y no un `switch` para que la lista de canales disponibles sea un dato que se
 * construye en el contenedor según lo que haya configurado. Consecuencia práctica: el caso
 * de uso puede preguntar "¿hay forma de entregar por WhatsApp?" antes de emitir el código,
 * en lugar de descubrirlo cuando ya invalidó el código anterior del usuario.
 */
export class ChannelOtpSenderRouter implements OtpSenderRouter {
  private readonly senders: Map<OtpChannel, OtpSender>;

  constructor(senders: readonly OtpSender[]) {
    this.senders = new Map(senders.map((sender) => [sender.channel, sender]));
  }

  senderFor(channel: OtpChannel): OtpSender | null {
    return this.senders.get(channel) ?? null;
  }

  /** Canales con adaptador registrado. La interfaz decide qué opciones ofrecer con esto. */
  get availableChannels(): readonly OtpChannel[] {
    return [...this.senders.keys()];
  }
}
