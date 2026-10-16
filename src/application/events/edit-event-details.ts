import { canAdministerPlatform } from '@/domain/auth/actor';
import type { PlatformCredentials } from '@/domain/auth/platform-credentials';
import {
  eventDetailsSchema,
  type EditableEventDetails,
  type EventDetailsInput,
  type UpdateEventDetailsResult,
} from '@/domain/events/event-details';
import type { EventRepository } from '@/domain/events/event-repository';
import type { FindEventForPlatform } from './list-events';

/**
 * Editar el evento: los datos del alta, no el contenido de la invitación. Ver `event-details.ts`.
 *
 * Las dos operaciones reciben solo el identificador del evento y resuelven el cliente con
 * `FindEventForPlatform`, igual que la pantalla de contenido. El cliente nunca viaja desde el
 * navegador.
 */
export class EditEventDetails {
  constructor(
    private readonly events: EventRepository,
    private readonly findEvent: FindEventForPlatform,
  ) {}

  async load(
    credentials: PlatformCredentials,
    eventId: string,
  ): Promise<EditableEventDetails | null> {
    if (!canAdministerPlatform(credentials.actor)) return null;

    const event = await this.findEvent.execute(credentials, eventId);
    if (event === null) return null;

    return this.events.findDetailsForPlatform(credentials, event.clientId, eventId);
  }

  async save(
    credentials: PlatformCredentials,
    eventId: string,
    input: EventDetailsInput,
  ): Promise<
    | UpdateEventDetailsResult
    | { readonly outcome: 'invalid'; readonly errors: Readonly<Record<string, string>> }
  > {
    if (!canAdministerPlatform(credentials.actor)) return { outcome: 'forbidden' };

    const parsed = eventDetailsSchema.safeParse(input);

    if (!parsed.success) {
      const errors: Record<string, string> = {};

      /* El primer motivo por campo, como en el alta. */
      for (const issue of parsed.error.issues) {
        const field = issue.path.at(0);
        if (typeof field === 'string' && !(field in errors)) errors[field] = issue.message;
      }

      return { outcome: 'invalid', errors };
    }

    const event = await this.findEvent.execute(credentials, eventId);
    if (event === null) return { outcome: 'forbidden' };

    return this.events.updateDetails({
      credentials,
      clientId: event.clientId,
      eventId,
      details: parsed.data,
    });
  }
}
