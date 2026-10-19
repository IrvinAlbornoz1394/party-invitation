import type { ClientActor, TenantScope } from '@/domain/auth/actor';
import { normalizeAccessCode } from '@/domain/events/access-code';
import type { EventRepository } from '@/domain/events/event-repository';
import { normalizeEventSlug } from '@/domain/events/event-slug';
import { guestGroupDraftSchema, type GuestList } from '@/domain/guests/guest-group';
import type { GuestRepository } from '@/domain/guests/guest-repository';
import { rsvpReplySchema, type SubmitRsvpResult } from '@/domain/guests/rsvp-reply';

/**
 * La lista de invitados y sus confirmaciones, del lado del panel y del lado de la invitación.
 *
 * ## El plan se comprueba aquí, no en la pantalla
 *
 * El menú esconde «Invitados» y «Confirmaciones» a quien no las tiene, pero un menú es una
 * sugerencia de navegación: la URL se puede teclear y una Server Action se puede invocar sin
 * pantalla. Cada caso de uso pregunta al plan **del evento** —no al de la membresía, que en el
 * alcance cliente es null— y responde como si el evento no existiera.
 */

/** La funcionalidad que da la lista de invitados por familia. */
const GUESTS_FEATURE = 'gestion_invitados';
/** La que da el resumen de confirmaciones. */
const RSVP_PANEL_FEATURE = 'panel_confirmaciones';

export type SaveGuestGroupResult =
  | { readonly outcome: 'saved' }
  | { readonly outcome: 'invalid'; readonly reason: string }
  | { readonly outcome: 'not-found' };

async function planIncludes(
  events: EventRepository,
  scope: TenantScope,
  eventId: string,
  feature: string,
): Promise<boolean> {
  return (await events.includedFeatures(scope, eventId)).includes(feature);
}

export class ListGuests {
  constructor(
    private readonly guests: GuestRepository,
    private readonly events: EventRepository,
  ) {}

  /**
   * La lista para la pantalla de invitados (`gestion_invitados`) o para la de confirmaciones
   * (`panel_confirmaciones`). `null` si el evento no está en el alcance o su plan no la incluye.
   */
  async execute(
    scope: TenantScope,
    eventId: string,
    purpose: 'guests' | 'rsvp' = 'guests',
  ): Promise<GuestList | null> {
    const feature = purpose === 'guests' ? GUESTS_FEATURE : RSVP_PANEL_FEATURE;

    if (!(await planIncludes(this.events, scope, eventId, feature))) return null;

    return this.guests.loadGuestList(scope, eventId);
  }
}

export class SaveGuestGroup {
  constructor(
    private readonly guests: GuestRepository,
    private readonly events: EventRepository,
  ) {}

  async execute(
    actor: ClientActor,
    command: {
      readonly eventId: string;
      /** `null` da de alta una familia nueva. */
      readonly groupId: string | null;
      readonly name: string;
      readonly seats: string;
      readonly phone: string;
      readonly notes: string;
    },
  ): Promise<SaveGuestGroupResult> {
    if (!(await planIncludes(this.events, actor, command.eventId, GUESTS_FEATURE))) {
      return { outcome: 'not-found' };
    }

    const parsed = guestGroupDraftSchema.safeParse(command);

    if (!parsed.success) {
      return {
        outcome: 'invalid',
        reason: parsed.error.issues.at(0)?.message ?? 'Revisa los datos de la familia.',
      };
    }

    if (command.groupId === null) {
      const created = await this.guests.createGroup(actor, command.eventId, parsed.data);

      return created ? { outcome: 'saved' } : { outcome: 'not-found' };
    }

    /*
     * Bajar el cupo por debajo de lo que la familia ya confirmó dejaría una cuenta imposible
     * —«4 de 3 lugares»—. Se pide que lo hablen con la familia antes, en lugar de recortarle la
     * respuesta en silencio.
     */
    const list = await this.guests.loadGuestList(actor, command.eventId);
    const current = list?.groups.find((group) => group.id === command.groupId);

    if (!current) return { outcome: 'not-found' };

    if (current.reply?.status === 'confirmed' && current.reply.attendees > parsed.data.seats) {
      return {
        outcome: 'invalid',
        reason: `Esta familia ya confirmó ${current.reply.attendees} lugares. Habla con ella antes de bajar su cupo.`,
      };
    }

    const updated = await this.guests.updateGroup(
      actor,
      command.eventId,
      command.groupId,
      parsed.data,
    );

    return updated ? { outcome: 'saved' } : { outcome: 'not-found' };
  }
}

export class DeleteGuestGroup {
  constructor(
    private readonly guests: GuestRepository,
    private readonly events: EventRepository,
  ) {}

  async execute(actor: ClientActor, eventId: string, groupId: string): Promise<boolean> {
    if (!(await planIncludes(this.events, actor, eventId, GUESTS_FEATURE))) return false;

    return this.guests.deleteGroup(actor, eventId, groupId);
  }
}

/**
 * La respuesta de una familia desde su enlace.
 *
 * Valida la forma antes de tocar la base de datos, igual que `ResolveInvitation`: un slug o un
 * código malformados no deben gastarle el límite de intentos a nadie.
 */
export class SubmitRsvp {
  constructor(private readonly guests: GuestRepository) {}

  async execute(input: {
    readonly slug: string;
    readonly code: string;
    readonly reply: unknown;
    readonly clientIp: string | null;
    readonly userAgent: string | null;
  }): Promise<SubmitRsvpResult> {
    const slug = normalizeEventSlug(input.slug);
    const code = normalizeAccessCode(input.code);

    if (slug === null || code === null) return { outcome: 'denied' };

    const reply = rsvpReplySchema.safeParse(input.reply);

    if (!reply.success) {
      return {
        outcome: 'invalid',
        reason: reply.error.issues.at(0)?.message ?? 'Revisa tu respuesta.',
      };
    }

    return this.guests.submitReply({
      slug,
      code,
      reply: reply.data,
      clientIp: input.clientIp,
      userAgent: input.userAgent,
    });
  }
}
