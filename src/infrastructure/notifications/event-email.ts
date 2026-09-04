import 'server-only';

import type {
  ContentSubmittedNotice,
  EventCreatedNotice,
  EventNotifier,
} from '@/domain/events/event-notifier';
import type { ResendClient } from './resend-client';

/**
 * Los dos avisos del ciclo de vida de un evento, por correo.
 *
 * Misma estructura que `prospect-email.ts` —una implementación real y otra de consola— y la misma
 * maqueta de correo: tabla de 520px, sin imágenes y con los estilos en línea, que es lo único que
 * pintan igual Gmail, Outlook y Apple Mail.
 *
 * Cada mensaje va en texto **y** en HTML. No es cortesía: un correo solo-HTML puntúa peor en los
 * filtros de spam, y este es de los que no se pueden perder — lleva el enlace con el que un
 * cliente entra a llenar su invitación.
 */

const PRODUCT_NAME = 'MiEvento';

export class ResendEventNotifier implements EventNotifier {
  constructor(private readonly client: ResendClient) {}

  async notifyEventCreated(notice: EventCreatedNotice): Promise<boolean> {
    /* Solo el correo: el canal de WhatsApp todavía no existe. Cuando exista, este mismo aviso se
       podrá mandar por los dos y el caso de uso no se entera — por eso `to` trae los dos. */
    const result = await this.client.sendEmail({
      to: notice.to.email,
      subject: notice.contentUrl
        ? `Tu invitación está lista para llenarse · ${notice.eventTitle}`
        : `Empezamos con tu invitación · ${notice.eventTitle}`,
      html: createdHtml(notice),
      text: createdText(notice),
    });

    return result.outcome === 'sent';
  }

  async notifyContentSubmitted(notice: ContentSubmittedNotice): Promise<boolean> {
    if (notice.to.length === 0) return false;

    /*
     * Un correo con todos los destinatarios y no uno por persona: es un aviso interno del equipo,
     * y que cada quien vea a quién más le llegó es correcto —evita que dos personas revisen lo
     * mismo—. Los acuses a clientes sí van uno a uno, por lo contrario.
     */
    const result = await this.client.sendEmail({
      to: notice.to.join(', '),
      subject: `Contenido para revisar: ${notice.eventTitle} · ${notice.clientName}`,
      html: submittedHtml(notice),
      text: submittedText(notice),
    });

    return result.outcome === 'sent';
  }
}

/**
 * El respaldo cuando no hay proveedor configurado: lo escribe en la consola.
 *
 * En desarrollo es lo que permite seguir el flujo completo sin dar de alta un dominio en Resend —
 * el enlace del formulario se copia de la consola y se pega en el navegador—. Devuelve `false`
 * porque no se mandó nada, y quien llama lo usa para decir «te lo mandamos» o no.
 */
export class ConsoleEventNotifier implements EventNotifier {
  async notifyEventCreated(notice: EventCreatedNotice): Promise<boolean> {
    console.info(
      box('EVENTO CREADO (correo sin configurar)', [
        `Para:  ${notice.to.email}${notice.to.phone ? ` · ${notice.to.phone}` : ''}`,
        `Event: ${notice.eventTitle} · ${notice.eventDateLabel}`,
        notice.contentUrl ? `Llena: ${notice.contentUrl}` : 'La plataforma llena el contenido',
      ]),
    );

    return false;
  }

  async notifyContentSubmitted(notice: ContentSubmittedNotice): Promise<boolean> {
    console.info(
      box('CONTENIDO PARA REVISAR (correo sin configurar)', [
        `Para:  ${notice.to.join(', ') || '(sin admins con correo)'}`,
        `Event: ${notice.eventTitle} · ${notice.clientName}`,
        `Ficha: ${notice.reviewUrl}`,
      ]),
    );

    return false;
  }
}

