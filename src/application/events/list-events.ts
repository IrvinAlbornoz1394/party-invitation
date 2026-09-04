import type { TenantScope } from '@/domain/auth/actor';
import { canAdministerPlatform } from '@/domain/auth/actor';
import type { PlatformCredentials } from '@/domain/auth/platform-credentials';
import type { EventRepository, EventSummary } from '@/domain/events/event-repository';

/**
 * Listar eventos: el mismo dato, dos caminos con permisos distintos.
 *
 * Están en el mismo archivo porque leerlos juntos es lo que deja claro en qué se
 * diferencian. Separarlos escondería que el panel de plataforma llega a los eventos de un
 * cliente por una puerta distinta —y con autorización— a la que usa el cliente.
 */

/** Los eventos del cliente que hizo la petición. `/panel`. */
export class ListClientEvents {
  constructor(private readonly events: EventRepository) {}

  /**
   * Recibe un `TenantScope` y no un `Actor`. Dos cosas de una: una cuenta de plataforma no
   * puede llegar aquí ni por error —no compila—, y un visor **sí** puede, porque leer su evento
   * es una lectura legítima y el alcance ya la acota a uno.
   *
   * Con alcance de evento, RLS devuelve exactamente una fila. Este mismo caso de uso sirve
   * entonces para «los eventos del cliente» y para «el evento que alcanzo», sin una rama.
   */
  async execute(scope: TenantScope): Promise<readonly EventSummary[]> {
    return this.events.listForClient(scope);
  }
}

/** Todos los eventos de todos los clientes. `/admin/eventos`. */
export class ListAllEvents {
  constructor(private readonly events: EventRepository) {}

  async execute(credentials: PlatformCredentials): Promise<readonly EventSummary[]> {
    if (!canAdministerPlatform(credentials.actor)) return [];

    return this.events.listAllForPlatform(credentials);
  }
}

/**
 * Los eventos de un cliente concreto, vistos desde el panel de plataforma.
 *
 * Devuelve `null` cuando no hay autorización, y quien llama lo traduce a un 404. Que sea
 * `null` y no una lista vacía importa: "este cliente no tiene eventos" y "no puedes ver
 * este cliente" son cosas distintas para quien programa la pantalla, aunque el usuario
 * final vea lo mismo en el segundo caso que si el cliente no existiera.
 */
export class ListEventsOfClient {
  constructor(private readonly events: EventRepository) {}

  async execute(
    credentials: PlatformCredentials,
    clientId: string,
  ): Promise<readonly EventSummary[] | null> {
    if (!canAdministerPlatform(credentials.actor)) return null;

    return this.events.listForClientAsPlatform(credentials, clientId);
  }
}

/**
 * Un evento concreto, buscado por la plataforma cuando solo se tiene su identificador.
 *
 * Existe por una asimetría de las direcciones: `/admin/eventos/[id]/contenido` lleva el evento y
 * no el cliente, pero abrir el contexto de un cliente exige saber **cuál**. Esto lo resuelve.
 *
 * ## Por qué sobre la lista y no con una consulta propia
 *
 * Porque `app.list_events_for_platform()` ya existe, ya está autorizada por la sesión y devuelve
 * el `client_id` de cada evento. Una función nueva para traer una fila sería otra superficie que
 * mantener y otro sitio donde equivocarse con los permisos.
 *
 * El coste es traer la lista para quedarse con uno. Con los eventos que maneja hoy la plataforma
 * es irrelevante, y el día que deje de serlo se nota antes en la propia pantalla de eventos —que
 * los pinta todos— que aquí. Ese día se escribe la función, y esta firma no cambia.
 */
export class FindEventForPlatform {
  constructor(private readonly events: EventRepository) {}

  async execute(
    credentials: PlatformCredentials,
    eventId: string,
  ): Promise<EventSummary | null> {
    if (!canAdministerPlatform(credentials.actor)) return null;

    const all = await this.events.listAllForPlatform(credentials);

    return all.find((event) => event.id === eventId) ?? null;
  }
}
