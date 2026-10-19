import { sql } from 'drizzle-orm';
import type { TenantScope } from '@/domain/auth/actor';
import { generateAccessCode } from '@/domain/events/access-code';
import type { InvitationGuest } from '@/domain/events/invitation';
import type { GuestGroup, GuestGroupDraft, GuestList } from '@/domain/guests/guest-group';
import type { GuestRepository } from '@/domain/guests/guest-repository';
import type { SubmitRsvpRequest, SubmitRsvpResult } from '@/domain/guests/rsvp-reply';
import { db } from '../db/client';
import { withTenant, type TenantTransaction } from '../db/tenant';

type Row = Record<string, unknown>;

/**
 * Cuántas respuestas puede mandar una familia por hora.
 *
 * Cambiar de opinión es legítimo —la tabla es un historial justo por eso—, pero veinte veces en
 * una hora no lo es: es un enlace que alguien está martilleando. El tope protege el historial del
 * panel, que es lo que el organizador lee, de llenarse de ruido.
 */
const MAX_REPLIES_PER_HOUR = 20;

/** La última respuesta de cada familia de un evento: el estado vigente. */
const LATEST_REPLIES = (eventId: string) => sql`
  select distinct on (r.guest_group_id)
         r.guest_group_id, r.status::text as status, r.adults_count, r.message, r.created_at
    from public.rsvp_responses r
   where r.event_id = ${eventId}::uuid
   order by r.guest_group_id, r.created_at desc`;

/** Si el plan del evento incluye una funcionalidad. */
async function eventPlanIncludes(
  tx: TenantTransaction,
  eventId: string,
  featureKey: string,
): Promise<boolean> {
  const result = await tx.execute<{ ok: boolean } & Row>(
    sql`select exists (
          select 1
            from public.events e
            join public.plan_features pf on pf.plan_key = e.plan_key
           where e.id = ${eventId}::uuid
             and pf.feature_key = ${featureKey}
             and pf.is_included
        ) as ok`,
  );

  return result.rows.at(0)?.ok === true;
}

/**
 * La familia que abre la invitación, con el contexto de tenant ya fijado.
 *
 * La usa el camino público (`DrizzleInvitationRepository.findForAccess`) después de que
 * `app.resolve_invitation_access()` dijera de qué familia es el código.
 */
export async function loadInvitationGuest(
  tx: TenantTransaction,
  eventId: string,
  groupId: string,
): Promise<InvitationGuest | null> {
  const result = await tx.execute<Row>(
    sql`select g.name,
               g.max_adults + g.max_children as seats,
               latest.status,
               latest.adults_count,
               latest.message
          from public.guest_groups g
          left join lateral (
            select r.status::text as status, r.adults_count, r.message
              from public.rsvp_responses r
             where r.guest_group_id = g.id
             order by r.created_at desc
             limit 1
          ) latest on true
         where g.id = ${groupId}::uuid and g.event_id = ${eventId}::uuid`,
  );

  const row = result.rows.at(0);
  if (!row) return null;

  const status = row.status as string | null;

  return {
    name: row.name as string,
    seats: Number(row.seats),
    canReply: await eventPlanIncludes(tx, eventId, 'rsvp'),
    reply:
      status === 'confirmed' || status === 'declined'
        ? {
            status,
            attendees: Number(row.adults_count),
            message: (row.message as string | null) ?? null,
          }
        : null,
  };
}

/** `unique_violation` de Postgres: el código salió repetido dentro del evento. */
function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;

  while (current instanceof Error) {
    if ((current as { code?: unknown }).code === '23505') return true;
    current = current.cause;
  }

  return false;
}

export class DrizzleGuestRepository implements GuestRepository {
  async loadGuestList(scope: TenantScope, eventId: string): Promise<GuestList | null> {
    return withTenant(scope, async (tx) => {
      const event = await tx.execute<Row>(
        sql`select id, title, slug, status::text as status
              from public.events
             where id = ${eventId}::uuid`,
      );

      const row = event.rows.at(0);
      if (!row) return null;

      const groups = await tx.execute<Row>(
        sql`select g.id, g.name, g.invite_code, g.max_adults + g.max_children as seats,
                   g.phone, g.notes,
                   latest.status, latest.adults_count, latest.message, latest.created_at
              from public.guest_groups g
              left join (${LATEST_REPLIES(eventId)}) latest on latest.guest_group_id = g.id
             where g.event_id = ${eventId}::uuid
             order by g.name`,
      );

      return {
        eventId,
        eventTitle: row.title as string,
        eventSlug: row.slug as string,
        eventStatus: row.status as string,
        groups: groups.rows.map(toGuestGroup),
      };
    });
  }

