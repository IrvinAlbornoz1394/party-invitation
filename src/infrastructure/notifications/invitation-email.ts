import 'server-only';

import type {
  EventAccessInvitation,
  InvitationDeliveryResult,
  InvitationNotifier,
  TeamInvitation,
} from '@/domain/auth/invitation-notifier';
import { env } from '@/lib/env';
import type { ResendClient } from './resend-client';

/**
 * Correo de alta en el panel.
 *
 * Deliberadamente **sin enlace con token**: solo la dirección de la pantalla de acceso. Ver
 * el comentario del puerto en `domain/auth/invitation-notifier.ts` — el motivo es que con
 * OTP un token de invitación sería una segunda credencial sin ninguna ventaja.
 *
 * El mensaje dice quién dio el alta y a qué cliente. Sin ese contexto, un correo que
 * dice "ya tienes cuenta" en un producto que la persona no recuerda haber contratado parece
 * phishing, y acaba en la papelera o —peor— en una llamada preguntando si es real.
 */
const PRODUCT_NAME = 'MiEvento';

/** Se compone aquí porque depende del despliegue, no del negocio. */
function loginUrl(): string {
  return `${env.NEXT_PUBLIC_SITE_URL}/acceso`;
}

export class ResendInvitationNotifier implements InvitationNotifier {
  constructor(private readonly client: ResendClient) {}

  async send(invitation: TeamInvitation): Promise<InvitationDeliveryResult> {
    const result = await this.client.sendEmail({
      to: invitation.email,
      subject: `Ya tienes acceso al panel de ${invitation.clientName}`,
      html: invitationHtml(invitation),
      text: invitationText(invitation),
    });

    return result.outcome === 'sent'
      ? { outcome: 'sent' }
      : { outcome: 'failed', reason: result.reason };
  }

  async sendEventAccess(invitation: EventAccessInvitation): Promise<InvitationDeliveryResult> {
    const result = await this.client.sendEmail({
      to: invitation.email,
      subject: `Ya puedes ver «${invitation.eventTitle}»`,
      html: eventAccessHtml(invitation),
      text: eventAccessText(invitation),
    });

    return result.outcome === 'sent'
      ? { outcome: 'sent' }
      : { outcome: 'failed', reason: result.reason };
  }
}

/** En desarrollo, sin proveedor: se escribe en la consola para poder seguir el flujo. */
export class ConsoleInvitationNotifier implements InvitationNotifier {
  constructor() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'ConsoleInvitationNotifier no puede usarse en producción: nadie recibiría su ' +
          'invitación. Configura RESEND_API_KEY y AUTH_EMAIL_FROM.',
      );
    }
  }

  async send(invitation: TeamInvitation): Promise<InvitationDeliveryResult> {
    console.info(
      [
        '',
        '┌─────────────────────────────────────────────────────────────',
        '│  INVITACIÓN AL PANEL (correo sin configurar)',
        '│',
        `│  Para:   ${invitation.email}`,
        `│  Equipo: ${invitation.clientName}`,
        `│  Entra:  ${loginUrl()}`,
        '│',
        '│  Esto solo aparece en desarrollo.',
        '└─────────────────────────────────────────────────────────────',
        '',
      ].join('\n'),
    );

    return { outcome: 'sent' };
  }

  async sendEventAccess(invitation: EventAccessInvitation): Promise<InvitationDeliveryResult> {
    console.info(
      [
        '',
        '┌─────────────────────────────────────────────────────────────',
        '│  ACCESO A UN EVENTO (correo sin configurar)',
        '│',
        `│  Para:   ${invitation.email}`,
        `│  Evento: ${invitation.eventTitle}`,
        `│  Entra:  ${invitation.eventUrl}`,
        '│',
        '│  Esto solo aparece en desarrollo.',
        '└─────────────────────────────────────────────────────────────',
        '',
      ].join('\n'),
    );

    return { outcome: 'sent' };
  }
}

