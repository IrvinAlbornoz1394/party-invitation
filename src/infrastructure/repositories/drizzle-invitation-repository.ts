import { eq, sql } from 'drizzle-orm';
import type {
  InvitationAccessRequest,
  InvitationAccessResult,
} from '@/domain/events/invitation';
import type { InvitationRepository } from '@/domain/events/invitation-repository';
import { db } from '../db/client';
import { events } from '../db/schema';

/**
 * Forma de la fila que devuelve `app.resolve_invitation_access()`.
 *
 * Es un `type` con firma de índice y no una `interface` porque `tx.execute()` exige
 * `Record<string, unknown>`: los nombres vienen en snake_case desde SQL sin pasar por
 * el mapeo de Drizzle.
 */
type AccessRow = {
  event_id: string | null;
  client_id: string | null;
  rate_limited: boolean;
  [column: string]: unknown;
};

/**
 * Implementación del puerto contra Postgres.
 *
 * Toda la lógica sensible —límite por IP, verificación de slug y código, registro del
 * intento— vive en `app.resolve_invitation_access()`, una función SECURITY DEFINER.
 * Esta clase es un adaptador: traduce entre el tipo del dominio y el resultado de la
 * base de datos, y no toma ninguna decisión de seguridad por su cuenta.
 */
export class DrizzleInvitationRepository implements InvitationRepository {
  async findForAccess(request: InvitationAccessRequest): Promise<InvitationAccessResult> {
    return db.transaction(async (tx) => {
      const resolved = await tx.execute<AccessRow>(
        sql`select event_id, client_id, rate_limited
            from app.resolve_invitation_access(${request.slug}, ${request.code}, ${request.clientIp}::inet)`,
      );

      const access = resolved.rows.at(0);
      if (!access) return { outcome: 'denied' };
      if (access.rate_limited) return { outcome: 'rate-limited' };
      if (!access.event_id || !access.client_id) return { outcome: 'denied' };

      /*
       * A partir de aquí ya hay contexto de tenant. Se fija con alcance de transacción
       * para que RLS filtre la lectura siguiente: aunque este SELECT no llevara un
       * WHERE por cliente, Postgres solo devolvería filas de la que corresponde.
       */
      await tx.execute(
        sql`select set_config('app.current_client_id', ${access.client_id}, true)`,
      );

      const [row] = await tx
        .select({
          id: events.id,
          clientId: events.clientId,
          slug: events.slug,
          title: events.title,
          celebrantName: events.celebrantName,
          celebrantFullName: events.celebrantFullName,
          celebrantLastName: events.celebrantLastName,
          eventTypeLabel: events.eventTypeLabel,
          tagline: events.tagline,
          startsAt: events.startsAt,
          timeZone: events.timeZone,
          city: events.city,
          storyImageUrl: events.storyImageUrl,
        })
        .from(events)
        .where(eq(events.id, access.event_id))
        .limit(1);

      // Si RLS filtrara la fila, el acceso se deniega en lugar de romper: significaría
      // que el contexto y el evento no concuerdan, y eso nunca debe servirse.
      if (!row) return { outcome: 'denied' };

      return { outcome: 'granted', invitation: row };
    });
  }
}
