'use client';

import type { ReactNode } from 'react';
import { submitRsvpAction } from '@/app/[slug]/[code]/actions';
import type { InvitationGuest } from '@/domain/events/invitation';
import { RsvpGatewayProvider } from './blocks/rsvp/RsvpGatewayProvider';
import { RsvpGuestProvider } from './blocks/rsvp/RsvpGuestProvider';

/**
 * Quién está mirando la invitación pública y por dónde responde.
 *
 * Conecta la pasarela de confirmación con la acción de servidor de esta invitación, atada a su
 * slug y su código, y pone a la familia del enlace al alcance del bloque. La invitación sigue
 * pintándose en el servidor: esto solo envuelve, no convierte nada en cliente.
 */
export function InvitationVisitor({
  slug,
  code,
  guest,
  children,
}: {
  readonly slug: string;
  readonly code: string;
  readonly guest: InvitationGuest | null;
  readonly children: ReactNode;
}) {
  return (
    <RsvpGatewayProvider gateway={(submission) => submitRsvpAction(slug, code, submission)}>
      <RsvpGuestProvider guest={guest}>{children}</RsvpGuestProvider>
    </RsvpGatewayProvider>
  );
}
