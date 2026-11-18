import { canAdministerPlatform, type ClientActor } from '@/domain/auth/actor';
import type { PlatformCredentials } from '@/domain/auth/platform-credentials';
import type { EventNotifier } from '@/domain/events/event-notifier';
import type { EventRepository } from '@/domain/events/event-repository';

/**
 * Después de enviar, la edición se cierra; volver a cambiar algo es una conversación con la
 * plataforma. Estos dos casos de uso son sus dos lados.
 */

export type RequestChangesResult =
  | { readonly outcome: 'requested'; readonly notified: boolean }
  /** Todavía está en borrador: puede cambiarlo él mismo, no hay nada que pedir. */
  | { readonly outcome: 'not-needed' }
  | { readonly outcome: 'not-found' };

/**
 * El cliente pide poder cambiar algo. Queda anotado en el evento —el admin lo ve en la lista— y se
 * avisa por correo a la plataforma. Como el aviso de envío, el correo no puede tumbar la petición:
 * si falla, la petición ya está guardada y se ve en el admin.
 */
export class RequestContentChanges {
  constructor(
    private readonly events: EventRepository,
    private readonly notifier: EventNotifier,
    private readonly siteUrl: string,
  ) {}

  async execute(actor: ClientActor, eventId: string, note: string | null): Promise<RequestChangesResult> {
    const event = await this.events.findForClient(actor, eventId);

    if (event === null) return { outcome: 'not-found' };
    if (event.status === 'draft') return { outcome: 'not-needed' };

    const trimmed = note?.trim().slice(0, 1000) || null;
    const saved = await this.events.requestChanges(actor, eventId, trimmed);

    if (!saved) return { outcome: 'not-needed' };

    const notified = await this.notifier.notifyChangesRequested({
      to: await this.events.listPlatformNoticeEmails(),
      clientName: actor.name ?? actor.email,
      eventTitle: event.title,
      note: trimmed,
      reviewUrl: `${this.siteUrl}/admin/eventos/${eventId}/contenido`,
    });

    return { outcome: 'requested', notified };
  }
}

/** La plataforma le devuelve la edición al cliente. Ver `EventRepository.reopenForClient`. */
export class ReopenContentForClient {
  constructor(private readonly events: EventRepository) {}

  async execute(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
  ): Promise<'reopened' | 'forbidden' | 'not-found'> {
    if (!canAdministerPlatform(credentials.actor)) return 'forbidden';

    return (await this.events.reopenForClient(credentials, clientId, eventId)) ? 'reopened' : 'not-found';
  }
}
