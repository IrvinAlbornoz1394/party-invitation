'use server';

import { revalidatePath } from 'next/cache';
import { isUserRole } from '@/domain/auth/actor';
import { changeUserRole, inviteUser, setUserStatus } from '@/infrastructure/container';
import { requireClientScope } from '@/lib/auth/current-session';
import type { ActionState } from '@/app/action-state';

/**
 * Acciones de administración de cuentas.
 *
 * Todas empiezan por `requireClientScope()`, y no es ceremonia: una Server Action es un
 * endpoint HTTP público con un nombre difícil de adivinar, no una función privada. Que solo
 * se llame desde un botón que la interfaz muestra a los administradores no impide que
 * alguien la invoque a mano. La autorización vive en el caso de uso, y el aislamiento entre
 * clientes lo sigue imponiendo Row-Level Security por debajo.
 *
 * Devuelve `ClientActor`, así que estas acciones no pueden ejecutarse con una cuenta de
 * plataforma ni por descuido: el equipo de un cliente se gestiona desde el panel de ese
 * cliente.
 *
 * Ninguna confía en los identificadores que llegan del formulario más allá de su forma: el
 * caso de uso carga el equipo real y comprueba que la persona esté ahí, así que un `userId`
 * de otro cliente acaba en `not-found` y no en una modificación ajena.
 */

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === 'string' ? value.trim() : '';
}

export async function inviteUserAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requireClientScope();

  const role = readText(formData, 'role');
  if (!isUserRole(role)) {
    return { status: 'error', message: 'Elige un rol válido.' };
  }

  const result = await inviteUser.execute(actor, {
    email: readText(formData, 'email'),
    name: readText(formData, 'name'),
    phone: readText(formData, 'phone') || null,
    role,
  });

  if (result.outcome !== 'invited') {
    return { status: 'error', message: result.reason };
  }

  revalidatePath('/panel/equipo');

  return {
    status: 'success',
    message: `${result.name} ya puede entrar. Le avisamos a ${result.email}.`,
  };
}

export async function changeRoleAction(userId: string, role: string): Promise<ActionState> {
  const actor = await requireClientScope();

  if (!isUserRole(role)) {
    return { status: 'error', message: 'Ese rol no existe.' };
  }

  const result = await changeUserRole.execute(actor, { userId, role });

  if (result.outcome === 'denied') return { status: 'error', message: result.reason };
  if (result.outcome === 'not-found') {
    return { status: 'error', message: 'Esa persona ya no está en tu equipo.' };
  }

  revalidatePath('/panel/equipo');

  return { status: 'success', message: 'Rol actualizado.' };
}

export async function setStatusAction(userId: string, disable: boolean): Promise<ActionState> {
  const actor = await requireClientScope();

  const result = await setUserStatus.execute(actor, {
    userId,
    /*
     * `=== true` y no un simple truthy. Una Server Action es un endpoint HTTP: sus argumentos
     * llegan deserializados de la petición y el tipo de TypeScript no los valida en runtime.
     * Con `disable ? ...`, cualquier valor no vacío —una cadena, un número— acabaría
     * desactivando la cuenta, incluso si quien llamaba pretendía reactivarla.
     *
     * No es un agujero de seguridad, porque el caso de uso comprueba los permisos igual en
     * los dos sentidos; es que la operación que se ejecuta debe ser la que se pidió.
     */
    status: disable === true ? 'disabled' : 'active',
  });

  if (result.outcome === 'denied') return { status: 'error', message: result.reason };
  if (result.outcome === 'not-found') {
    return { status: 'error', message: 'Esa persona ya no está en tu equipo.' };
  }

  revalidatePath('/panel/equipo');

  return {
    status: 'success',
    // Se dice explícitamente que se cerró la sesión, porque es la parte que el
    // administrador necesita saber: desactivar sin cortar el acceso no serviría de nada, y
    // si no se cuenta, nadie sabe si la persona sigue dentro.
    message: disable ? 'Cuenta desactivada y sesiones cerradas.' : 'Cuenta reactivada.',
  };
}
