import type { Metadata } from 'next';
import { TemplatesScreen } from '@/components/dashboard/admin/TemplatesScreen';
import { listEventTypes, listTemplates } from '@/infrastructure/container';
import { requirePlatformCredentials } from '@/lib/auth/current-session';

export const metadata: Metadata = {
  title: 'Plantillas · Plataforma',
  robots: { index: false, follow: false, nocache: true },
};

/** La biblioteca de plantillas y los tipos de evento que cubren. */
export default async function AdminTemplatesPage() {
  const credentials = await requirePlatformCredentials();

  const [templates, eventTypes] = await Promise.all([
    listTemplates.execute(credentials),
    listEventTypes.execute(credentials),
  ]);

  return <TemplatesScreen templates={templates} eventTypes={eventTypes} />;
}
