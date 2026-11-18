'use server';

import { redirect } from 'next/navigation';
import { redeemContentLink } from '@/infrastructure/container';
import { getRequestIp, getRequestUserAgent } from '@/lib/auth/current-session';
import { writeSessionCookie } from '@/lib/auth/session-cookie';

/**
 * «Entrar a llenar mi invitación»: canjea el enlace por una sesión de ese evento y lleva al
 * formulario. Si no se puede, vuelve a la misma página diciendo por qué.
 *
 * Va en un POST a propósito. El GET de la página no canjea nada: WhatsApp, Telegram y los
 * correos abren los enlaces por su cuenta para armar la vista previa, y un canje en el GET
 * abriría sesiones del cliente en sus servidores.
 */
export async function enterWithContentLink(formData: FormData): Promise<void> {
  const token = String(formData.get('token') ?? '');

  const result = await redeemContentLink.execute({
    token,
    ip: await getRequestIp(),
    userAgent: await getRequestUserAgent(),
  });

  if (result.outcome !== 'ok') {
    redirect(`/llenar/${encodeURIComponent(token)}?estado=${result.outcome}`);
  }

  await writeSessionCookie(result.sessionToken, result.sessionExpiresAt);
  redirect(`/panel/eventos/${result.eventId}/contenido`);
}
