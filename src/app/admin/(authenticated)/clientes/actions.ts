'use server';

import { revalidatePath } from 'next/cache';
import type { ActionState } from '@/app/action-state';
import { createClient } from '@/infrastructure/container';
import { requirePlatformCredentials } from '@/lib/auth/current-session';

/**
 * Alta de un cliente.
 *
 * Empieza por `requirePlatformCredentials()`, y no es ceremonia heredada del layout: una
 * Server Action es un endpoint HTTP que se puede invocar directamente, sin pasar por
 * ninguna pantalla. Un layout no protege una acción — solo protege lo que se renderiza.
 *
 * Y esa comprobación tampoco es la última: `app.create_client` vuelve a resolver el
 * privilegio a partir del hash del token. Son tres capas y ninguna sobra, porque cada una
 * cubre un fallo distinto: el layout evita enseñar lo que no toca, esta evita ejecutarlo, y
 * la de la base de datos es la que sigue en pie aunque las dos anteriores se escriban mal.
 */
export async function createClientAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const credentials = await requirePlatformCredentials();

  const result = await createClient.execute(credentials, {
    name: readText(formData, 'name'),
    slug: readText(formData, 'slug'),
    contactEmail: readText(formData, 'contactEmail'),
    contactPhone: readText(formData, 'contactPhone'),
    ownerName: readText(formData, 'ownerName'),
  });

  switch (result.outcome) {
    case 'created':
      revalidatePath('/admin/clientes');
      revalidatePath('/admin');

      return {
        status: 'success',
        message: 'Cliente creado. Su responsable ya puede entrar con su correo.',
      };

    case 'slug-taken':
      return { status: 'error', message: 'Ese identificador ya está en uso. Escribe otro.' };

    case 'email-taken':
      return {
        status: 'error',
        message: 'Ese correo ya tiene una cuenta en la plataforma.',
      };

    case 'invalid-name':
      return { status: 'error', message: 'Escribe el nombre del cliente.' };

    case 'invalid-slug':
      return {
        status: 'error',
        message: 'El identificador solo admite letras, números y guiones.',
      };

    case 'invalid-owner':
      return {
        status: 'error',
        message: 'Revisa el correo del cliente y el nombre de la persona responsable.',
      };

    /* Lo devuelve la base de datos, no la validación de arriba: si llega hasta ahí sin correo es
       que la petición no vino de este formulario. Se contesta igual de claro. */
    case 'invalid-email':
      return { status: 'error', message: 'El cliente necesita un correo de contacto.' };

    case 'forbidden':
      /*
       * No se detalla. Los tres motivos por los que la base de datos puede negarse —sesión
       * que ya no vale, cuenta sin rol de plataforma, o algo inesperado— acaban en el mismo
       * mensaje. Distinguirlos aquí solo serviría para explicarle a quien no debería estar
       * intentándolo por qué exactamente no puede.
       */
      return { status: 'error', message: 'No se pudo crear el cliente.' };
  }
}

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === 'string' ? value.trim() : '';
}
