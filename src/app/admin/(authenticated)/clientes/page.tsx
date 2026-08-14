import type { Metadata } from 'next';
import { ClientsScreen } from '@/components/dashboard/admin/ClientsScreen';
import { listClients } from '@/infrastructure/container';
import { requirePlatformCredentials } from '@/lib/auth/current-session';

export const metadata: Metadata = {
  title: 'Clientes · Plataforma',
  robots: { index: false, follow: false, nocache: true },
};

/** Alta y listado de los clientes de la plataforma. */
export default async function AdminClientsPage() {
  const credentials = await requirePlatformCredentials();
  const clients = await listClients.execute(credentials);

  return <ClientsScreen clients={clients} />;
}
