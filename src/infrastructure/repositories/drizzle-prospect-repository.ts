import 'server-only';

import { sql } from 'drizzle-orm';
import type { PlatformCredentials } from '@/domain/auth/platform-credentials';
import {
  isProspectStatus,
  type Prospect,
  type ProspectForm,
  type ProspectStatus,
  type TouchChannel,
} from '@/domain/prospects/prospect';
import type {
  ProspectRepository,
  ProspectTouch,
  SubmitProspectResult,
} from '@/domain/prospects/prospect-repository';
import { hashSessionToken } from '../auth/credential-hashing';
import { db } from '../db/client';

/**
 * Implementación del puerto de prospectos.
 *
 * **Ninguna consulta de este archivo toca las tablas directamente**, y no es una preferencia de
 * estilo: el rol de la aplicación no tiene ningún permiso sobre `prospects` ni sobre
 * `prospect_touches`, así que un `select` normal fallaría con «permission denied». Todo pasa por
 * funciones `SECURITY DEFINER`.
 *
 * El motivo está en `docs/PROSPECTOS.md`: es la única tabla con escritura anónima y sus filas son
 * datos de contacto de terceros. Que el rol de la aplicación no pueda ni leerlas hace imposible
 * que el panel de un cliente saque los teléfonos de los prospectos por una consulta mal escrita —
 * y eso deja de depender de que nadie escriba esa consulta.
 *
 * Las funciones de lectura reciben el **hash del token**, no un id de usuario. Con un id bastaría
 * con que un camino nuevo construyera un actor a mano para leer la lista entera de contactos.
 */
export class DrizzleProspectRepository implements ProspectRepository {
  async submit(form: ProspectForm, clientIp: string | null): Promise<SubmitProspectResult> {
    const result = await db.execute<{ status: string; prospect_id: string | null }>(
      sql`select status, prospect_id
            from app.submit_prospect(
              ${form.contactName},
              ${form.contactPhone},
              ${form.contactEmail},
              ${form.eventTypeKey},
              ${form.eventDate}::date,
              ${form.guestRange},
              ${form.templateKey},
              ${form.planKey},
              ${form.message},
              ${clientIp}::inet
            )`,
    );

    switch (result.rows.at(0)?.status) {
      case 'received':
        return { outcome: 'received' };
      case 'rate_limited':
        return { outcome: 'rate-limited' };
      default:
        return { outcome: 'invalid' };
    }
  }

  async list(credentials: PlatformCredentials): Promise<readonly Prospect[]> {
    const result = await db.execute<ProspectRow>(
      sql`select * from app.list_prospects_for_platform(${hashSessionToken(credentials.sessionToken)})`,
    );

    return result.rows.map(toProspect);
  }

  async countPending(credentials: PlatformCredentials): Promise<number> {
    const result = await db.execute<{ n: number }>(
      sql`select app.count_pending_prospects(${hashSessionToken(credentials.sessionToken)}) as n`,
    );

    return Number(result.rows.at(0)?.n ?? 0);
  }

  async listTouches(
    credentials: PlatformCredentials,
    prospectId: string,
  ): Promise<readonly ProspectTouch[]> {
    const result = await db.execute<{
      id: string;
      channel: string;
      note: string;
      created_at: string;
      author_email: string | null;
    }>(
      sql`select * from app.list_prospect_touches(
            ${hashSessionToken(credentials.sessionToken)}, ${prospectId}::uuid)`,
    );

    return result.rows.map((row) => ({
      id: row.id,
      channel: row.channel as TouchChannel,
      note: row.note,
      createdAt: new Date(row.created_at),
      authorEmail: row.author_email,
    }));
  }

  async recordTouch(input: {
    readonly credentials: PlatformCredentials;
    readonly prospectId: string;
    readonly channel: TouchChannel;
    readonly note: string;
    readonly status: ProspectStatus | null;
    readonly nextFollowUpAt: Date | null;
    readonly lostReason: string | null;
  }): Promise<boolean> {
    const result = await db.execute<{ r: string }>(
      sql`select app.record_prospect_touch(
            ${hashSessionToken(input.credentials.sessionToken)},
            ${input.prospectId}::uuid,
            ${input.channel},
            ${input.note},
            ${input.status},
            ${input.nextFollowUpAt?.toISOString() ?? null}::timestamptz,
            ${input.lostReason}
          ) as r`,
    );

    return result.rows.at(0)?.r === 'recorded';
  }

  async linkToClient(input: {
    readonly credentials: PlatformCredentials;
    readonly prospectId: string;
    readonly clientId: string;
  }): Promise<boolean> {
    const result = await db.execute<{ r: string }>(
      sql`select app.link_prospect_to_client(
            ${hashSessionToken(input.credentials.sessionToken)},
            ${input.prospectId}::uuid,
            ${input.clientId}::uuid
          ) as r`,
    );

    return result.rows.at(0)?.r === 'linked';
  }
}

interface ProspectRow {
  id: string;
  contact_name: string;
  contact_email: string | null;
  contact_phone: string;
  event_type_key: string | null;
  event_date: string | null;
  guest_range: string | null;
  template_key: string | null;
  plan_key: string | null;
  message: string | null;
  status: string;
  next_follow_up_at: string | null;
  lost_reason: string | null;
  client_id: string | null;
  client_name: string | null;
  created_at: string;
  last_touch_at: string | null;
  touch_count: number;
  [column: string]: unknown;
}

/**
 * Traduce una fila al dominio.
 *
 * El estado se valida aunque venga de una columna con tipo enum de Postgres, por lo mismo que en
 * el resto del proyecto: si algún día la base gana un valor que TypeScript no conoce, cae en `new`
 * —el más inofensivo, porque solo significa «sin atender»— en vez de convertirse en un estado que
 * ninguna comprobación reconoce.
 */
function toProspect(row: ProspectRow): Prospect {
  return {
    id: row.id,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    eventTypeKey: row.event_type_key,
    eventDate: row.event_date,
    guestRange: row.guest_range,
    templateKey: row.template_key,
    planKey: row.plan_key,
    message: row.message,
    createdAt: new Date(row.created_at),
    status: isProspectStatus(row.status) ? row.status : 'new',
    nextFollowUpAt: row.next_follow_up_at ? new Date(row.next_follow_up_at) : null,
    lostReason: row.lost_reason,
    clientId: row.client_id,
    clientName: row.client_name,
    lastTouchAt: row.last_touch_at ? new Date(row.last_touch_at) : null,
    touchCount: Number(row.touch_count ?? 0),
  };
}
