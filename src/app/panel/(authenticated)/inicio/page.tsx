import { ClientOverviewScreen } from '@/components/dashboard/client/ClientOverviewScreen';
import { listClientEvents } from '@/infrastructure/container';
import { requireClientScope } from '@/lib/auth/current-session';

/**
 * Inicio del panel de un cliente.
 *
 * `requireClientScope()` se repite aunque el layout ya lo haya llamado, y no cuesta una
 * consulta más: `cache()` de React deduplica dentro de la misma petición. Lo que compra es
 * que esta página no dependa de que alguien recuerde que su layout la protege.
 */
export default async function ClientOverviewPage() {
  const actor = await requireClientScope();
  const events = await listClientEvents.execute(actor);

  return <ClientOverviewScreen events={events} />;
}
