import type { ReactNode } from 'react';
import { ClientShell } from '@/components/dashboard/client/ClientShell';
import { listClientEvents, loadOwnClient } from '@/infrastructure/container';
import { requireClientActor } from '@/lib/auth/current-session';

/**
 * Frontera de `/panel`, y armazón común de todas sus pantallas.
 *
 * Todo lo que viva dentro de `(authenticated)/` pasa por aquí, así que una página nueva queda
 * protegida por estar en la carpeta correcta y no por acordarse de añadirle una comprobación.
 * Es la diferencia entre un permiso que se hereda y uno que se copia y pega: el segundo se
 * olvida.
 *
 * `requireClientActor()` hace dos cosas de una vez: rebota a `/acceso` si no hay sesión y
 * responde 404 si la cuenta es de plataforma. Devuelve `ClientActor`, así que a partir de
 * aquí `actor.clientId` existe para el compilador — y ninguna página de este árbol puede
 * consultar nada sin él.
 *
 * ## Por qué no hay middleware
 *
 * Un middleware es tentador —parece el sitio natural— pero corre antes de tocar la base de
 * datos y con el runtime recortado, así que no puede validar la sesión de verdad: solo mirar
 * si la cookie existe. Eso deja la comprobación real igualmente aquí, y añadir el middleware
 * solo serviría para evitar un parpadeo. Con una sola comprobación de verdad y en un solo
 * sitio, «¿está protegida esta ruta?» se responde mirando la carpeta.
 *
 * El paréntesis del nombre hace que el grupo NO aparezca en la URL: estas páginas siguen
 * siendo `/panel`, no `/panel/authenticated`.
 */
export default async function AuthenticatedClientLayout({ children }: { children: ReactNode }) {
  const actor = await requireClientActor();

  /*
   * Las dos consultas van en paralelo porque no dependen entre sí. En serie, cada carga de
   * cualquier pantalla del panel pagaría dos viajes a la base de datos uno detrás de otro
   * solo para pintar la cabecera.
   */
  const [client, events] = await Promise.all([
    loadOwnClient.execute(actor),
    listClientEvents.execute(actor),
  ]);

  return (
    <ClientShell actor={actor} clientName={client?.name ?? '—'} events={events}>
      {children}
    </ClientShell>
  );
}
