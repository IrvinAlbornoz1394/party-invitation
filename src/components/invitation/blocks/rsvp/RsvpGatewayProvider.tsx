'use client';

import type { ReactNode } from 'react';
import { RsvpGatewayContext, type RsvpGateway } from './rsvp-gateway';

/**
 * Conecta el bloque de confirmación con quien la atiende.
 *
 * Sin proveedor, los componentes siguen funcionando y responden «no disponible». Es
 * deliberado: un bloque que reventara sin contexto obligaría a envolver la invitación entera
 * solo para renderizar una portada.
 */
export function RsvpGatewayProvider({
  gateway,
  children,
}: {
  readonly gateway: RsvpGateway;
  readonly children: ReactNode;
}) {
  return <RsvpGatewayContext.Provider value={gateway}>{children}</RsvpGatewayContext.Provider>;
}
