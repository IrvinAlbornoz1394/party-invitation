'use client';

import type { ReactNode } from 'react';
import type { InvitationGuest } from '@/domain/events/invitation';
import { RsvpGuestContext } from './rsvp-guest';

/** Pone a la familia del enlace al alcance del bloque de confirmación. */
export function RsvpGuestProvider({
  guest,
  children,
}: {
  readonly guest: InvitationGuest | null;
  readonly children: ReactNode;
}) {
  return <RsvpGuestContext.Provider value={guest}>{children}</RsvpGuestContext.Provider>;
}
