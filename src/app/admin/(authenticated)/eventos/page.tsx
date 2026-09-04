import type { Metadata } from 'next';
import { EventsScreen } from '@/components/dashboard/admin/EventsScreen';
import { listAllEvents, listClients, loadNewEventOptions } from '@/infrastructure/container';
import { requirePlatformCredentials } from '@/lib/auth/current-session';

export const metadata: Metadata = {
  title: 'Eventos · Plataforma',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Todos los eventos de todos los clientes.
 *
 * El cliente por el que se filtra viaja en la URL (`?cliente=<id>`) y no en el estado del
 * componente, y eso es lo que hace que llegar desde la ficha de un cliente con el filtro ya
 * puesto sea un enlace normal. De paso, la vista se puede compartir y sobrevive a una recarga.
 *
 * La lista de clientes se pide entera, no se deduce de los eventos: un cliente sin eventos
 * también tiene que poder elegirse — enterarse de que no tiene ninguno es justo una de las
 * cosas que se vienen a mirar aquí.
 */
export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const credentials = await requirePlatformCredentials();
  /*
   * El catálogo se pide junto con la lista y no cuando se abre el diálogo de alta. Es una lectura
   * de tablas sin inquilino y sin RLS, así que sale barata, y a cambio el formulario aparece con
   * sus desplegables ya llenos: pedirlo al abrir dejaría un modal con cuatro selectores vacíos
   * durante el viaje al servidor, que es justo cuando alguien empieza a escribir.
   */
  const [{ cliente }, events, clients, options] = await Promise.all([
    searchParams,
    listAllEvents.execute(credentials),
    listClients.execute(credentials),
    loadNewEventOptions.execute(credentials),
  ]);

  /*
   * Un id que no corresponde a ningún cliente se ignora en lugar de dar error: la URL la
   * escribe cualquiera, y un filtro que no existe no es un fallo, es un filtro vacío.
   */
  const selected = clients.some((client) => client.id === cliente) ? (cliente ?? null) : null;

  return (
    <EventsScreen
      events={events}
      clients={clients}
      selectedClientId={selected}
      options={options}
    />
  );
}
