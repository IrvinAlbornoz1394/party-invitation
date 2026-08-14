import { notFound } from 'next/navigation';
import { ClientDetailScreen } from '@/components/dashboard/admin/ClientDetailScreen';
import { listClients, listEventsOfClient } from '@/infrastructure/container';
import { requirePlatformCredentials } from '@/lib/auth/current-session';

/**
 * Un cliente y todos sus eventos, vistos desde la plataforma.
 *
 * ## Dos caminos distintos, a propósito
 *
 * La ficha del cliente sale de `listClients` —la vía de plataforma, que resuelve el
 * privilegio contra el hash del token—, mientras que sus eventos salen de
 * `listEventsOfClient`, que pide permiso con `app.authorize_client_context()` y solo entonces
 * fija el contexto de inquilino, todo dentro de la misma transacción.
 *
 * Podría parecer más simple usar una sola vía para las dos cosas. No lo es: los eventos son
 * datos DEL cliente y se leen con Row-Level Security puesta, así que `/admin` ve exactamente
 * lo que vería el propio cliente. La alternativa —una segunda consulta de plataforma que
 * devolviera eventos sin contexto— sería una API paralela sin aislamiento, que es justo lo
 * que `0001_security.sql` evita a conciencia.
 *
 * ## Por qué un id ajeno da 404 y no 403
 *
 * `listEventsOfClient` devuelve `null` cuando la base de datos no autoriza, y aquí eso se
 * traduce en `notFound()`. Así un id inexistente y un id que no se puede ver son
 * indistinguibles desde fuera: un 403 confirmaría que ese cliente existe.
 */
export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const credentials = await requirePlatformCredentials();

  const [clients, events] = await Promise.all([
    listClients.execute(credentials),
    listEventsOfClient.execute(credentials, id),
  ]);

  /*
   * El cliente se busca dentro de la lista que ya se pidió en lugar de con una consulta por
   * id. Ahorra un viaje, y sobre todo hace que «no existe» y «no está en lo que puedes ver»
   * acaben en el mismo sitio sin una comprobación aparte que alguien pudiera olvidar.
   */
  const client = clients.find((candidate) => candidate.id === id);

  if (!client || events === null) notFound();

  return <ClientDetailScreen client={client} events={events} />;
}
