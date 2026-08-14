'use client';

import type { ReactNode } from 'react';
import { RsvpGatewayProvider } from '../blocks/rsvp/RsvpGatewayProvider';
import type { RsvpGateway } from '../blocks/rsvp/rsvp-gateway';

/**
 * Una pasarela de confirmación simulada, solo para la previsualización del panel.
 *
 * El registro de confirmaciones todavía no existe, así que sin esto el botón del camino
 * `managed` respondería «no disponible» y no habría forma de juzgar en el panel cómo se ve
 * confirmando ni cómo queda después. Aquí se finge la espera —setecientos milisegundos, que es
 * lo que tarda una petición real en una conexión normal— y se responde que sí.
 *
 * **Fingir está bien exactamente aquí y en ningún otro sitio.** En la invitación real, decirle a
 * alguien que su asistencia quedó confirmada sin haberla guardado es el peor fallo posible de
 * este bloque; en una ventana del panel que dice «Vista previa del componente», es la única
 * manera de ver el estado final. Por eso este archivo vive en `demo/` y no puede colarse en la
 * invitación: quien la renderice tendrá que conectar la pasarela de verdad.
 */
const demoGateway: RsvpGateway = async () => {
  await new Promise((resolve) => setTimeout(resolve, 700));

  return { status: 'ok' };
};

export function RsvpDemoGateway({ children }: { readonly children: ReactNode }) {
  return <RsvpGatewayProvider gateway={demoGateway}>{children}</RsvpGatewayProvider>;
}
