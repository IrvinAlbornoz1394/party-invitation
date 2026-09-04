import 'server-only';

import type {
  ProspectNotice,
  ProspectNotifier,
} from '@/domain/prospects/prospect-notifier';
import { env } from '@/lib/env';
import type { ResendClient } from './resend-client';

const PRODUCT_NAME = 'MiEvento';

/**
 * Los dos correos de una solicitud nueva.
 *
 * ## El aviso a la plataforma lleva los datos, no solo el enlace
 *
 * Un «tienes una solicitud nueva» obligaría a abrir el panel para saber si corría prisa, y ese
 * viaje es justo el que hace que un aviso se ignore. Con el nombre, el teléfono y qué pide, se
 * puede decidir desde el móvil si se atiende ahora — y en el mejor de los casos, contestar por
 * WhatsApp sin abrir nada.
 *
 * Por eso lleva también el enlace `wa.me`: el trabajo real que sigue a este correo es escribirle a
 * alguien.
 *
 * ## El acuse no promete nada nuevo
 *
 * Repite lo que la pantalla de gracias ya dijo —«te escribimos en menos de 24 horas»— y esa
 * repetición es su función: la pantalla ya se cerró, y a las seis horas esa persona no tiene otra
 * forma de saber que su solicitud llegó.
 *
 * No lleva enlaces de seguimiento ni un panel donde consultar el estado. Sería prometer una
 * herramienta que no existe para alguien que todavía no es cliente.
 */
export class ResendProspectNotifier implements ProspectNotifier {
  constructor(
    private readonly client: ResendClient,
    /** A dónde llega el aviso interno. Ver `PROSPECT_NOTICE_EMAIL` en `lib/env.ts`. */
    private readonly noticeTo: string,
  ) {}

  async notifyPlatform(notice: ProspectNotice): Promise<boolean> {
    const result = await this.client.sendEmail({
      to: this.noticeTo,
      /*
       * El asunto lleva el nombre y el teléfono. En una bandeja de entrada, un asunto que dice
       * «Solicitud nueva» y nada más obliga a abrir el correo para saber de quién era; con el
       * nombre delante, la lista se lee como una bandeja de prospectos.
       */
      subject: `Solicitud nueva: ${notice.form.contactName} · ${notice.form.contactPhone}`,
      html: platformHtml(notice),
      text: platformText(notice),
    });

    return result.outcome === 'sent';
  }

  async acknowledge(notice: ProspectNotice): Promise<boolean> {
    const to = notice.form.contactEmail;

    // Sin correo no hay acuse, y es un caso normal: el correo es opcional en el formulario porque
    // la conversación va por WhatsApp.
    if (!to) return false;

    const result = await this.client.sendEmail({
      to,
      subject: `Recibimos tu solicitud · ${PRODUCT_NAME}`,
      html: acknowledgeHtml(notice),
      text: acknowledgeText(notice),
    });

    return result.outcome === 'sent';
  }
}

/**
 * En desarrollo, sin proveedor: los dos avisos se escriben en la consola.
 *
 * A diferencia de `ConsoleInvitationNotifier`, este **no revienta en producción**. La diferencia
 * es deliberada y viene de qué se pierde en cada caso: una invitación sin enviar deja a alguien
 * sin poder entrar —eso hay que impedirlo—, mientras que una solicitud sin aviso sigue estando en
 * la bandeja. Tumbar el formulario público porque falta configurar el correo convertiría un aviso
 * perdido en un prospecto perdido, que es peor.
 */
export class ConsoleProspectNotifier implements ProspectNotifier {
  async notifyPlatform(notice: ProspectNotice): Promise<boolean> {
    console.info(
      [
        '',
        '┌─────────────────────────────────────────────────────────────',
        '│  SOLICITUD NUEVA (aviso por correo sin configurar)',
        '│',
        `│  ${notice.form.contactName} · ${notice.form.contactPhone}`,
        `│  ${describeAsk(notice) || 'Sin más detalles'}`,
        `│  Bandeja: ${inboxUrl()}`,
        '│',
        '└─────────────────────────────────────────────────────────────',
        '',
      ].join('\n'),
    );

    return false;
  }

  async acknowledge(notice: ProspectNotice): Promise<boolean> {
    if (notice.form.contactEmail) {
      console.info(`  · Acuse a ${notice.form.contactEmail} (correo sin configurar)`);
    }

    return false;
  }
}

function inboxUrl(): string {
  return `${env.NEXT_PUBLIC_SITE_URL}/admin/prospectos`;
}

/**
 * Qué pide, en una línea.
 *
 * Se compone de lo que haya en vez de enumerar campos vacíos: casi todos son opcionales, y un
 * correo con seis renglones que dicen «—» se lee peor que uno con la línea que esa persona sí
 * contestó.
 */