/** El recuadro de la consola, igual que el de los códigos de acceso: para leerlo de un vistazo. */
function box(title: string, lines: readonly string[]): string {
  return [
    '',
    '┌─────────────────────────────────────────────────────────────',
    `│  ${title}`,
    '│',
    ...lines.map((line) => `│  ${line}`),
    '│',
    '└─────────────────────────────────────────────────────────────',
    '',
  ].join('\n');
}

function createdText(notice: EventCreatedNotice): string {
  return [
    `Hola ${notice.clientName},`,
    '',
    `Ya está creado «${notice.eventTitle}», del ${notice.eventDateLabel}.`,
    '',
    notice.contentUrl
      ? 'Para que podamos armar tu invitación necesitamos los datos de la celebración. Los llenas aquí:'
      : 'Nosotros nos encargamos de llenar la información. Te avisamos en cuanto esté lista para que la revises.',
    notice.contentUrl ?? null,
    '',
    notice.contentUrl
      ? 'Puedes guardar e ir completando poco a poco; nada se pierde entre visitas.'
      : null,
    '',
    PRODUCT_NAME,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}

function createdHtml(notice: EventCreatedNotice): string {
  const name = escapeHtml(notice.clientName);
  const title = escapeHtml(notice.eventTitle);
  const date = escapeHtml(notice.eventDateLabel);

  const call = notice.contentUrl
    ? `
                <p style="margin:0 0 24px 0;font-size:15px;color:#5c5457;">
                  Para armar tu invitación necesitamos los datos de la celebración.
                  Puedes guardar e ir completando poco a poco; nada se pierde entre visitas.
                </p>
                <p style="margin:0 0 28px 0;">
                  <a href="${escapeHtml(notice.contentUrl)}"
                     style="display:inline-block;padding:12px 24px;background:#7e4650;color:#ffffff;font-size:14px;letter-spacing:0.04em;text-decoration:none;">
                    Llenar mi información
                  </a>
                </p>
                <p style="margin:0;font-size:13px;color:#8a8082;">
                  Si el botón no abre, copia esta dirección: ${escapeHtml(notice.contentUrl)}
                </p>`
    : `
                <p style="margin:0;font-size:15px;color:#5c5457;">
                  Nosotros nos encargamos de llenar la información. Te avisamos en cuanto esté
                  lista para que la revises.
                </p>`;

  return shell(`
                <p style="margin:0 0 16px 0;font-size:16px;">Hola ${name},</p>
                <p style="margin:0 0 24px 0;font-size:15px;color:#5c5457;">
                  Ya está creado <strong>${title}</strong>, del ${date}.
                </p>${call}`);
}

function submittedText(notice: ContentSubmittedNotice): string {
  return [
    `${notice.clientName} terminó de llenar el contenido de «${notice.eventTitle}».`,
    '',
    'Está esperando revisión: entra, comprueba que todo esté bien y publícalo.',
    '',
    notice.reviewUrl,
  ].join('\n');
}

function submittedHtml(notice: ContentSubmittedNotice): string {
  return shell(`
                <p style="margin:0 0 16px 0;font-size:16px;">
                  <strong>${escapeHtml(notice.clientName)}</strong> mandó su contenido a revisión.
                </p>
                <p style="margin:0 0 24px 0;font-size:15px;color:#5c5457;">
                  ${escapeHtml(notice.eventTitle)}
                </p>
                <p style="margin:0;">
                  <a href="${escapeHtml(notice.reviewUrl)}"
                     style="display:inline-block;padding:12px 24px;background:#7e4650;color:#ffffff;font-size:14px;letter-spacing:0.04em;text-decoration:none;">
                    Revisar y publicar
                  </a>
                </p>`);
}

/** La caja del correo. La misma que la de prospectos, para que los dos se vean de la misma casa. */
function shell(inner: string): string {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#faf7f2;font-family:'DM Sans',Helvetica,Arial,sans-serif;color:#2f2a2c;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #ece4dc;">
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 24px 0;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#a8737f;">
                  ${PRODUCT_NAME}
                </p>${inner}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
