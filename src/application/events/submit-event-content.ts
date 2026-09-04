import type { ClientActor } from '@/domain/auth/actor';
import {
  checkContentCompleteness,
  type ContentCompleteness,
} from '@/domain/events/content-completeness';
import type { EventNotifier } from '@/domain/events/event-notifier';
import type { EventRepository } from '@/domain/events/event-repository';
import type { InvitationRepository } from '@/domain/events/invitation-repository';

/**
 * El cliente da por terminado el contenido de su evento y lo manda a revisar.
 *
 * Es el traspaso: hasta aquí el evento era suyo y a partir de aquí la pelota es de la
 * plataforma. Por eso hace tres cosas en este orden —comprobar, mover, avisar— y ninguna de las
 * tres puede ir sola:
 *
 *   · **Comprobar** que no falte nada. Mandar a revisar una invitación con la sede en blanco le
 *     hace perder el viaje a quien la revisa, y sobre todo no es lo que el cliente cree que está
 *     haciendo: él cree que terminó.
 *   · **Mover** el estado. Es lo único que de verdad cambia algo, y por eso es lo que decide si
 *     la operación fue bien.
 *   · **Avisar** al equipo. Después de guardar y sin poder deshacerlo: ver abajo.
 *
 * ## El aviso no puede tumbar el envío
 *
 * Si Resend está caído, el evento **ya está** en revisión y decirle al cliente que falló sería
 * mentirle e invitarle a repetir. El correo devuelve un `boolean` que se usa para matizar el
 * mensaje —«avisamos al equipo» o «lo tenemos, en breve lo revisamos»— y nada más. Es la misma
 * regla del aviso de prospectos.
 */
export type SubmitContentResult =
  | { readonly outcome: 'submitted'; readonly notified: boolean }
  | { readonly outcome: 'incomplete'; readonly completeness: ContentCompleteness }
  /** Ya estaba en revisión o publicado: no hay nada que mandar. */
  | { readonly outcome: 'wrong-status' }
  | { readonly outcome: 'not-found' };

export class SubmitEventContent {
  constructor(
    private readonly events: EventRepository,
    private readonly invitations: InvitationRepository,
    private readonly notifier: EventNotifier,
    private readonly siteUrl: string,
  ) {}

  async execute(actor: ClientActor, eventId: string): Promise<SubmitContentResult> {
    const loaded = await this.invitations.findForPreview(actor, eventId);

    if (!loaded) return { outcome: 'not-found' };

    const completeness = checkContentCompleteness(
      loaded.content.source,
      loaded.content.blocks,
    );

    if (!completeness.complete) return { outcome: 'incomplete', completeness };

    const moved = await this.events.sendToReview(actor, eventId);

    /* El `update` exige que siga en borrador. Si no movió ninguna fila es que ya no lo estaba
       —otra pestaña lo mandó, o la plataforma lo publicó mientras tanto—. */
    if (!moved) return { outcome: 'wrong-status' };

    const notified = await this.notifier.notifyContentSubmitted({
      to: await this.events.listPlatformNoticeEmails(),
      clientName: loaded.invitation.celebrantFullName ?? loaded.invitation.celebrantName,
      eventTitle: loaded.invitation.title,
      reviewUrl: `${this.siteUrl}/admin/eventos/${eventId}/contenido`,
    });

    return { outcome: 'submitted', notified };
  }

  /**
   * El estado del evento para la pantalla de contenido: dónde está y a quién espera.
   *
   * Va junto a la comprobación de huecos porque las dos las pide la misma pantalla y en el mismo
   * momento; separarlas en dos casos de uso obligaría a la página a coordinar dos lecturas que
   * siempre viajan juntas.
   */
  async status(actor: ClientActor, eventId: string) {
    const event = await this.events.findForClient(actor, eventId);

    if (event === null) return null;

    return {
      status: event.status,
      clientFillsContent: event.clientFillsContent,
      completeness: await this.check(actor, eventId),
    };
  }

  /**
   * Qué le falta, sin mandar nada.
   *
   * La pantalla del cliente la llama al cargar para enseñar la lista de pendientes junto al
   * botón. Es la misma comprobación que hace `execute`, y tiene que serlo: una pantalla que dice
   * «listo» y un botón que responde «te falta la sede» es peor que no avisar.
   */
  async check(actor: ClientActor, eventId: string): Promise<ContentCompleteness | null> {
    const loaded = await this.invitations.findForPreview(actor, eventId);

    if (!loaded) return null;

    return checkContentCompleteness(loaded.content.source, loaded.content.blocks);
  }
}
