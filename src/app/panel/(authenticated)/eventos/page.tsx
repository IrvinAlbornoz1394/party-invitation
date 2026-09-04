import type { Metadata } from 'next';
import { ClientEventsScreen } from '@/components/dashboard/client/ClientEventsScreen';
import { listClientEvents } from '@/infrastructure/container';
import { requireClientScope } from '@/lib/auth/current-session';

export const metadata: Metadata = {
  title: 'Eventos · Panel',
  robots: { index: false, follow: false, nocache: true },
};

/** Todos los eventos del cliente. Es el destino de «Eventos» en el menú. */
export default async function ClientEventsPage() {
  const actor = await requireClientScope();
  const events = await listClientEvents.execute(actor);

  return <ClientEventsScreen events={events} />;
}
