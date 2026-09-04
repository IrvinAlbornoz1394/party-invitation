import 'server-only';

import { sql } from 'drizzle-orm';
import type { PlatformCredentials } from '@/domain/auth/platform-credentials';
import type {
  ClientProfile,
  ClientRepository,
  ClientSummary,
  CreateClientResult,
  NewClient,
} from '@/domain/clients/client-repository';
import { hashSessionToken } from '../auth/credential-hashing';
import { db } from '../db/client';
import { clients } from '../db/schema';
import { withTenant } from '../db/tenant';

type ClientRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  contact_email: string | null;
  contact_phone: string | null;
  event_count: string;
  created_at: string;
  [column: string]: unknown;
};

type CreateRow = {
  status: string;
  client_id: string | null;
  user_id: string | null;
  [column: string]: unknown;
};

/**
 * Los clientes, contra Postgres.
 *
 * Las dos operaciones van por funciones SECURITY DEFINER y no por Drizzle, y no es por
 * comodidad: Row-Level Security impide leer más de un cliente a la vez, y el rol de la
 * aplicación no tiene INSERT sobre `clients` —crear tenants es una operación de
 * plataforma—. Las funciones son la única vía, y cada una revalida el privilegio contra la
 * base de datos a partir del hash del token.
 *
 * Este adaptador no decide nada. Si alguien llegara aquí con una sesión que no es de
 * plataforma, la respuesta es una lista vacía o `forbidden`, según la operación, porque
 * eso es lo que devuelve la función de abajo.
 */
export class DrizzleClientRepository implements ClientRepository {
  async listAll(credentials: PlatformCredentials): Promise<readonly ClientSummary[]> {
    const result = await db.execute<ClientRow>(
      sql`select id, name, slug, status, contact_email, contact_phone, event_count, created_at
          from app.list_clients_for_platform(${hashSessionToken(credentials.sessionToken)})`,
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      // `count()` de Postgres es bigint y el driver lo entrega como cadena para no perder
      // precisión. Aquí cabe de sobra en un number, pero la conversión tiene que ser
      // explícita o la columna acabaría ordenándose como texto.
      eventCount: Number(row.event_count),
      createdAt: new Date(row.created_at),
    }));
  }

  async findOwn(clientId: string): Promise<ClientProfile | null> {
    return withTenant(clientId, async (tx) => {
      // Sin `where`: la política de RLS ya deja exactamente una fila visible, la del
      // contexto. Añadir la condición haría creer que el aislamiento viene de ahí.
      const rows = await tx
        .select({ id: clients.id, name: clients.name, status: clients.status })
        .from(clients)
        .limit(1);

      return rows.at(0) ?? null;
    });
  }

  async create(
    credentials: PlatformCredentials,
    input: NewClient,
  ): Promise<CreateClientResult> {
    const result = await db.execute<CreateRow>(
      sql`select status, client_id, user_id
          from app.create_client(
            ${hashSessionToken(credentials.sessionToken)},
            ${input.name},
            ${input.slug},
            ${input.contactEmail},
            ${input.contactPhone},
            ${input.ownerName},
            ${credentials.clientIp}::inet
          )`,
    );

    const row = result.rows.at(0);

    // Sin fila, la función no se ejecutó como se espera. Se falla cerrado: ante lo
    // inesperado, no crear nada es siempre la respuesta correcta.
    if (!row) return { outcome: 'forbidden' };

    switch (row.status) {
      case 'created':
        if (!row.client_id || !row.user_id) return { outcome: 'forbidden' };

        return { outcome: 'created', clientId: row.client_id, userId: row.user_id };
      case 'slug_taken':
        return { outcome: 'slug-taken' };
      case 'email_taken':
        return { outcome: 'email-taken' };
      case 'invalid_email':
        return { outcome: 'invalid-email' };
      default:
        return { outcome: 'forbidden' };
    }
  }
}
