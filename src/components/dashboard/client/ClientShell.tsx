'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type { ClientActor, UserRole } from '@/domain/auth/actor';
import type { EventSummary } from '@/domain/events/event-repository';
import { DashboardShell } from '../layout/DashboardShell';
import { buildClientNavigation, CLIENT_ROOT_CRUMB } from '../navigation/client-navigation';
import { EventPicker } from './EventPicker';

/**
 * El armazón del panel de un cliente.
 *
 * Comparte toda la mecánica con `/admin` a través de `DashboardShell`; lo propio de aquí son
 * tres cosas:
 *
 * 1. **La paleta.** Berenjena, el de las invitaciones: es su producto y se ve como su
 *    producto, no como la herramienta interna con la que se administra.
 * 2. **El bloque de identidad es un espacio de trabajo.** Lleva el nombre del cliente, porque
 *    quien entra aquí pertenece a un inquilino y todo lo que ve es de ese inquilino. Es justo
 *    lo contrario que en `/admin`, donde no hay ninguno.
 * 3. **El selector de evento** en la cabecera.
 *
 * No hay distintivo en la marca: para un cliente solo existe un panel, y etiquetarlo sería
 * nombrar una distinción que no conoce.
 */
export function ClientShell({
  actor,
  clientName,
  events,
  children,
}: {
  readonly actor: ClientActor;
  readonly clientName: string;
  readonly events: readonly EventSummary[];
  readonly children: ReactNode;
}) {
  const pathname = usePathname();

  /*
   * El evento activo se saca de la ruta y no llega como prop desde el layout. No es una
   * preferencia de estilo: un layout de Next solo recibe los parámetros de SU segmento, así
   * que `/panel/(authenticated)/layout.tsx` no puede ver el `[id]` de una ruta que está por
   * debajo. Leerlo del pathname es la única forma de que el armazón sepa dónde está sin
   * duplicar el dato en cada página que hay bajo él.
   */
  const activeEventId = /^\/panel\/eventos\/([^/]+)/.exec(pathname)?.[1] ?? null;

  return (
    <DashboardShell
      variant="client"
      navigation={buildClientNavigation(events.length)}
      rootCrumb={CLIENT_ROOT_CRUMB}
      identityTitle={clientName}
      identityCaption={ROLE_LABEL[actor.role]}
      userName={actor.name}
      headerExtra={<EventPicker events={events} activeEventId={activeEventId} />}
    >
      {children}
    </DashboardShell>
  );
}

const ROLE_LABEL: Record<UserRole, string> = {
  owner: 'Dueño de la cuenta',
  admin: 'Administrador',
  staff: 'Colaborador',
};
