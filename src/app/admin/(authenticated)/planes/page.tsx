import type { Metadata } from 'next';
import { PlansScreen } from '@/components/dashboard/admin/PlansScreen';
import { loadPlanCatalog } from '@/infrastructure/container';
import { requirePlatformCredentials } from '@/lib/auth/current-session';

export const metadata: Metadata = {
  title: 'Planes · Plataforma',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Los planes y la rejilla de qué incluye cada uno.
 *
 * Planes y funcionalidades llegan juntos, en un solo caso de uso, porque la pantalla los
 * cruza: pedirlos por separado permitiría pintar la rejilla con un catálogo de
 * funcionalidades más nuevo que el de planes, y aparecerían columnas sin ninguna marca
 * indistinguibles de una funcionalidad que de verdad no incluye nadie.
 */
export default async function AdminPlansPage() {
  const credentials = await requirePlatformCredentials();
  const catalog = await loadPlanCatalog.execute(credentials);

  return <PlansScreen catalog={catalog} />;
}