function invitationText(invitation: TeamInvitation): string {
  return [
    `Hola ${invitation.recipientName},`,
    '',
    `${invitation.inviterName} te dio acceso al panel de ${invitation.clientName}`,
    `en ${PRODUCT_NAME}.`,
    '',
    'Entra aquí:',
    loginUrl(),
    '',
    'No necesitas contraseña: escribe este mismo correo y te mandamos un código de',
    '6 dígitos para entrar.',
    '',
    PRODUCT_NAME,
  ].join('\n');
}

/**
 * Estilos en línea y tabla de una celda, que es lo que sobrevive a los clientes de correo:
 * Gmail elimina las etiquetas `<style>` del encabezado y Outlook renderiza con el motor de
 * Word. No es el HTML que uno escribiría para un navegador, y ese es el motivo.
 */
function invitationHtml(invitation: TeamInvitation): string {
  const name = escapeHtml(invitation.recipientName);
  const inviter = escapeHtml(invitation.inviterName);
  const client = escapeHtml(invitation.clientName);
  const url = escapeHtml(loginUrl());

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
                  ${inviter} te dio acceso al panel de <strong>${client}</strong>.
                </p>
                <a href="${url}" style="display:inline-block;padding:14px 26px;background:#7e4650;color:#ffffff;text-decoration:none;font-size:13px;letter-spacing:0.09em;text-transform:uppercase;font-weight:600;">
                  Entrar al panel
                </a>
                <p style="margin:28px 0 0 0;padding-top:20px;border-top:1px solid #ece4dc;font-size:13px;color:#8a8082;">
                  No necesitas contraseña: escribe este mismo correo y te mandamos un código
                  de 6 dígitos para entrar.
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
 * El saludo cae a «Hola,» cuando no hay etiqueta.
 *
 * No se cae al correo, al contrario que `displayNameOf()` en el panel: ahí el correo distingue
 * una fila de otra en una lista, y aquí quien lee ya sabe cuál es el suyo — repetírselo dentro
 * del mensaje que acaba de recibir suena a plantilla mal rellenada.
 */
function greeting(label: string | null): string {
  return label && label.trim() ? `Hola ${label.trim()},` : 'Hola,';
}

function eventAccessText(invitation: EventAccessInvitation): string {
  return [
    greeting(invitation.label),
    '',
    `${invitation.inviterName} te dio acceso a «${invitation.eventTitle}»`,
    `en ${PRODUCT_NAME}.`,
    '',
    'Míralo aquí:',
    invitation.eventUrl,
    '',
    'No necesitas contraseña: escribe este mismo correo y te mandamos un código de',
    '6 dígitos para entrar.',
    '',
    PRODUCT_NAME,
  ].join('\n');
}

function eventAccessHtml(invitation: EventAccessInvitation): string {
  const hello = escapeHtml(greeting(invitation.label));
  const inviter = escapeHtml(invitation.inviterName);
  const event = escapeHtml(invitation.eventTitle);
  const client = escapeHtml(invitation.clientName);
  const url = escapeHtml(invitation.eventUrl);

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
                <p style="margin:0 0 16px 0;font-size:16px;">${hello}</p>
                <p style="margin:0 0 28px 0;font-size:15px;color:#5c5457;">
                  ${inviter} te dio acceso a <strong>${event}</strong>, de ${client}.
                </p>
                <a href="${url}" style="display:inline-block;padding:14px 26px;background:#7e4650;color:#ffffff;text-decoration:none;font-size:13px;letter-spacing:0.09em;text-transform:uppercase;font-weight:600;">
                  Ver el evento
                </a>
                <p style="margin:28px 0 0 0;padding-top:20px;border-top:1px solid #ece4dc;font-size:13px;color:#8a8082;">
                  No necesitas contraseña: escribe este mismo correo y te mandamos un código
                  de 6 dígitos para entrar.
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
 * El nombre y el cliente vienen de la base de datos y acaban dentro de HTML. Los
 * escribió un administrador, no un desconocido, así que el riesgo es bajo — pero "bajo" no
 * es "ninguno", y un nombre con `<script>` en un correo que se abre en un webmail es un XSS
 * con más alcance que el de una página propia.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
