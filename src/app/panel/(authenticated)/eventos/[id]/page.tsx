import { notFound } from 'next/navigation';
import { ClientEventDetailScreen } from '@/components/dashboard/client/ClientEventDetailScreen';
import { listClientEvents } from '@/infrastructure/container';
import { requireClientActor } from '@/lib/auth/current-session';

/**
 * Un evento del cliente.
 *
 * El evento se busca dentro de la lista del propio cliente en lugar de consultarlo por id
 * suelto. Es lo que hace que un id de otro cliente sea indistinguible de uno inexistente: los
 * dos acaban en 404 sin que haga falta una comprobación aparte que alguien pudiera olvidar.
 * Row-Level Security ya lo garantizaría por debajo; esto lo hace además evidente al leer el
 * código.
 */
export default async function ClientEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const actor = await requireClientActor();
  const events = await listClientEvents.execute(actor);
  const event = events.find((candidate) => candidate.id === id);

  if (!event) notFound();

  return <ClientEventDetailScreen event={event} />;
}
