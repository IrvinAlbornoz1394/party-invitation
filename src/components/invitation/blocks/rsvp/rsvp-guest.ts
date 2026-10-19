'use client';

import { createContext } from 'react';
import type { InvitationGuest } from '@/domain/events/invitation';

/**
 * La familia que está mirando la invitación, cuando el enlace es el suyo.
 *
 * Es contexto de quien visita y no contenido del bloque: cambia con cada enlace. Sin proveedor
 * vale `null` —el enlace general, las demos y la vista previa del panel— y el bloque pregunta lo
 * mínimo: confirmar o no, sin cupo ni saludo.
 *
 * El contexto vive solo en este archivo por lo mismo que `rsvp-gateway.ts`: mezclarlo con
 * componentes rompe la recarga en caliente de Next.
 */
export const RsvpGuestContext = createContext<InvitationGuest | null>(null);
