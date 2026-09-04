import { notFound } from 'next/navigation';
import { tenantScopeOf } from '@/domain/auth/actor';
import { ClientEventDetailScreen } from '@/components/dashboard/client/ClientEventDetailScreen';
import { listClientEvents } from '@/infrastructure/container';
import { requireEventAccess } from '@/lib/auth/current-session';

/**
 * Un evento, para quien lo alcance.
 *
 * La autorización la resuelve `requireEventAccess()` y sale de las **membresías**, no de la
 * lista de eventos del cliente. Antes se buscaba el evento dentro de esa lista, y ese truco
 * tenía la propiedad de hacer indistinguible «no existe» de «no es tuyo». Ya no sirve, y no por
 * un defecto: el caso nuevo es alguien que alcanza un evento **sin** alcanzar el cliente que lo
 * contiene —los novios de una boda que produce un organizador—, así que preguntar por el cliente
 * respondería que no.
 *
 * La propiedad se conserva igual: `requireEventAccess()` responde 404 tanto para un evento que
 * no existe como para uno que no se alcanza, porque el id va en la URL y un 403 confirmaría cuál
 * de las dos cosas es.
 *
 * ## El alcance es el que estrecha, no un filtro de esta página
 *
 * `tenantScopeOf(membership)` produce el alcance de lectura. Con una membresía de evento, RLS
 * devuelve **una sola fila** y `find` la encuentra; con una de cliente devuelve todos sus
 * eventos y `find` elige. Es la misma consulta en los dos casos, y el filtrado real lo hace la
 * política de la base de datos — que es donde tiene que estar.
 *
 * `find` se queda porque el alcance de cliente sí trae varios, y porque es la comprobación que
 * convierte «este id no es de ninguno de mis eventos» en 404 en lugar de en una pantalla vacía.
 */
export default async function ClientEventDetailPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { membership } = await requireEventAccess(id);

  const events = await listClientEvents.execute(tenantScopeOf(membership));
  const event = events.find((candidate) => candidate.id === id);

  if (!event) notFound();

  /*
   * `eventId === null` en la membresía significa alcance CLIENTE, es decir que esta persona
   * alcanza más eventos que este. Es lo que decide si la ficha ofrece la vuelta a la lista.
   */
  return (
    <ClientEventDetailScreen event={event} canReachClient={membership.eventId === null} />
  );
}
