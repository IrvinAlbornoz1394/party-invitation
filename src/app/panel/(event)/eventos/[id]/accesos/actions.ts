'use server';

import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';
import type { ActionState } from '@/app/action-state';
import { grantEventAccess, setEventAccessStatus } from '@/infrastructure/container';
import { requireEventAccess } from '@/lib/auth/current-session';

/**
 * Dar acceso a este evento capturando solo un correo.
 *
 * Empieza por `requireEventAccess()`, y no es ceremonia heredada del layout: una Server Action es
 * un endpoint HTTP que se puede invocar directamente, sin pasar por ninguna pantalla. Un layout
 * no protege una acción — solo protege lo que se renderiza.
 *
 * `scope === null` es el visor, que no tiene ningún actor de escritura que lo represente. Se
 * corta aquí con un 404, igual que en las acciones de contenido, y no con un `if (role ===
 * 'viewer')` que algún día alguien pueda olvidar en la acción siguiente. Que además haga falta
 * alcanzar el cliente entero lo comprueba el caso de uso, y la base de datos otra vez debajo.
 */
export async function grantEventAccessAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const eventId = readText(formData, 'eventId');
  const { scope } = await requireEventAccess(eventId);

  if (scope === null) notFound();

  const result = await grantEventAccess.execute(scope, {
    eventId,
    email: readText(formData, 'email'),
    label: readText(formData, 'label') || null,
  });

  if (result.outcome === 'not-found') notFound();

  if (result.outcome === 'denied' || result.outcome === 'invalid') {
    return { status: 'error', message: result.reason };
  }

  revalidatePath(`/panel/eventos/${eventId}/accesos`);

  if (result.outcome === 'restored') {
    return { status: 'success', message: `Le devolvimos el acceso a ${result.email}.` };
  }

  /*
   * Se distingue si el aviso salió o no. Cuando no hay proveedor de correo configurado, dar por
   * hecho que llegó dejaría a alguien esperando un mensaje que nadie mandó: es mejor decirle
   * que le pase el enlace él.
   */
  return {
    status: 'success',
    message: result.notified
      ? `${result.email} ya puede entrar. Le avisamos por correo.`
      : `${result.email} ya puede entrar. No pudimos avisarle: pásale tú el enlace.`,
  };
}

/** Retirar o devolver un acceso. Las dos por la misma acción, porque son el mismo permiso. */
export async function setEventAccessStatusAction(
  eventId: string,
  membershipId: string,
  disable: boolean,
): Promise<ActionState> {
  const { scope } = await requireEventAccess(eventId);

  if (scope === null) notFound();

  const result = await setEventAccessStatus.execute(scope, {
    eventId,
    membershipId,
    // El booleano se traduce aquí y no en el cliente: la pantalla dice qué quiere hacer, no en
    // qué estado hay que dejar la fila.
    status: disable ? 'disabled' : 'active',
  });

  if (result.outcome === 'not-found') notFound();
  if (result.outcome === 'denied') return { status: 'error', message: result.reason };

  revalidatePath(`/panel/eventos/${eventId}/accesos`);

  return { status: 'success', message: disable ? 'Acceso retirado.' : 'Acceso devuelto.' };
}

/** Igual que en el resto de acciones del panel: `FormData` devuelve `File | string | null`. */
function readText(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === 'string' ? value.trim() : '';
}
