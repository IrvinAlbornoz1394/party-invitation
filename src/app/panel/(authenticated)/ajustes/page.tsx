import type { Metadata } from 'next';
import { ClientSettingsScreen } from '@/components/dashboard/client/ClientSettingsScreen';
import { loadOwnClient } from '@/infrastructure/container';
import { requireClientScope } from '@/lib/auth/current-session';

export const metadata: Metadata = {
  title: 'Ajustes · Panel',
  robots: { index: false, follow: false, nocache: true },
};

/** La cuenta del usuario y qué permite su rol. */
export default async function ClientSettingsPage() {
  const actor = await requireClientScope();
  const client = await loadOwnClient.execute(actor);

  return <ClientSettingsScreen actor={actor} clientName={client?.name ?? '—'} />;
}
