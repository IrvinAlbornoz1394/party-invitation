'use client';

import { useContext } from 'react';
import type { InvitationGuest } from '@/domain/events/invitation';
import { RsvpGuestContext } from './rsvp-guest';

/** La familia del enlace, o `null` si el enlace no es de ninguna. Ver `rsvp-guest.ts`. */
export function useRsvpGuest(): InvitationGuest | null {
  return useContext(RsvpGuestContext);
}
