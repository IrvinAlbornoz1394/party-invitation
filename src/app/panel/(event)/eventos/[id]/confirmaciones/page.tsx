import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { tenantScopeOf } from '@/domain/auth/actor';
import { RsvpScreen } from '@/components/dashboard/client/RsvpScreen';
import { listGuests } from '@/infrastructure/container';
import { requireEventAccess } from '@/lib/auth/current-session';

export const metadata: Metadata = {
  title: 'Confirmaciones · Panel',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Quién viene, cuántos son y quién falta por responder.
 *
 * Solo lectura, y la ve todo el que alcanza el evento. Sin `panel_confirmaciones` en el plan
 * responde 404: en esos planes las respuestas llegan al WhatsApp del organizador.
 */
export default async function RsvpPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { membership } = await requireEventAccess(id, `/panel/eventos/${id}/confirmaciones`);

  const list = await listGuests.execute(tenantScopeOf(membership), id, 'rsvp');

  if (list === null) notFound();

  return <RsvpScreen list={list} />;
}
