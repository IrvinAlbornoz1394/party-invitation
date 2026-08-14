'use client';

import { useContext } from 'react';
import { RsvpGatewayContext, type RsvpGateway } from './rsvp-gateway';

/**
 * Quién atiende la confirmación en este árbol.
 *
 * Sin proveedor devuelve la pasarela por defecto, que responde «no disponible». Ver
 * `rsvp-gateway.tsx` para por qué eso es preferible a fingir que se guardó.
 */
export function useRsvpGateway(): RsvpGateway {
  return useContext(RsvpGatewayContext);
}
