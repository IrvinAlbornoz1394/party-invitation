'use server';

import { redirect } from 'next/navigation';
import { signOut as signOutUseCase } from '@/infrastructure/container';
import { clearSessionCookie, readSessionCookie } from '@/lib/auth/session-cookie';

/**
 * Cerrar sesión, para los dos paneles.
 *
 * Vive en la raíz de `app/` y no dentro de `/admin` ni de `/panel` porque es lo único que
 * las dos cabeceras comparten. Duplicarla daría dos copias de un procedimiento cuyo orden
 * importa, y la segunda copia es la que acaba escrita al revés.
 *
 * El orden es deliberado: primero se revoca en la base de datos, después se borra la
 * cookie. Si fallara la revocación, la cookie se borra igual y el usuario sale de la
 * interfaz —pero el token seguiría siendo válido para quien lo hubiera copiado. Por eso
 * primero va la revocación, que es la que de verdad corta el acceso; borrar la cookie es
 * solo la parte visible.
 */
export async function signOutAction(): Promise<void> {
  const token = await readSessionCookie();

  await signOutUseCase.execute(token);
  await clearSessionCookie();

  redirect('/acceso');
}
