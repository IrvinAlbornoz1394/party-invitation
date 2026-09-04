import 'server-only';

import { sql } from 'drizzle-orm';
import {
  type Actor,
  type Membership,
  isMembershipRole,
  isPlatformRole,
} from '@/domain/auth/actor';
import type { AuthRepository } from '@/domain/auth/auth-repository';
import { isOtpChannel, resolveDeliveryChannel } from '@/domain/auth/otp-channel';
import type {
  OtpIssueRequest,
  OtpIssueResult,
  OtpVerifyRequest,
  OtpVerifyResult,
} from '@/domain/auth/otp-challenge';
import { hashIdentifier, hashOtpCode, hashSessionToken } from '../auth/credential-hashing';
import { db } from '../db/client';

/**
 * Filas que devuelven las funciones del plano de auth.
 *
 * Son `type` con firma de índice y no `interface` porque `execute()` exige
 * `Record<string, unknown>`: los nombres llegan en snake_case desde SQL, sin pasar por el
 * mapeo de Drizzle.
 */
type BeginIssueRow = {
  status: string;
  user_id: string | null;
  email: string | null;
  name: string | null;
  phone: string | null;
  preferred_channel: string | null;
  [column: string]: unknown;
};

type ActorRow = {
  status?: string;
  user_id: string | null;
  /** NULL para una cuenta de cliente; es lo que decide a qué panel pertenece. */
  platform_role: string | null;
  email: string | null;
  name: string | null;
  [column: string]: unknown;
};

/** Una membresía tal como la agrega `app.resolve_session` en su jsonb. */
type MembershipRow = {
  membership_id: string;
  client_id: string;
  client_name: string;
  event_id: string | null;
  event_title: string | null;
  event_slug: string | null;
  plan_key: string | null;
  role: string;
  label: string | null;
};

/**
 * Implementación del puerto de autenticación contra Postgres.
 *
 * Este adaptador tiene dos responsabilidades y ninguna más:
 *
 *   1. Convertir las credenciales en claro a su HMAC. Es el único lugar del proyecto que
 *      llama a `credential-hashing`, y por eso el resto del código no puede equivocarse
 *      con eso: no tiene acceso.
 *   2. Traducir entre los tipos del dominio y las filas de SQL.
 *
 * Ninguna decisión de seguridad se toma aquí. Los límites, la atomicidad del canje y el
 * uso único del código viven en las funciones SECURITY DEFINER de
 * `db/sql/0001_security.sql`, donde no dependen de que la aplicación las llame en el orden
 * correcto.
 */
export class DrizzleAuthRepository implements AuthRepository {
  /**
   * Emisión en dos llamadas dentro de UNA transacción.
   *
   * La partición existe porque en medio hay una decisión del dominio: por qué canal se
   * entrega el código. Esa regla vive en `resolveDeliveryChannel` y no se duplica en SQL
   * —dos copias de la regla que decide a dónde se manda una credencial acabarían
   * divergiendo—, así que el flujo tiene que salir a TypeScript y volver.
   *
   * La atomicidad no se pierde: `app.begin_otp_issue` toma un cerrojo de aviso de alcance
   * de transacción sobre el identificador, y ese cerrojo dura hasta el `commit`. Dos
   * peticiones simultáneas para el mismo correo se serializan, así que ni se saltan el
   * límite ni pueden dejar dos códigos válidos a la vez.
   */
  async issueOtp(request: OtpIssueRequest): Promise<OtpIssueResult> {
    const identifierHash = hashIdentifier(request.identifier);

    return db.transaction(async (tx) => {
      const begun = await tx.execute<BeginIssueRow>(
        sql`select status, user_id, email, name, phone, preferred_channel
            from app.begin_otp_issue(
              ${request.identifier},
              ${identifierHash},
              ${request.clientIp}::inet
            )`,
      );

      const row = begun.rows.at(0);

      // Sin fila la función no se ejecutó como se espera. Se falla cerrado: negar el
      // acceso ante lo inesperado es la única respuesta correcta en un plano de auth.
      if (!row) return { outcome: 'no-account' };
      if (row.status === 'rate_limited') return { outcome: 'rate-limited' };
      if (row.status !== 'ok' || !row.user_id || !row.email || !row.name) {
        return { outcome: 'no-account' };
      }

      const preferred = isOtpChannel(row.preferred_channel) ? row.preferred_channel : 'email';

      const channel = resolveDeliveryChannel({
        requested: request.requestedChannel,
        preferred,
        hasPhone: row.phone !== null && row.phone.length > 0,
      });

      /*
       * El destino sale de la cuenta, nunca de la petición. Si el destino llegara desde
       * el formulario, cualquiera podría pedir el código de otra persona y hacer que se
       * entregue en su propio teléfono, que es la forma más directa de convertir un
       * sistema de OTP en una toma de cuentas.
       */
      const destination = channel === 'whatsapp' ? (row.phone ?? row.email) : row.email;

      const stored = await tx.execute<{ expires_at: string; [column: string]: unknown }>(
        sql`select app.store_otp_challenge(
              ${row.user_id}::uuid,
              ${request.identifier},
              ${hashOtpCode(request.identifier, request.code)},
              ${channel},
              ${destination},
              (${Math.round(request.ttlMs / 1000)}::integer * interval '1 second'),
              ${request.clientIp}::inet,
              ${request.userAgent}
            ) as expires_at`,
      );

      const expiresAt = stored.rows.at(0)?.expires_at;
      if (!expiresAt) return { outcome: 'no-account' };

      return {
        outcome: 'issued',
        userId: row.user_id,
        name: row.name,
        channel,
        destination,
        expiresAt: new Date(expiresAt),
      };
    });
  }

