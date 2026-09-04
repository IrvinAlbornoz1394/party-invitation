import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { tenantScopeOf } from '@/domain/auth/actor';
import { EventShell } from '@/components/dashboard/client/EventShell';
import { listClientEvents, loadPlanFeatures } from '@/infrastructure/container';
import { requireEventAccess } from '@/lib/auth/current-session';

/**
 * Frontera y armazón de `/panel/eventos/<id>/…`.
 *
 * Vive en su propio grupo, fuera de `(authenticated)`, y ese detalle es lo que hace que el
 * modelo funcione de punta a punta. El layout de `(authenticated)` llama a
 * `requireClientScope()`, que exige alcanzar un cliente entero — y un visor **no lo alcanza**:
 * solo alcanza un evento. Si estas páginas siguieran ahí, los novios entrarían al selector, lo
 * verían con su boda dentro, la pulsarían y acabarían rebotados al selector otra vez.
 *
 * Aquí la autorización la da `requireEventAccess()`, que pregunta por el evento y no por el
 * cliente. Responde 404 tanto para un evento que no existe como para uno que no se alcanza, y
 * los dos casos tienen que ser indistinguibles: el id va en la URL, así que un 403 convertiría
 * esta ruta en un oráculo para averiguar qué eventos hay.
 *
 * El grupo se llama `(event)` y no aparece en la URL, así que estas páginas siguen siendo
 * `/panel/eventos/<id>`. Convive con `(authenticated)/eventos/page.tsx` sin colisión porque son
 * rutas distintas: la lista es `/panel/eventos` y esto es `/panel/eventos/<id>`.
 */
export default async function EventLayout({
  params,
  children,
}: {
  readonly params: Promise<{ id: string }>;
  readonly children: ReactNode;
}) {
  const { id } = await params;
  /*
   * La vuelta después del login. El correo que recibe un invitado enlaza directamente aquí, y
   * sin esto acababa en el selector de entrada tras teclear su código: con un solo acceso el
   * selector lo habría redirigido igual, pero con dos se quedaba eligiendo cuál abrir después
   * de haber pulsado un enlace que ya lo decía.
   */
  const { account, membership } = await requireEventAccess(id, `/panel/eventos/${id}`);

  /*
   * El plan y el título salen del EVENTO, no de la membresía, y hubo que aprenderlo: una membresía
   * de alcance cliente no nombra ningún evento, así que su `planKey` es null. Leyéndolo de ahí, el
   * menú de un dueño se quedaba sin ninguna sección con guardia de plan — «Contenido» incluida—
   * mientras que el de un visor sí las tenía. Justo al revés de lo que corresponde.
   *
   * La consulta va con el alcance de la membresía, así que RLS devuelve un solo evento para un
   * visor y todos los del cliente para un dueño. `find` elige en el segundo caso.
   */
  const events = await listClientEvents.execute(tenantScopeOf(membership));
  const event = events.find((candidate) => candidate.id === id);

  // El evento está en el alcance —`requireEventAccess` ya lo autorizó— así que no encontrarlo
  // significa que se archivó o se borró entre una consulta y la otra. Mismo 404 que si no existiera.
  if (!event) notFound();

  const planFeatures = await loadPlanFeatures.execute(event.planKey);

  return (
    <EventShell
      eventId={id}
      eventTitle={event.title}
      clientName={membership.clientName}
      role={membership.role}
      label={membership.label}
      identity={account}
      planFeatures={[...planFeatures]}
      canReachClient={membership.eventId === null}
    >
      {children}
    </EventShell>
  );
}
