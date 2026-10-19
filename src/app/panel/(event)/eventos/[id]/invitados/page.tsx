import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { tenantScopeOf } from '@/domain/auth/actor';
import { GuestsScreen } from '@/components/dashboard/client/GuestsScreen';
import { listGuests } from '@/infrastructure/container';
import { requireEventAccess } from '@/lib/auth/current-session';

export const metadata: Metadata = {
  title: 'Invitados · Panel',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * La lista de invitados por familia, cada una con su enlace.
 *
 * La ve todo el que alcanza el evento —un visor también, en lectura— y la editan los demás.
 * Sin `gestion_invitados` en el plan responde 404, igual que un evento que no existe: el menú
 * ya no la ofrece, y esto es el permiso.
 */
export default async function GuestsPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { membership, scope } = await requireEventAccess(id, `/panel/eventos/${id}/invitados`);

  const list = await listGuests.execute(tenantScopeOf(membership), id);

  if (list === null) notFound();

  return <GuestsScreen list={list} canEdit={scope !== null} />;
}
