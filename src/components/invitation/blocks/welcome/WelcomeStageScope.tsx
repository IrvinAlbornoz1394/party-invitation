'use client';

import type { ReactNode } from 'react';
import { WelcomeStageContext, type WelcomeStage } from './welcome-gate';

/**
 * Le dice a la bienvenida dónde se está pintando.
 *
 * Solo hace falta en el panel, que la enseña dentro de un recuadro y necesita que la puerta se
 * quede ahí en lugar de taparle la pantalla al admin. La invitación y el escaparate no lo
 * envuelven: el valor por defecto (`page`) ya es el suyo, y obligarles a declararlo sería pedir
 * ceremonia para el caso normal.
 */
export function WelcomeStageScope({
  stage,
  children,
}: {
  readonly stage: WelcomeStage;
  readonly children: ReactNode;
}) {
  return <WelcomeStageContext.Provider value={stage}>{children}</WelcomeStageContext.Provider>;
}
