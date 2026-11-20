import { canAdministerPlatform } from '@/domain/auth/actor';
import type { PlatformCredentials } from '@/domain/auth/platform-credentials';
import type { DeleteResult } from '@/domain/clients/client-repository';
import type { EventRepository } from '@/domain/events/event-repository';
import { isUuid } from '@/application/clients/manage-clients';

/**
 * Eliminar un evento desde la plataforma, de forma lógica.
 *
 * Su invitación deja de abrirse en ese instante aunque esté publicada: es lo que se le pide a un
 * evento eliminado. Lo hace `app.delete_event()`, que revalida el privilegio contra el token.
 */
export class DeleteEvent {
  constructor(private readonly events: EventRepository) {}

  async execute(credentials: PlatformCredentials, eventId: string): Promise<DeleteResult> {
    if (!canAdministerPlatform(credentials.actor)) return { outcome: 'forbidden' };
    if (!isUuid(eventId)) return { outcome: 'not-found' };

    return this.events.deleteAsPlatform(credentials, eventId);
  }
}
