'use server';

import { revalidatePath } from 'next/cache';
import {
  findEventForPlatform,
  manageContentLink,
  reopenContentForClient,
} from '@/infrastructure/container';
import { requirePlatformCredentials } from '@/lib/auth/current-session';

/**
 * El enlace del cliente y la reapertura, desde cualquier pantalla del admin.
 *
 * Viven aparte de las acciones de la ficha de contenido porque se llaman desde tres sitios —la
 * ficha del cliente, la lista de eventos y la ficha de contenido— y no pertenecen a ninguno. El
 * `clientId` se resuelve en el servidor a partir del evento, como en el resto del admin: del
 * navegador solo llega el identificador del evento.
 */

/** Lo que pinta el modal. Fechas como ISO: cruzan la frontera de la acción como texto. */
export type ContentLinkView =
  | { readonly status: 'active'; readonly url: string; readonly expiresAt: string; readonly openedAt: string | null }
  | { readonly status: 'none' }
  | { readonly status: 'error'; readonly message: string };

export async function loadContentLinkAction(eventId: string): Promise<ContentLinkView> {
  const credentials = await requirePlatformCredentials();
  const event = await findEventForPlatform.execute(credentials, eventId);

  if (event === null) return { status: 'error', message: 'Este evento ya no está disponible.' };

  return toView(await manageContentLink.current(credentials, event.clientId, eventId));
}

export async function generateContentLinkAction(eventId: string): Promise<ContentLinkView> {
  const credentials = await requirePlatformCredentials();
  const event = await findEventForPlatform.execute(credentials, eventId);

  if (event === null) return { status: 'error', message: 'Este evento ya no está disponible.' };

  const result = await manageContentLink.generate(credentials, event.clientId, eventId);

  revalidatePath(`/admin/clientes/${event.clientId}`);
  revalidatePath('/admin/eventos');
  revalidatePath(`/admin/eventos/${eventId}/contenido`);

  return result.outcome === 'none'
    ? { status: 'error', message: 'No se pudo generar el enlace.' }
    : toView(result);
}

/** Devuelve la edición al cliente: el evento vuelve a borrador y su enlace vuelve a abrir. */
export async function reopenForClientAction(eventId: string): Promise<{ readonly ok: boolean; readonly message: string }> {
  const credentials = await requirePlatformCredentials();
  const event = await findEventForPlatform.execute(credentials, eventId);

  if (event === null) return { ok: false, message: 'Este evento ya no está disponible.' };

  const result = await reopenContentForClient.execute(credentials, event.clientId, eventId);

  revalidatePath(`/admin/clientes/${event.clientId}`);
  revalidatePath('/admin/eventos');
  revalidatePath(`/admin/eventos/${eventId}/contenido`);

  return result === 'reopened'
    ? {
        ok: true,
        message:
          'Listo: el cliente ya puede editar de nuevo. Si su enlace venció, genera uno nuevo y mándaselo.',
      }
    : { ok: false, message: 'No se pudo habilitar la edición.' };
}

function toView(
  state: Awaited<ReturnType<typeof manageContentLink.current>>,
): ContentLinkView {
  switch (state.outcome) {
    case 'active':
      return {
        status: 'active',
        url: state.url,
        expiresAt: state.expiresAt.toISOString(),
        openedAt: state.openedAt?.toISOString() ?? null,
      };
    case 'none':
      return { status: 'none' };
    case 'forbidden':
      return { status: 'error', message: 'No tienes permiso para esto.' };
  }
}