  async createGroup(scope: TenantScope, eventId: string, draft: GuestGroupDraft): Promise<boolean> {
    /*
     * El código se reintenta ante la colisión en lugar de comprobarse antes: entre la comprobación
     * y la escritura podría entrar otro. Con 32^6 combinaciones el segundo intento casi nunca
     * hace falta, y el quinto no hará falta nunca.
     */
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await withTenant(scope, async (tx) => {
          const code = generateAccessCode();

          /* El `not exists` sobre el código del evento: si una familia tuviera el mismo código
             que el enlace general, ese enlace pasaría a abrir la invitación de esa familia. */
          const inserted = await tx.execute<Row>(
            sql`insert into public.guest_groups
                  (event_id, client_id, name, invite_code, max_adults, max_children, phone, notes)
                select e.id, e.client_id, ${draft.name}, ${code}, ${draft.seats}, 0,
                       ${draft.phone}, ${draft.notes}
                  from public.events e
                 where e.id = ${eventId}::uuid
                   and e.access_code <> ${code}
                returning id`,
          );

          if (inserted.rows.length === 0) {
            const exists = await tx.execute<Row>(
              sql`select 1 from public.events where id = ${eventId}::uuid`,
            );

            // El evento existe: el código chocó con el general. Se reintenta con otro.
            if (exists.rows.length > 0) {
              throw Object.assign(new Error('código repetido'), { code: '23505' });
            }

            return false;
          }

          return true;
        });
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
      }
    }

    throw new Error('No se pudo generar un código único para la familia.');
  }

  async updateGroup(
    scope: TenantScope,
    eventId: string,
    groupId: string,
    draft: GuestGroupDraft,
  ): Promise<boolean> {
    return withTenant(scope, async (tx) => {
      const result = await tx.execute<Row>(
        sql`update public.guest_groups
               set name = ${draft.name},
                   max_adults = ${draft.seats},
                   max_children = 0,
                   phone = ${draft.phone},
                   notes = ${draft.notes}
             where id = ${groupId}::uuid and event_id = ${eventId}::uuid
         returning id`,
      );

      return result.rows.length > 0;
    });
  }

  async deleteGroup(scope: TenantScope, eventId: string, groupId: string): Promise<boolean> {
    return withTenant(scope, async (tx) => {
      const result = await tx.execute<Row>(
        sql`delete from public.guest_groups
             where id = ${groupId}::uuid and event_id = ${eventId}::uuid
         returning id`,
      );

      return result.rows.length > 0;
    });
  }

  async submitReply(request: SubmitRsvpRequest): Promise<SubmitRsvpResult> {
    return db.transaction(async (tx) => {
      /*
       * La misma puerta que abre la invitación, con su límite por IP. Que el código sea de una
       * familia lo dice la base de datos: con el código general no llega ninguna, y ese enlace
       * no registra respuestas.
       */
      const resolved = await tx.execute<Row>(
        sql`select event_id, client_id, guest_group_id, rate_limited
              from app.resolve_invitation_access(${request.slug}, ${request.code}, ${request.clientIp}::inet)`,
      );

      const access = resolved.rows.at(0);
      if (!access) return { outcome: 'denied' };
      if (access.rate_limited === true) return { outcome: 'rate-limited' };

      const eventId = access.event_id as string | null;
      const clientId = access.client_id as string | null;
      const groupId = access.guest_group_id as string | null;

      // Sin `event_id` el código no casó, o la invitación no está publicada o ya venció.
      if (!eventId || !clientId) return { outcome: 'denied' };
      if (!groupId) return { outcome: 'closed' };

      await tx.execute(sql`select set_config('app.current_client_id', ${clientId}, true)`);

      if (!(await eventPlanIncludes(tx, eventId, 'rsvp'))) return { outcome: 'closed' };

      /* `for update` sobre la familia: dos respuestas simultáneas desde dos teléfonos de la misma
         casa se ordenan aquí, y el tope por hora se cuenta sin carreras. */
      const group = await tx.execute<Row>(
        sql`select g.max_adults + g.max_children as seats
              from public.guest_groups g
             where g.id = ${groupId}::uuid
             for update`,
      );

      const row = group.rows.at(0);
      if (!row) return { outcome: 'denied' };

      const recent = await tx.execute<Row>(
        sql`select count(*) as total
              from public.rsvp_responses
             where guest_group_id = ${groupId}::uuid
               and created_at > now() - interval '1 hour'`,
      );

      if (Number(recent.rows.at(0)?.total ?? 0) >= MAX_REPLIES_PER_HOUR) {
        return { outcome: 'rate-limited' };
      }

      const seats = Number(row.seats);
      const { reply } = request;

      if (reply.attending && reply.attendees > seats) {
        return {
          outcome: 'invalid',
          reason:
            seats === 1
              ? 'Su invitación es para una persona.'
              : `Su invitación es para ${seats} personas como máximo.`,
        };
      }

      await tx.execute(
        sql`insert into public.rsvp_responses
              (event_id, client_id, guest_group_id, status, adults_count, children_count,
               message, channel, submitted_ip, submitted_user_agent)
            values (
              ${eventId}::uuid,
              ${clientId}::uuid,
              ${groupId}::uuid,
              ${reply.attending ? 'confirmed' : 'declined'}::public.rsvp_status,
              ${reply.attending ? reply.attendees : 0},
              0,
              ${reply.attending ? null : reply.message},
              'web',
              ${request.clientIp}::inet,
              ${request.userAgent?.slice(0, 500) ?? null}
            )`,
      );

      return { outcome: 'saved' };
    });
  }
}

function toGuestGroup(row: Row): GuestGroup {
  const status = row.status as string | null;

  return {
    id: row.id as string,
    name: row.name as string,
    inviteCode: row.invite_code as string,
    seats: Number(row.seats),
    phone: (row.phone as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    reply:
      status === 'confirmed' || status === 'declined'
        ? {
            status,
            attendees: Number(row.adults_count),
            message: (row.message as string | null) ?? null,
            respondedAt: new Date(row.created_at as string),
          }
        : null,
  };
}