function describeAsk(notice: ProspectNotice): string {
  const { form } = notice;

  return [
    form.eventTypeKey,
    form.planKey ? `plan ${form.planKey}` : null,
    form.templateKey ? `plantilla ${form.templateKey}` : null,
    form.guestRange ? `${form.guestRange} invitados` : null,
    form.eventDate,
  ]
    .filter((part): part is string => Boolean(part))
    .join(' · ');
}

function platformText(notice: ProspectNotice): string {
  const { form } = notice;

  return [
    'Llegó una solicitud desde la web.',
    '',
    `Nombre:   ${form.contactName}`,
    `WhatsApp: ${form.contactPhone}`,
    form.contactEmail ? `Correo:   ${form.contactEmail}` : null,
    describeAsk(notice) ? `Pide:     ${describeAsk(notice)}` : null,
    '',
    form.message ? `«${form.message}»` : null,
    form.message ? '' : null,
    `Escríbele: https://wa.me/${digitsOf(form.contactPhone)}`,
    `La bandeja: ${inboxUrl()}`,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}

function acknowledgeText(notice: ProspectNotice): string {
  return [
    `Hola ${notice.form.contactName},`,
    '',
    'Recibimos tu solicitud. Te escribimos por WhatsApp en menos de 24 horas',
    `al ${notice.form.contactPhone}.`,
    '',
    'Si mientras tanto quieres contarnos algo más, responde a este correo.',
    '',
    PRODUCT_NAME,
  ].join('\n');
}

/**
 * El teléfono sin espacios ni signos, para `wa.me`.
 *
 * No se normaliza a E.164 ni se le antepone el país: el número se guarda tal como lo escribió la
 * persona, y adivinar un prefijo produciría enlaces rotos en cuanto alguien escriba desde fuera de
 * México. Con diez dígitos, WhatsApp resuelve el país por la cuenta que abre el enlace.
 */
function digitsOf(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

/*
 * Estilos en línea y tabla de una celda, que es lo que sobrevive a los clientes de correo: Gmail
 * elimina las etiquetas `<style>` del encabezado y Outlook renderiza con el motor de Word. No es el
 * HTML que uno escribiría para un navegador, y ese es el motivo.
 */
function platformHtml(notice: ProspectNotice): string {
  const { form } = notice;
  const ask = describeAsk(notice);

  const rows = [
    ['WhatsApp', form.contactPhone],
    ['Correo', form.contactEmail],
    ['Pide', ask || null],
  ]
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(
      ([label, value]) => `
              <tr>
                <td style="padding:4px 0;font-size:13px;color:#8a8082;width:96px;">${escapeHtml(label)}</td>
                <td style="padding:4px 0;font-size:15px;color:#2f2a2c;">${escapeHtml(value)}</td>
              </tr>`,
    )
    .join('');

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
                  Solicitud nueva
                </p>
                <p style="margin:0 0 20px 0;font-size:20px;font-weight:600;">${escapeHtml(form.contactName)}</p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px 0;">${rows}
                </table>
                ${
                  form.message
                    ? `<p style="margin:0 0 24px 0;padding:12px 16px;border-left:3px solid #a8737f;background:#faf7f2;font-size:14px;font-style:italic;color:#5c5457;">${escapeHtml(form.message)}</p>`
                    : ''
                }
                <a href="https://wa.me/${escapeHtml(digitsOf(form.contactPhone))}"
                   style="display:inline-block;padding:12px 24px;background:#6b3a5e;color:#ffffff;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;text-decoration:none;">
                  Escribirle por WhatsApp
                </a>
                <p style="margin:24px 0 0 0;font-size:13px;color:#8a8082;">
                  <a href="${escapeHtml(inboxUrl())}" style="color:#6b3a5e;">Ver en la bandeja</a>
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

function acknowledgeHtml(notice: ProspectNotice): string {
  const name = escapeHtml(notice.form.contactName);
  const phone = escapeHtml(notice.form.contactPhone);

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#faf7f2;font-family:'DM Sans',Helvetica,Arial,sans-serif;color:#2f2a2c;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #ece4dc;">
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 24px 0;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#a8737f;">
                  ${PRODUCT_NAME}
                </p>
                <p style="margin:0 0 16px 0;font-size:16px;">Hola ${name},</p>
                <p style="margin:0 0 28px 0;font-size:15px;color:#5c5457;">
                  Recibimos tu solicitud. Te escribimos por WhatsApp en menos de 24 horas
                  al <strong>${phone}</strong>.
                </p>
                <p style="margin:0;font-size:14px;color:#8a8082;">
                  Si mientras tanto quieres contarnos algo más, responde a este correo.
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
