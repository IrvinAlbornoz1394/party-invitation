import 'server-only';

import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import type { PlatformCredentials } from '@/domain/auth/platform-credentials';
import type {
  ActiveContentLink,
  ContentLinkRepository,
  RedeemContentLinkOutcome,
} from '@/domain/events/content-link';
import { contentLinkToken, hashContentLinkToken, hashSessionToken } from '../auth/credential-hashing';
import { db } from '../db/client';

type LinkRow = {
  readonly id: string;
  readonly expires_at: string | Date;
  readonly opened_at: string | Date | null;
};

const toLink = (row: LinkRow): ActiveContentLink => ({
  id: row.id,
  token: contentLinkToken(row.id),
  expiresAt: new Date(row.expires_at),
  openedAt: row.opened_at === null ? null : new Date(row.opened_at),
});

/**
 * Los enlaces del cliente. La tabla está sellada para la aplicación (plano de auth: guarda hashes
 * de credenciales), así que todo va por funciones SECURITY DEFINER: el admin lee y emite con su
 * sesión de plataforma, y el canje va sin sesión porque quien canjea todavía no la tiene.
 */
export class DrizzleContentLinkRepository implements ContentLinkRepository {
  async findActive(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
  ): Promise<ActiveContentLink | null> {
    const result = await db.execute<LinkRow>(
      sql`select id, expires_at, opened_at
            from app.active_content_link(
              ${hashSessionToken(credentials.sessionToken)},
              ${clientId}::uuid,
              ${eventId}::uuid
            )`,
    );

    const row = result.rows.at(0);
    return row ? toLink(row) : null;
  }

  async issue(input: {
    readonly credentials: PlatformCredentials;
    readonly clientId: string;
    readonly eventId: string;
    readonly expiresAt: Date;
  }): Promise<ActiveContentLink | null> {
    /* El id se elige aquí: el token se deriva de él con AUTH_SECRET, que no vive en la base, y su
       hash tiene que ir en el mismo `insert`. */
    const id = randomUUID();
    const ttlSeconds = Math.max(60, Math.round((input.expiresAt.getTime() - Date.now()) / 1000));

    const result = await db.execute<LinkRow>(
      sql`select id, expires_at, opened_at
            from app.issue_content_link(
              ${hashSessionToken(input.credentials.sessionToken)},
              ${input.clientId}::uuid,
              ${input.eventId}::uuid,
              ${id}::uuid,
              ${hashContentLinkToken(contentLinkToken(id))},
              (${ttlSeconds}::integer * interval '1 second'),
              ${input.credentials.clientIp}::inet
            )`,
    );

    const row = result.rows.at(0);
    return row ? toLink(row) : null;
  }

  async redeem(input: {
    readonly token: string;
    readonly sessionToken: string;
    readonly sessionTtlMs: number;
    readonly ip: string | null;
    readonly userAgent: string | null;
  }): Promise<RedeemContentLinkOutcome> {
    const result = await db.execute<{
      outcome: string;
      event_id: string | null;
      session_expires_at: string | Date | null;
    }>(
      sql`select outcome, event_id, session_expires_at
            from app.redeem_content_link(
              ${hashContentLinkToken(input.token)},
              ${hashSessionToken(input.sessionToken)},
              (${Math.round(input.sessionTtlMs / 1000)}::integer * interval '1 second'),
              ${input.ip}::inet,
              ${input.userAgent}
            )`,
    );

    const row = result.rows.at(0);

    switch (row?.outcome) {
      case 'ok':
        return row.event_id && row.session_expires_at
          ? { outcome: 'ok', eventId: row.event_id, sessionExpiresAt: new Date(row.session_expires_at) }
          : { outcome: 'invalid' };
      case 'expired':
        return { outcome: 'expired' };
      case 'closed':
        return { outcome: 'closed' };
      case 'no-account':
        return { outcome: 'no-account' };
      default:
        return { outcome: 'invalid' };
    }
  }
}
