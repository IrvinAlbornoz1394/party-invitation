import type { ClientActor } from '@/domain/auth/actor';
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
   * Recibe `ClientActor` y no `Actor`. Es la mitad del valor de la unión discriminada: una
   * cuenta de plataforma no puede llegar aquí ni por error, porque no compila.
   */
  async execute(actor: ClientActor): Promise<readonly EventSummary[]> {
    return this.events.listForClient(actor.clientId);
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
