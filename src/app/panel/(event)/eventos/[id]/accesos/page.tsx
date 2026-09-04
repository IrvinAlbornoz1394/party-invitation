import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EventAccessScreen } from '@/components/dashboard/client/EventAccessScreen';
import { listEventAccess, listTeam } from '@/infrastructure/container';
import { requireEventAccess } from '@/lib/auth/current-session';

export const metadata: Metadata = {
  title: 'Accesos · Panel',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Quién más puede ver este evento.
 *
 * Dos listas que no se pueden mezclar, y por eso la pantalla tiene dos pestañas:
 *
 * - **El equipo del cliente** llega a este evento por una membresía de alcance cliente, así que
 *   alcanza también a todos los demás. Se enseña en lectura: quitar a alguien de aquí no
 *   quitaría nada, y un botón que dice que hizo algo que no hizo es peor que no tenerlo.
 * - **Los invitados** tienen una membresía de este evento y de ninguno más. Se dan de alta con
 *   un correo y se retiran desde aquí, porque este es el único sitio donde ese acceso existe.
 *
 * ## Hace falta alcanzar el cliente, no solo el evento
 *
 * `scope === null` deja fuera al visor —no hay actor de escritura que lo represente— y
 * `scope.eventId !== null` deja fuera a quien solo alcanza este evento. Lo segundo no es una
 * regla de producto que se pueda ablandar: la política RLS de `users` cierra la tabla entera
 * cuando hay contexto de evento, así que la lista saldría sin un solo correo — la única columna
 * por la que esta pantalla existe. Mejor 404 que una tabla mutilada.
 *
 * Los dos casos responden el mismo 404 que un evento inexistente. El menú tampoco enseña esta
 * sección a un visor, pero eso es una sugerencia de navegación y esto es el permiso.
 */
export default async function EventAccessPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { scope } = await requireEventAccess(id, `/panel/eventos/${id}/accesos`);

  if (scope === null || scope.eventId !== null) notFound();

  /* No dependen entre sí: en serie, cada carga de esta pantalla pagaría dos viajes seguidos. */
  const [access, team] = await Promise.all([
    listEventAccess.execute(scope, id),
    listTeam.execute(scope),
  ]);

  // Null significa que el evento no es de este cliente: mismo 404 que si no existiera.
  if (access === null) notFound();

  return <EventAccessScreen actor={scope} eventId={id} access={access} team={team} />;
}
