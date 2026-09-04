import 'server-only';

import type { OtpMessage } from '@/domain/auth/otp-sender';

/**
 * Redacción del mensaje que lleva el código.
 *
 * Vive aparte del adaptador de Resend porque el texto es el mismo para cualquier
 * proveedor de correo, y porque la versión de texto plano se reutilizará casi igual en
 * WhatsApp. Cambiar de proveedor no debería obligar a reescribir lo que dice el mensaje.
 *
 * Tres cosas que el texto hace a propósito:
 *
 *   · Dice cuánto vale el código. Sin eso, quien lo recibe tarde no sabe si el problema
 *     es que teclea mal o que ya venció, y reintenta hasta quemar sus cinco intentos.
 *   · Avisa de que nadie lo va a pedir. Es la defensa contra el único ataque que queda
 *     abierto cuando la criptografía está bien: llamar por teléfono al usuario y pedirle
 *     el código. Ninguna medida técnica lo evita; una frase en el mensaje ayuda.
 *   · No incluye ningún enlace. Un correo de acceso con un botón entrena a la gente a
 *     hacer clic en botones de correos de acceso, que es justo el hábito que explota el
 *     phishing. Aquí el usuario vuelve a la pestaña que ya tenía abierta.
 */

const PRODUCT_NAME = 'MiEvento';

export function otpEmailSubject(code: string): string {
  /*
   * El código va en el asunto además del cuerpo. Es deliberado: se ve en la
   * notificación del teléfono sin abrir el correo, que es como lo lee casi todo el
   * mundo. El riesgo —que asome en la pantalla de bloqueo— existe, pero el código sin
   * el correo del usuario no sirve para nada, y quien tiene el teléfono desbloqueado
   * tiene también el correo.
   */
  return `${code} es tu código de acceso · ${PRODUCT_NAME}`;
}

export function otpPlainTextBody(message: OtpMessage): string {
  return [
    `Hola ${message.recipientName},`,
    '',
    `Tu código para entrar a tu panel de ${PRODUCT_NAME} es:`,
    '',
    message.code,
    '',
    `Vence en ${message.expiresInMinutes} minutos y solo se puede usar una vez.`,
    '',
    'Si no pediste este código, ignora este mensaje: sin él nadie puede entrar a tu',
    'cuenta. Nunca te lo vamos a pedir por teléfono, WhatsApp ni correo.',
    '',
    PRODUCT_NAME,
  ].join('\n');
}

/**
 * Versión HTML.
 *
 * Estilos en línea y una tabla de una sola celda, que es lo que sobrevive a los clientes
 * de correo: Gmail elimina las etiquetas `<style>` del encabezado y Outlook renderiza con
 * el motor de Word. No es el HTML que uno escribiría para un navegador, y ese es el
 * motivo.
 *
 * El código va con `letter-spacing` y a tamaño grande porque su función principal es que
 * alguien lo lea de la pantalla del teléfono y lo teclee en la computadora.
 */
export function otpHtmlBody(message: OtpMessage): string {
  const safeName = escapeHtml(message.recipientName);

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#faf7f2;font-family:'DM Sans',Helvetica,Arial,sans-serif;color:#2f2a2c;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #ece4dc;">
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <p style="margin:0 0 24px 0;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#a8737f;">
                  ${PRODUCT_NAME}
                </p>
                <p style="margin:0 0 16px 0;font-size:16px;">Hola ${safeName},</p>
                <p style="margin:0 0 24px 0;font-size:15px;color:#5c5457;">
                  Este es tu código para entrar a tu panel:
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 32px 24px 32px;">
                <div style="display:inline-block;padding:16px 28px;background:#faf7f2;border:1px solid #ece4dc;font-size:34px;line-height:1;letter-spacing:0.32em;font-weight:600;color:#7e4650;">
                  ${message.code}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px 32px;">
                <p style="margin:0 0 20px 0;font-size:14px;color:#5c5457;">
                  Vence en ${message.expiresInMinutes} minutos y solo se puede usar una vez.
                </p>
                <p style="margin:0;padding-top:20px;border-top:1px solid #ece4dc;font-size:13px;color:#8a8082;">
                  Si no pediste este código, ignora este mensaje. Nunca te lo vamos a pedir
                  por teléfono, WhatsApp ni correo.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * El nombre viene de la base de datos y acaba dentro de HTML.
 *
 * Es un nombre que escribió un administrador, no un desconocido, así que el riesgo es
 * bajo — pero "bajo" no es "ninguno", y un nombre con `<script>` en un correo que se abre
 * en un webmail es un XSS con más alcance que el de una página propia. Escapar cuesta
 * cinco líneas.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Texto para WhatsApp. Sin HTML y más corto, que es el registro del canal. */
export function otpWhatsAppBody(message: OtpMessage): string {
  return (
    `*${message.code}* es tu código de acceso a ${PRODUCT_NAME}.\n\n` +
    `Vence en ${message.expiresInMinutes} minutos. ` +
    'Nunca te lo vamos a pedir por teléfono ni por mensaje.'
  );
}
