'use client';

import type { ReactNode } from 'react';
import type { PlatformActor } from '@/domain/auth/actor';
import { DashboardShell } from '../layout/DashboardShell';
import { ADMIN_NAVIGATION, ADMIN_ROOT_CRUMB } from '../navigation/admin-navigation';

/**
 * El armazón del panel de plataforma.
 *
 * Es casi todo configuración: elige la variante «admin», su menú y qué va en el bloque de
 * identidad. Toda la mecánica —retícula, barra lateral desplegable, migas de pan, foco— vive
 * en `DashboardShell`, que comparte con el panel del cliente.
 *
 * Dos cosas lo separan del panel de un cliente, y las dos son deliberadas:
 *
 * 1. **No hay espacio de trabajo.** Una cuenta de plataforma no pertenece a ningún inquilino,
 *    así que la barra lateral muestra a la PERSONA y su rol, no un cliente. Cuando este
 *    bloque decía «Mi Evento / Plataforma» bajo un logotipo que ya decía «Mi Evento», se
 *    leía como que el administrador tuviera un evento propio: justo la confusión que el
 *    modelo de datos eliminó y que la interfaz seguía sembrando.
 * 2. **Distintivo en la marca.** «Plataforma», en lo primero que se mira al llegar, para que
 *    no haya duda de en cuál de los dos paneles estás.
 *
 * Tampoco lleva selector de cliente ni el aviso de «estás dentro de otro cliente». No es que
 * se hayan quitado: es que el estado que describían dejó de existir cuando desapareció la
 * impersonación.
 */
export function AdminShell({
  actor,
  children,
}: {
  readonly actor: PlatformActor;
  readonly children: ReactNode;
}) {
  return (
    <DashboardShell
      variant="admin"
      navigation={ADMIN_NAVIGATION}
      rootCrumb={ADMIN_ROOT_CRUMB}
      brandBadge="Plataforma"
      identityTitle={actor.name}
      identityCaption={roleLabel(actor)}
      userName={actor.name}
    >
      {children}
    </DashboardShell>
  );
}

/**
 * `support` está declarado en el dominio pero hoy no otorga acceso a `/admin`, así que en la
 * práctica aquí solo se ve «Superadministrador». La otra rama existe para el día que soporte
 * tenga lectura, y para que entonces esto no haya que recordarlo.
 */
function roleLabel(actor: PlatformActor): string {
  return actor.platformRole === 'superadmin' ? 'Superadministrador' : 'Soporte';
}
