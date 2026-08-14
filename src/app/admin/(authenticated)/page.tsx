import { OverviewScreen } from '@/components/dashboard/admin/OverviewScreen';
import { listAllEvents, listClients } from '@/infrastructure/container';
import { requirePlatformCredentials } from '@/lib/auth/current-session';

/**
 * Resumen de la plataforma: cuántos clientes, cuántos eventos y qué viene pronto.
 *
 * Las dos consultas van en paralelo porque no dependen entre sí. Cada una es una función
 * SECURITY DEFINER distinta y las dos revalidan el privilegio contra la base de datos, así
 * que lanzarlas a la vez no relaja ninguna comprobación.
 */
export default async function AdminOverviewPage() {
  const credentials = await requirePlatformCredentials();

  const [clients, events] = await Promise.all([
    listClients.execute(credentials),
    listAllEvents.execute(credentials),
  ]);

  return <OverviewScreen clients={clients} events={events} />;
}
