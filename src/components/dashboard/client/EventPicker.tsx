'use client';

import { useTransition } from 'react';
import { Select } from 'antd';
import { useRouter } from 'next/navigation';
import type { EventSummary } from '@/domain/events/event-repository';

/**
 * El evento que se está mirando, en la cabecera del panel del cliente.
 *
 * Su forma depende de cuántos eventos haya, y las tres variantes son deliberadas:
 *
 * - **Ninguno**: no se muestra nada. Un desplegable vacío es una promesa incumplida.
 * - **Uno**: el nombre, como texto. Un selector de un solo elemento sugiere que hay algo que
 *   elegir y no lo hay; además invita a abrirlo para descubrir que no pasa nada.
 * - **Varios**: el desplegable, que es cuando de verdad sirve.
 *
 * Es la misma información en los tres casos —«esto es lo que estás mirando»— con el control
 * mínimo que cada caso necesita.
 *
 * ## El evento activo sale de la URL
 *
 * No de un estado guardado en la sesión. Guardarlo allí crearía un segundo sitio donde vive
 * «en qué evento estoy», y dos sitios acaban discrepando: bastaría con abrir dos pestañas
 * para que el selector de una mostrara el evento de la otra. Con la URL como fuente,
 * compartir un enlace lleva al mismo sitio a quien lo abra y el botón «atrás» del navegador
 * hace lo que se espera.
 *
 * Cuando la pantalla no es de un evento concreto —el resumen, el equipo— no hay nada
 * seleccionado y el desplegable lo dice con su marcador de posición en vez de mentir
 * señalando uno.
 */
export function EventPicker({
  events,
  activeEventId,
}: {
  readonly events: readonly EventSummary[];
  readonly activeEventId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (events.length === 0) return null;

  if (events.length === 1) {
    const only = events[0];

    return only ? <span className="dash__topbar-context">{only.title}</span> : null;
  }

  return (
    <Select
      value={activeEventId ?? undefined}
      placeholder="Elige un evento"
      loading={isPending}
      disabled={isPending}
      style={{ minWidth: 210 }}
      aria-label="Evento activo"
      onChange={(eventId: string) => {
        startTransition(() => {
          router.push(`/panel/eventos/${eventId}`);
        });
      }}
      options={events.map((event) => ({ value: event.id, label: event.title }))}
    />
  );
}
