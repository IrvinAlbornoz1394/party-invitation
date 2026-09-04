import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { canManageUsers } from '@/domain/auth/actor';
import { TeamScreen } from '@/components/dashboard/client/TeamScreen';
import { listTeam } from '@/infrastructure/container';
import { requireClientScope } from '@/lib/auth/current-session';

export const metadata: Metadata = {
  title: 'Equipo · Panel',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Quién puede entrar al panel del cliente activo.
 *
 * `requireClientScope()` se repite aquí aunque el layout ya lo haya llamado: `cache()` de
 * React hace que no cueste otro viaje a la base de datos, y así la página no depende de que
 * el layout se lo pase por props ni de que alguien recuerde que el layout ya lo comprobó.
 *
 * La pantalla entera es del dueño, y ese es el cambio de 2026-09-04. Antes la veían todos los
 * roles —«saber con quién trabajas no es privilegio»— y solo se escondían los botones. Con la
 * gestión de personas reducida a una sola persona, enseñar una lista completa de nombres y
 * correos sin poder tocar nada dejó de tener a quién servir: un colaborador trabaja en los
 * eventos, y a quien necesita compartir uno le corresponde la pantalla de Accesos del evento.
 *
 * El 404 es lo mismo que responde cualquier ruta que no se alcanza, y es lo que el menú da por
 * hecho al esconder la opción. Sin él, esconderla sería decoración: la URL se puede teclear.
 */
export default async function ClientTeamPage() {
  const actor = await requireClientScope();
  if (!canManageUsers(actor)) notFound();

  const team = await listTeam.execute(actor);

  return <TeamScreen actor={actor} team={team} />;
}
