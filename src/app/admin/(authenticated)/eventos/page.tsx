import type { Metadata } from 'next';
import { EventsScreen } from '@/components/dashboard/admin/EventsScreen';
import { listAllEvents } from '@/infrastructure/container';
import { requirePlatformCredentials } from '@/lib/auth/current-session';

export const metadata: Metadata = {
  title: 'Eventos · Plataforma',
  robots: { index: false, follow: false, nocache: true },
};

/** Todos los eventos de todos los clientes. */
export default async function AdminEventsPage() {
  const credentials = await requirePlatformCredentials();
  const events = await listAllEvents.execute(credentials);

  return <EventsScreen events={events} />;
}
