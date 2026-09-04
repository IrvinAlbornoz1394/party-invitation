import type { Metadata } from 'next';
import { ProspectsScreen } from '@/components/dashboard/admin/ProspectsScreen';
import { isClosed } from '@/domain/prospects/prospect';
import { listProspects } from '@/infrastructure/container';
import { requirePlatformCredentials } from '@/lib/auth/current-session';

export const metadata: Metadata = {
  title: 'Prospectos · Plataforma',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * La bandeja de solicitudes.
 *
 * `requirePlatformCredentials()` y no `requirePlatformAdmin()`: las funciones de lectura de
 * prospectos exigen el **hash del token**, no un id de usuario, como todos los listados globales.
 * Con un id bastaría con que un camino nuevo construyera un actor a mano para leer la lista entera
 * de datos de contacto.
 *
 * ## Dos consultas y no una
 *
 * `execute` trae la bandeja —ordenada por urgencia y sin cerradas— y `all` trae todas, de donde
 * salen las cerradas y las cifras. Podría hacerse con una sola y filtrar aquí, y sería peor: el
 * orden de urgencia depende de comparar con el ahora, y ese cálculo vive en el dominio junto a
 * `isOverdue`, que es donde alguien lo va a buscar. Las dos llamadas van en paralelo.
 *
 * Las cerradas se pasan tal como vienen —de la más reciente a la más antigua— porque ahí ya no hay
 * nada que priorizar: no esperan ninguna acción, solo se consultan.
 *
 * El `now` se fija aquí, en el servidor, y viaja a la pantalla. Si el navegador calculara el suyo,
 * el render del servidor y la hidratación podrían pintar «vencido» distinto.
 */
export default async function ProspectsPage() {
  const credentials = await requirePlatformCredentials();
  const now = new Date();

  const [inbox, all] = await Promise.all([
    listProspects.execute(credentials, now),
    listProspects.all(credentials),
  ]);

  return <ProspectsScreen prospects={inbox} closed={all.filter(isClosed)} now={now} />;
}