  async verifyOtp(request: OtpVerifyRequest): Promise<OtpVerifyResult> {
    const result = await db.execute<ActorRow & { session_expires_at: string | null }>(
      sql`select status, user_id, platform_role, email, name, session_expires_at
          from app.verify_otp(
            ${request.identifier},
            ${hashIdentifier(request.identifier)},
            ${hashOtpCode(request.identifier, request.code)},
            ${hashSessionToken(request.sessionToken)},
            (${Math.round(request.sessionTtlMs / 1000)}::integer * interval '1 second'),
            ${request.clientIp}::inet,
            ${request.userAgent}
          )`,
    );

    const row = result.rows.at(0);
    if (!row) return { outcome: 'invalid' };

    switch (row.status) {
      case 'expired':
        return { outcome: 'expired' };
      case 'too_many_attempts':
        return { outcome: 'too-many-attempts' };
      case 'rate_limited':
        return { outcome: 'rate-limited' };
      case 'account_disabled':
        return { outcome: 'account-disabled' };
      case 'ok':
        break;
      default:
        return { outcome: 'invalid' };
    }

    const actor = toActor(row);
    if (actor === null || !row.session_expires_at) return { outcome: 'invalid' };

    return { outcome: 'verified', actor, expiresAt: new Date(row.session_expires_at) };
  }

  async resolveSession(sessionToken: string): Promise<Actor | null> {
    const result = await db.execute<ActorRow & { memberships: unknown }>(
      sql`select user_id, platform_role, email, name, memberships
          from app.resolve_session(${hashSessionToken(sessionToken)})`,
    );

    const row = result.rows.at(0);
    if (!row) return null;

    return toActor(row);
  }

  async revokeSession(sessionToken: string): Promise<void> {
    await db.execute(sql`select app.revoke_session(${hashSessionToken(sessionToken)})`);
  }

}

/**
 * Convierte una fila en un actor del dominio, o null si algo no cuadra.
 *
 * `platform_role` es lo que discrimina la unión: con rol de plataforma sale un
 * `PlatformActor`; sin él, una cuenta de cliente con sus membresías. Antes discriminaba
 * `client_id`, que ya no existe en la identidad.
 *
 * El nombre puede venir NULL —un visor se da de alta con el correo y nada más— así que ya no se
 * exige. El correo sí: es la identidad con la que se pide el código, y una fila sin él no
 * describe a nadie.
 *
 * Los enums se validan aunque vengan de una columna con tipo enum de Postgres. Parece
 * paranoia y no lo es: el día que se añada un valor al enum en la base de datos y no en
 * TypeScript, esta comprobación lo convierte en "sesión no válida" en lugar de en un actor
 * con un rol que ninguna comprobación de permisos reconoce. Un rol desconocido que llega a
 * `hasRoleAtLeast` produciría `undefined >= n`, es decir `false` en todas las
 * comparaciones... o `true` si alguien escribe la comparación al revés. Mejor no llegar
 * ahí.
 */
function toActor(row: ActorRow & { memberships?: unknown }): Actor | null {
  if (!row.user_id || !row.email) return null;

  const identity = { userId: row.user_id, email: row.email, name: row.name } as const;

  if (row.platform_role !== null) {
    if (!isPlatformRole(row.platform_role)) return null;

    /*
     * Una cuenta de plataforma con membresías no debería existir —`db:check` lo verifica— y si
     * existiera, lo peligroso sería tratarla como cuenta de cliente: tendría un tenant propio
     * además del privilegio de ver a todos los demás. Aquí se ignoran: entra a `/admin` y a
     * nada más.
     */
    return { kind: 'platform', ...identity, platformRole: row.platform_role };
  }

  return { kind: 'client', ...identity, memberships: toMemberships(row.memberships) };
}

/**
 * Traduce el jsonb de membresías, descartando en silencio las que no cuadren.
 *
 * Descartar y no fallar la sesión entera es deliberado: una membresía con un rol que esta
 * versión del código no conoce —porque la base de datos ganó un valor en el enum y el
 * despliegue va por detrás— tiene que dejar a la persona entrar a lo que sí se entiende, no
 * dejarla fuera de todo. Lo que no se entiende, no se alcanza.
 */
function toMemberships(value: unknown): readonly Membership[] {
  if (!Array.isArray(value)) return [];

  const memberships: Membership[] = [];

  for (const raw of value as readonly MembershipRow[]) {
    if (!raw?.membership_id || !raw.client_id || !isMembershipRole(raw.role)) continue;

    memberships.push({
      membershipId: raw.membership_id,
      clientId: raw.client_id,
      clientName: raw.client_name ?? '',
      eventId: raw.event_id,
      eventTitle: raw.event_title,
      eventSlug: raw.event_slug,
      planKey: raw.plan_key,
      role: raw.role,
      label: raw.label,
    });
  }

  return memberships;
}
