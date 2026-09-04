import { canAdministerPlatform } from '@/domain/auth/actor';
import type { PlatformCredentials } from '@/domain/auth/platform-credentials';
import {
  checkContentCompleteness,
  type ContentCompleteness,
} from '@/domain/events/content-completeness';
import type { EventRepository } from '@/domain/events/event-repository';
import type { InvitationRepository } from '@/domain/events/invitation-repository';
import { canPublishFrom, isEventStatus } from '@/domain/events/event-status';

/**
 * Publicar un evento, y lo que hay que comprobar antes.
 *
 * Publicar es la operación que se paga y la única que hace visible una invitación, así que es la
 * que más se protege. Comprueba tres cosas, en este orden y por separado:
 *
 *   1. **Quién.** Solo la plataforma publica. El cliente manda a revisión; publicar es de quien
 *      responde por el resultado.
 *   2. **Desde dónde.** Solo desde borrador o revisión (`canPublishFrom`). Republicar lo
 *      publicado no es una operación, y revivir un archivado es un alta.
 *   3. **Con qué.** Que el contenido esté completo — es decir, que la invitación no tenga
 *      secciones en blanco. Ver `content-completeness.ts`.
 *
 * Los tres devuelven resultados distintos a propósito: «no puedes», «ya estaba» y «le falta
 * esto» piden tres pantallas distintas, y un `false` único obligaría a adivinar cuál.
 *
 * ## Por qué la comprobación de contenido vive aquí y no solo en la pantalla
 *
 * Porque una pantalla que esconde un botón no es una regla: es una sugerencia. El admin puede
 * tener la lista abierta desde antes de que el cliente borrara media sección, y la acción de
 * servidor es el único sitio por el que pasa todo el mundo.
 */
export type PublishEventResult =
  | { readonly outcome: 'published' }
  | { readonly outcome: 'forbidden' }
  | { readonly outcome: 'not-found' }
  /** Está archivado o ya publicado: no hay nada que publicar. */
  | { readonly outcome: 'wrong-status'; readonly status: string }
  /** Le faltan datos. Se devuelve el detalle para poder decir exactamente qué. */
  | { readonly outcome: 'incomplete'; readonly completeness: ContentCompleteness };

export class PublishEvent {
  constructor(
    private readonly events: EventRepository,
    private readonly invitations: InvitationRepository,
  ) {}

  async execute(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
  ): Promise<PublishEventResult> {
    if (!canAdministerPlatform(credentials.actor)) return { outcome: 'forbidden' };

    const completeness = await this.check(credentials, clientId, eventId);

    if (completeness === null) return { outcome: 'not-found' };
    if (!completeness.complete) return { outcome: 'incomplete', completeness };

    const published = await this.events.publish(credentials, clientId, eventId);

    /*
     * El `update` lleva el estado de partida en su `where`, así que un `false` aquí significa
     * «ya no estaba donde creíamos»: otra pestaña lo publicó o lo archivó mientras tanto. Se
     * vuelve a leer para poder decir en cuál está, en vez de responder un «no se pudo» pelado.
     */
    if (!published) {
      const current = await this.events.findForPlatform(credentials, clientId, eventId);

      if (current === null) return { outcome: 'not-found' };

      return { outcome: 'wrong-status', status: current.status };
    }

    return { outcome: 'published' };
  }

  /**
   * Qué le falta a un evento, sin publicar nada.
   *
   * Lo usan las dos pantallas —la del admin para decidir si ofrece el botón, y la del cliente
   * para enseñar la lista antes de mandar— y la propia publicación de aquí arriba. Devuelve
   * `null` cuando el evento no existe o no se alcanza.
   */
  async check(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
  ): Promise<ContentCompleteness | null> {
    if (!canAdministerPlatform(credentials.actor)) return null;

    const loaded = await this.invitations.findForPreviewAsPlatform(credentials, clientId, eventId);

    if (!loaded) return null;

    return checkContentCompleteness(loaded.content.source, loaded.content.blocks);
  }
}

/** Un estado que llega de la base de datos, ya validado contra los que el dominio conoce. */
export function readEventStatus(value: string): string {
  return isEventStatus(value) ? value : 'draft';
}

/** Reexportado para que las pantallas no tengan que importar de dos sitios. */
export { canPublishFrom };
