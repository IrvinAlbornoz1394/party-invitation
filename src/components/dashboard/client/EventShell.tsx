'use client';

import type { ReactNode } from 'react';
import { type MembershipRole, displayNameOf } from '@/domain/auth/actor';
import { DashboardShell } from '../layout/DashboardShell';
import { buildEventNavigation, EVENT_ROOT_CRUMB } from '../navigation/event-navigation';

/**
 * El armazón de una pantalla de evento.
 *
 * Existe aparte de `ClientShell` por una diferencia que no se puede parametrizar sin volver los
 * dos ilegibles: aquí el espacio de trabajo es **un evento**, no un cliente. El bloque de
 * identidad lleva el título del evento y no el nombre del cliente, y no hay selector de evento
 * en la cabecera porque el evento no es algo que se cambie desde dentro — se elige en `/panel` y
 * se cambia volviendo allí.
 *
 * Esa asimetría es la del modelo: quien alcanza un solo evento no tiene ningún otro entre los
 * que cambiar, y ofrecerle un selector sería enseñarle una lista de uno.
 *
 * ## El pie de la identidad dice con qué papel entras
 *
 * Para un visor eso es lo único que explica por qué no puede tocar nada, y por eso se pinta su
 * etiqueta —«Los novios»— cuando el cliente le puso una: es como lo llama quien le dio el
 * acceso, y reconocerse ahí vale más que leer «Solo lectura» a secas.
 */
export function EventShell({
  eventId,
  eventTitle,
  clientName,
  role,
  label,
  identity,
  planFeatures,
  canReachClient,
  children,
}: {
  readonly eventId: string;
  readonly eventTitle: string;
  readonly clientName: string;
  readonly role: MembershipRole;
  readonly label: string | null;
  readonly identity: { readonly name: string | null; readonly email: string };
  /**
   * Llega como array y no como `Set` porque este componente cruza la frontera del servidor al
   * cliente, y un `Set` no sobrevive a la serialización de React: llegaría como `{}` y el menú
   * saldría vacío sin ningún error. Se reconstruye aquí.
   */
  readonly planFeatures: readonly string[];
  readonly canReachClient: boolean;
  readonly children: ReactNode;
}) {
  return (
    <DashboardShell
      variant="client"
      navigation={buildEventNavigation({
        eventId,
        role,
        planFeatures: new Set(planFeatures),
        canReachClient,
      })}
      rootCrumb={EVENT_ROOT_CRUMB}
      identityTitle={eventTitle}
      /* Quien alcanza el cliente entero ya sabe de quién es el evento: lo que le informa es su
         rol. Al visor le informa lo contrario — de quién es esto y con qué papel entra. */
      identityCaption={canReachClient ? ROLE_LABEL[role] : (label ?? clientName)}
      userName={displayNameOf(identity)}
    >
      {children}
    </DashboardShell>
  );
}

const ROLE_LABEL: Record<MembershipRole, string> = {
  owner: 'Dueño de la cuenta',
  admin: 'Administrador',
  staff: 'Colaborador',
  viewer: 'Solo lectura',
};
