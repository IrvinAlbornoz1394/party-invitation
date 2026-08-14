import 'server-only';

import type { OtpChannel } from '@/domain/auth/otp-channel';
import { otpChannelLabel } from '@/domain/auth/otp-channel';
import type { OtpDeliveryResult, OtpMessage, OtpSender } from '@/domain/auth/otp-sender';

/**
 * Entrega por consola, para desarrollo.
 *
 * Se usa cuando el canal no tiene proveedor configurado y `NODE_ENV` no es producción. Sin
 * esto, trabajar en el login exigiría una clave de Resend y un dominio verificado antes de
 * poder entrar una sola vez al panel.
 *
 * ## La protección contra usarlo en producción
 *
 * El contenedor no lo registra si `NODE_ENV === 'production'`, y además este constructor
 * lo comprueba y revienta. Dos veces, porque la consecuencia de equivocarse es que los
 * códigos de acceso de todos los clientes queden escritos en los logs del despliegue —y
 * los logs de una plataforma los ve el equipo entero y cualquier servicio de observabilidad
 * conectado. Es un fallo que no avisa: el login "funciona", simplemente los códigos van al
 * sitio equivocado.
 *
 * Fallar al construirlo es lo correcto: mejor que el arranque se caiga con un mensaje
 * claro que descubrirlo revisando logs tres semanas después.
 */
export class ConsoleOtpSender implements OtpSender {
  constructor(readonly channel: OtpChannel) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'ConsoleOtpSender no puede usarse en producción: escribiría los códigos de acceso ' +
          'en los logs del despliegue. Configura el proveedor del canal ' +
          `"${channel}" (RESEND_API_KEY y AUTH_EMAIL_FROM para correo).`,
      );
    }
  }

  async send(message: OtpMessage): Promise<OtpDeliveryResult> {
    // Recuadro y no una línea suelta: en la consola de `next dev`, entre recompilaciones y
    // avisos, una línea más se pierde. Esto es para leerlo de un vistazo.
    const lines = [
      '',
      '┌─────────────────────────────────────────────────────────────',
      `│  CÓDIGO DE ACCESO (${otpChannelLabel(this.channel)} sin configurar)`,
      '│',
      `│  Para:   ${message.destination}`,
      `│  Código: ${message.code}`,
      `│  Vence:  en ${message.expiresInMinutes} minutos`,
      '│',
      '│  Esto solo aparece en desarrollo.',
      '└─────────────────────────────────────────────────────────────',
      '',
    ];

    console.info(lines.join('\n'));

    return { outcome: 'sent', providerId: null };
  }
}
