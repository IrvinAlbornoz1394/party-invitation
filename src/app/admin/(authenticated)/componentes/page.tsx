import type { Metadata } from 'next';
import { RegistryScreen } from '@/components/dashboard/admin/RegistryScreen';
import { listComponentRegistry, listThemes, loadPlanCatalog } from '@/infrastructure/container';
import { requirePlatformCredentials } from '@/lib/auth/current-session';

export const metadata: Metadata = {
  title: 'Componentes · Plataforma',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * El Component Registry: bloques y variantes.
 *
 * Los planes se piden además del registro porque cada variante declara un `min_plan_rank`, y
 * un rango suelto no significa nada sin la escala contra la que se compara: la pantalla lo
 * traduce a «desde el plan Premium».
 *
 * Y los temas, porque una variante no se ve «en abstracto»: se ve con un tema puesto. La
 * previsualización cruza las dos listas —variante y tema— con los mismos datos que usará la
 * invitación, en lugar de una paleta de ejemplo escrita en el panel que se quedaría vieja.
 */
export default async function AdminRegistryPage() {
  const credentials = await requirePlatformCredentials();

  const [blocks, catalog, themes] = await Promise.all([
    listComponentRegistry.execute(credentials),
    loadPlanCatalog.execute(credentials),
    listThemes.execute(credentials),
  ]);

  return <RegistryScreen blocks={blocks} plans={catalog.plans} themes={themes} />;
}
