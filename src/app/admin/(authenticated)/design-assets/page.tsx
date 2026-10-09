import type { Metadata } from 'next';
import { DesignAssetsScreen } from '@/components/dashboard/admin/DesignAssetsScreen';
import { listDesignAssets } from '@/lib/design-assets';

export const metadata: Metadata = {
  title: 'Recursos gráficos · Plataforma',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * La biblioteca de recursos gráficos (`public/assets/invitations/`).
 *
 * No está en el menú a propósito: es una herramienta interna para quien maqueta variantes, y se
 * abre por URL. La protección la da la carpeta `(authenticated)`, como al resto de `/admin`.
 *
 * La ficha sale de un JSON del repositorio y no de la base de datos, así que no hace falta
 * pedir credenciales para leerla: el layout ya las exigió para entrar.
 */
export default function AdminDesignAssetsPage() {
  return <DesignAssetsScreen assets={listDesignAssets()} />;
}
