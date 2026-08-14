import type { Metadata } from 'next';
import { TeamScreen } from '@/components/dashboard/client/TeamScreen';
import { listTeam } from '@/infrastructure/container';
import { requireClientActor } from '@/lib/auth/current-session';

export const metadata: Metadata = {
  title: 'Equipo · Panel',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Quién puede entrar al panel del cliente activo.
 *
 * `requireClientActor()` se repite aquí aunque el layout ya lo haya llamado: `cache()` de
 * React hace que no cueste otro viaje a la base de datos, y así la página no depende de que
 * el layout se lo pase por props ni de que alguien recuerde que el layout ya lo comprobó.
 *
 * Cualquier rol puede VER el equipo —saber con quién trabajas no es privilegio—, pero solo
 * `admin` y `owner` pueden modificarlo. Esa distinción la aplican los casos de uso; la
 * interfaz la refleja escondiendo lo que no se puede hacer.
 */
export default async function ClientTeamPage() {
  const actor = await requireClientActor();
  const team = await listTeam.execute(actor);

  return <TeamScreen actor={actor} team={team} />;
}
