'use server';

import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';
import type { ActionState } from '@/app/action-state';
import { deleteGuestGroup, saveGuestGroup } from '@/infrastructure/container';
import { requireEventAccess } from '@/lib/auth/current-session';

/**
 * Dar de alta o editar una familia.
 *
 * Empieza por `requireEventAccess()` aunque el layout ya lo haga: una Server Action es un
 * endpoint que se puede invocar sin pasar por ninguna pantalla. `scope === null` es el visor,
 * que puede ver la lista y no tocarla. El plan lo comprueba el caso de uso.
 */
export async function saveGuestGroupAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const eventId = readText(formData, 'eventId');
  const { scope } = await requireEventAccess(eventId);

  if (scope === null) notFound();

  const groupId = readText(formData, 'groupId') || null;

  const result = await saveGuestGroup.execute(scope, {
    eventId,
    groupId,
    name: readText(formData, 'name'),
    seats: readText(formData, 'seats'),
    phone: readText(formData, 'phone'),
    notes: readText(formData, 'notes'),
  });

  if (result.outcome === 'not-found') notFound();
  if (result.outcome === 'invalid') return { status: 'error', message: result.reason };

  revalidateGuests(eventId);

  return {
    status: 'success',
    message: groupId ? 'Guardamos los cambios.' : 'Listo. Ya puedes mandarle su enlace.',
  };
}

export async function deleteGuestGroupAction(
  eventId: string,
  groupId: string,
): Promise<ActionState> {
  const { scope } = await requireEventAccess(eventId);

  if (scope === null) notFound();

  const deleted = await deleteGuestGroup.execute(scope, eventId, groupId);

  if (!deleted) notFound();

  revalidateGuests(eventId);

  return { status: 'success', message: 'Quitamos la invitación de la lista.' };
}

/** La lista y todo lo que cuenta con ella: el resumen de confirmaciones y la ficha del evento. */
function revalidateGuests(eventId: string): void {
  revalidatePath(`/panel/eventos/${eventId}/invitados`);
  revalidatePath(`/panel/eventos/${eventId}/confirmaciones`);
  revalidatePath(`/panel/eventos/${eventId}`);
}

/** Igual que en el resto de acciones del panel: `FormData` devuelve `File | string | null`. */
function readText(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === 'string' ? value.trim() : '';
}
