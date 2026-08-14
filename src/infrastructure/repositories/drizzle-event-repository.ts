import 'server-only';

import { asc, eq, sql } from 'drizzle-orm';
import type { PlatformCredentials } from '@/domain/auth/platform-credentials';
import type { EventRepository, EventSummary } from '@/domain/events/event-repository';
import { hashSessionToken } from '../auth/credential-hashing';
import { db } from '../db/client';
import { events } from '../db/schema';
import { withAuthorizedClientContext, withTenant } from '../db/tenant';

type PlatformEventRow = {
  id: string;
  client_id: string;
  client_name: string;
  title: string;
  slug: string;
  status: string;
  starts_at: string;
  plan_key: string;
  access_code: string;
  [column: string]: unknown;
};

/**
 * Los eventos, contra Postgres.
 *
 * Los dos caminos son distintos a propósito:
 *
 * - `listForClient` consulta la tabla con Drizzle dentro de `withTenant()`, con Row-Level
 *   Security haciendo el filtrado. No lleva `where clientId` — y no es un olvido: si lo
 *   llevara, el aislamiento parecería venir de esa condición, cuando en realidad viene de
 *   la política. Lo que protege es que sin contexto la consulta no devuelve NADA.
 * - `listAllForPlatform` va por la función SECURITY DEFINER, que es la única forma de
 *   cruzar tenants y comprueba el privilegio contra la base de datos.
 */
export class DrizzleEventRepository implements EventRepository {
  async listForClient(clientId: string): Promise<readonly EventSummary[]> {
    return withTenant(clientId, async (tx) => {
      const rows = await tx
        .select({
          id: events.id,
          clientId: events.clientId,
          title: events.title,
          slug: events.slug,
          status: events.status,
          startsAt: events.startsAt,
          planKey: events.planKey,
          accessCode: events.accessCode,
        })
        .from(events)
        .orderBy(asc(events.startsAt));

      return rows.map((row) => ({ ...row, clientName: null }));
    });
  }

  async listForClientAsPlatform(
    credentials: PlatformCredentials,
    clientId: string,
  ): Promise<readonly EventSummary[] | null> {
    return withAuthorizedClientContext(
      hashSessionToken(credentials.sessionToken),
      clientId,
      async (tx) => {
        const rows = await tx
          .select({
            id: events.id,
            clientId: events.clientId,
            title: events.title,
            slug: events.slug,
            status: events.status,
            startsAt: events.startsAt,
            planKey: events.planKey,
            accessCode: events.accessCode,
          })
          .from(events)
          .orderBy(asc(events.startsAt));

        return rows.map((row) => ({ ...row, clientName: null }));
      },
    );
  }

  async listAllForPlatform(
    credentials: PlatformCredentials,
  ): Promise<readonly EventSummary[]> {
    const result = await db.execute<PlatformEventRow>(
      sql`select id, client_id, client_name, title, slug, status, starts_at, plan_key, access_code
          from app.list_events_for_platform(${hashSessionToken(credentials.sessionToken)})`,
    );

    return result.rows.map((row) => ({
      id: row.id,
      clientId: row.client_id,
      clientName: row.client_name,
      title: row.title,
      slug: row.slug,
      status: row.status,
      startsAt: new Date(row.starts_at),
      planKey: row.plan_key,
      accessCode: row.access_code,
    }));
  }
}

/**
 * Un evento concreto dentro de un cliente ya autorizado.
 *
 * Se exporta aparte del puerto porque lo usan las dos caras: `/panel` con el `clientId` de
 * su propia sesión y `/admin` con uno que `app.authorize_client_context` acaba de
 * autorizar. La consulta es la misma en los dos casos, y que lo sea es la propiedad
 * importante: el panel de plataforma ve exactamente lo que ve el cliente.
 */
export async function findEventInClient(
  clientId: string,
  eventId: string,
): Promise<EventSummary | null> {
  return withTenant(clientId, async (tx) => {
    const row = await tx
      .select({
        id: events.id,
        clientId: events.clientId,
        title: events.title,
        slug: events.slug,
        status: events.status,
        startsAt: events.startsAt,
        planKey: events.planKey,
        accessCode: events.accessCode,
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    const found = row.at(0);

    return found ? { ...found, clientName: null } : null;
  });
}
