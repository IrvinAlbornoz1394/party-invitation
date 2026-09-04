import { canAdministerPlatform } from '@/domain/auth/actor';
import type { PlatformCredentials } from '@/domain/auth/platform-credentials';
import type { EventNotifier } from '@/domain/events/event-notifier';
import type { EventRepository } from '@/domain/events/event-repository';

/**
 * Mandarle al cliente el enlace para que llene su información.
 *
 * Es la acción que resuelve el caso que se descubre siempre tarde: un evento que se dio de alta
 * pensando que lo llenaría la plataforma, y que acaba llenando el cliente. Hasta ahora eso
 * obligaba a dar de alta otro evento o a pedirle el enlace a alguien por WhatsApp.
 *
 * Hace tres cosas de una vez, y las tres son la misma decisión —«ahora lo llena el cliente»—:
 *
 *   1. Enciende `client_fills_content`, que es lo que hace que el panel deje de esperar a la
 *      plataforma y empiece a esperar al cliente.
 *   2. Manda el correo con el enlace.
 *   3. Devuelve ese mismo enlace, para que la pantalla lo pueda enseñar y copiar.
 *
 * El tercer punto no es un adorno: el correo puede tardar, caer en spam o ir a una dirección que
 * el cliente ya no usa, y quien está al teléfono con él necesita poder pegárselo en el chat.
 * Además, sin proveedor de correo configurado —en desarrollo— es la única forma de seguir el
 * flujo, y por eso se devuelve **aunque el envío falle**.
 */
export type ShareContentLinkResult =
  | { readonly outcome: 'shared'; readonly url: string; readonly emailed: boolean }
  | { readonly outcome: 'forbidden' }
  | { readonly outcome: 'not-found' };

export class ShareContentLink {
  constructor(
    private readonly events: EventRepository,
    private readonly notifier: EventNotifier,
    private readonly siteUrl: string,
  ) {}

  async execute(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
  ): Promise<ShareContentLinkResult> {
    if (!canAdministerPlatform(credentials.actor)) return { outcome: 'forbidden' };

    const event = await this.events.findForPlatform(credentials, clientId, eventId);

    if (event === null) return { outcome: 'not-found' };

    const flagged = await this.events.setClientFillsContent({
      credentials,
      clientId,
      eventId,
      value: true,
    });

    if (!flagged) return { outcome: 'not-found' };

    const url = contentUrlFor(this.siteUrl, eventId);
    const contact = await this.events.findClientContact(credentials, clientId);

    /* Sin correo no hay envío y no es un error: los clientes dados de alta antes de que el correo
       fuera obligatorio pueden no tenerlo. La pantalla enseña el enlace igual, que es lo que hace
       falta para seguir. */
    const emailed = contact?.email
      ? await this.notifier.notifyEventCreated({
          to: { email: contact.email, phone: contact.phone },
          clientName: contact.name,
          eventTitle: event.title,
          eventDateLabel: dateLabel(event.startsAt),
          contentUrl: url,
        })
      : false;

    return { outcome: 'shared', url, emailed };
  }
}

/**
 * A dónde se manda al cliente a llenar su evento.
 *
 * Vive aquí y no en cada llamador porque la componen tres sitios —el alta, esta acción y la
 * pantalla que enseña el enlace— y una dirección escrita tres veces se desincroniza el día que
 * la ruta cambie.
 */
export function contentUrlFor(siteUrl: string, eventId: string): string {
  return `${siteUrl}/panel/eventos/${eventId}/contenido`;
}

/** La fecha en palabras, para un correo. No lleva hora: el correo no es la invitación. */
function dateLabel(startsAt: Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(startsAt);
}
