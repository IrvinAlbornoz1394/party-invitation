import type { Metadata } from 'next';
import { SettingsScreen } from '@/components/dashboard/admin/SettingsScreen';
import { requirePlatformAdmin } from '@/lib/auth/current-session';

export const metadata: Metadata = {
  title: 'Ajustes · Plataforma',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * La cuenta de plataforma y el alcance de su acceso.
 *
 * Es la única pantalla de `/admin` que no consulta nada: todo lo que enseña sale del actor
 * que ya resolvió la sesión, y `cache()` de React hace que repetir `requirePlatformAdmin()`
 * aquí no cueste otro viaje a la base de datos. Se repite igualmente para que la página no
 * dependa de que alguien recuerde que su layout la protege.
 */
export default async function AdminSettingsPage() {
  const actor = await requirePlatformAdmin();

  return <SettingsScreen actor={actor} />;
}
