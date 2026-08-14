import 'server-only';

import { and, asc, eq, sql } from 'drizzle-orm';
import { isUserRole } from '@/domain/auth/actor';
import { isOtpChannel } from '@/domain/auth/otp-channel';
import type { ManagedUser } from '@/domain/auth/user-management';
import type {
  InviteUserInput,
  InviteUserResult,
  TeamMember,
  TeamSnapshot,
  UserRepository,
} from '@/domain/auth/user-repository';

import { clients, users } from '../db/schema';
import { withTenant } from '../db/tenant';

/** Código de violación de restricción única de Postgres. */
const UNIQUE_VIOLATION = '23505';

/**
 * Implementación del puerto de administración de cuentas.
 *
 * Todo lo que toca datos de un cliente pasa por `withTenant()`, de modo que Row-Level
 * Security filtra aunque una consulta olvidara su `where client_id`. Las dos
 * excepciones son deliberadas y están comentadas donde ocurren: crear un cliente y
 * revocar sesiones son operaciones que RLS bloquearía, y van por funciones SECURITY DEFINER
 * que revalidan lo suyo.
 */
export class DrizzleUserRepository implements UserRepository {
  async loadTeam(clientId: string): Promise<TeamSnapshot> {
    return withTenant(clientId, async (tx) => {
      const [client] = await tx
        .select({ name: clients.name })
        .from(clients)
        .where(eq(clients.id, clientId))
        .limit(1);

      const rows = await tx
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          phone: users.phone,
          role: users.role,
          status: users.status,
          platformRole: users.platformRole,
          preferredChannel: users.preferredOtpChannel,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
        })
        .from(users)
        // El `where` es redundante con RLS y va a propósito: si algún día alguien ejecutara
        // esta consulta sin contexto, el resultado sería vacío por las dos vías. Defensa en
        // profundidad barata.
        .where(eq(users.clientId, clientId))
        .orderBy(asc(users.createdAt));

      const members: TeamMember[] = rows.map((row) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        phone: row.phone,
        role: isUserRole(row.role) ? row.role : 'staff',
        status: row.status,
        hasPlatformRole: row.platformRole !== null,
        preferredChannel: isOtpChannel(row.preferredChannel) ? row.preferredChannel : 'email',
        lastLoginAt: row.lastLoginAt,
        createdAt: row.createdAt,
      }));

      /*
       * Cuentan los dueños que PUEDEN entrar: `active` e `invited`. Un dueño invitado que
       * todavía no ha usado su código sigue siendo capaz de entrar, así que degradar al otro
       * no dejaría el cliente huérfana. Uno `disabled`, en cambio, no cuenta: no puede
       * entrar y no serviría de red de seguridad.
       */
      const activeOwners = members.filter(
        (member) => member.role === 'owner' && member.status !== 'disabled',
      ).length;

      // Si RLS filtrara el cliente, el nombre viene vacío en lugar de reventar: la
      // pantalla sigue siendo usable y el equipo saldría vacío por la misma razón.
      return { clientName: client?.name ?? '', members, activeOwners };
    });
  }

  async invite(input: InviteUserInput): Promise<InviteUserResult> {
    return withTenant(input.clientId, async (tx) => {
      /*
       * Primero se mira dentro del propio equipo. RLS hace que esta consulta solo vea a los
       * de este cliente, así que un resultado aquí significa inequívocamente "ya está
       * contigo" — nunca "existe en otro cliente".
       */
      const [existing] = await tx
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.clientId, input.clientId), eq(users.email, input.email)))
        .limit(1);

      if (existing) return { outcome: 'already-in-team' };

      try {
        /*
         * INSERT escrito a mano en lugar de `tx.insert(users)`, y el motivo es exacto:
         * Drizzle nombra TODAS las columnas de la tabla en la sentencia —las que no recibe
         * valor las manda como `default`—, incluidas `platform_role` y `last_login_at`. El
         * rol de la aplicación tiene INSERT **por columna** y esas dos están revocadas
         * (ver sql/0001_security.sql), así que Postgres rechaza la sentencia entera con
         * "permission denied for table users" aunque no se les esté dando ningún valor.
         *
         * Es el precio de proteger `platform_role` a nivel de columna, y vale la pena: la
         * alternativa sería conceder INSERT sobre la tabla completa y dejar que una pantalla
         * de administración pudiera fabricar superadministradores.
         *
         * `status` nace `invited`: aún no ha entrado nadie. No bloquea el acceso
         * —`app.begin_otp_issue` acepta invitados—, es la marca que permite al panel decir
         * "pendiente de primer acceso", y se promueve a `active` sola en el primer login.
         */
        const inserted = await tx.execute<{ id: string; [column: string]: unknown }>(
          sql`insert into public.users (client_id, email, name, role, phone, status)
              values (
                ${input.clientId}::uuid,
                ${input.email},
                ${input.name},
                ${input.role}::user_role,
                ${input.phone},
                'invited'::user_status
              )
              returning id`,
        );

        const created = inserted.rows.at(0);
        if (!created) return { outcome: 'email-taken' };

        return { outcome: 'invited', userId: created.id };
      } catch (error: unknown) {
        /*
         * El único de `users.email` es GLOBAL, no por cliente. Si el correo pertenece a
         * otro cliente, la comprobación de arriba no lo vio —RLS se lo ocultó— y es aquí
         * donde se descubre. Es la única forma de detectarlo sin darle a la aplicación una
         * vía para leer usuarios de otros clientes, que sería mucho peor.
         */
        if (isUniqueViolation(error)) return { outcome: 'email-taken' };
        throw error;
      }
    });
  }

  async changeRole(input: {
    readonly clientId: string;
    readonly userId: string;
    readonly role: 'owner' | 'admin' | 'staff';
    readonly actorUserId: string;
  }): Promise<void> {
    await withTenant(input.clientId, async (tx) => {
      await tx
        .update(users)
        .set({ role: input.role })
        .where(and(eq(users.id, input.userId), eq(users.clientId, input.clientId)));

      await writeAudit(tx, {
        clientId: input.clientId,
        actorUserId: input.actorUserId,
        action: 'user.role.changed',
        targetUserId: input.userId,
        metadata: { role: input.role },
      });
    });
  }

  async setStatus(input: {
    readonly clientId: string;
    readonly userId: string;
    readonly status: ManagedUser['status'];
    readonly actorUserId: string;
  }): Promise<void> {
    await withTenant(input.clientId, async (tx) => {
      await tx
        .update(users)
        .set({ status: input.status })
        .where(and(eq(users.id, input.userId), eq(users.clientId, input.clientId)));

      /*
       * Desactivar tiene que cortar las sesiones abiertas, o el cambio no surtiría efecto
       * hasta que vencieran —hasta 30 días—. Va en la MISMA transacción que el cambio de
       * estado: si se hicieran por separado y algo fallara en medio, quedaría una cuenta
       * marcada como desactivada con su sesión todavía viva, que es el peor de los dos
       * mundos porque la interfaz diría que ya no tiene acceso.
       *
       * `sessions` está sellada para el rol de la aplicación, así que se pasa por la función
       * SECURITY DEFINER, que además revalida que esa cuenta sea de este cliente.
       */
      if (input.status === 'disabled') {
        await tx.execute(
          sql`select app.revoke_user_sessions(
                ${input.clientId}::uuid,
                ${input.userId}::uuid,
                ${input.actorUserId}::uuid
              )`,
        );
      }

      await writeAudit(tx, {
        clientId: input.clientId,
        actorUserId: input.actorUserId,
        action: input.status === 'disabled' ? 'user.disabled' : 'user.status.changed',
        targetUserId: input.userId,
        metadata: { status: input.status },
      });
    });
  }

}

/**
 * Escribe en la bitácora dentro de la transacción que hizo el cambio.
 *
 * Va en la misma transacción a propósito: si el cambio se confirma, su registro también, y
 * si algo revienta no queda una entrada de auditoría que describe algo que no llegó a pasar.
 */
async function writeAudit(
  tx: { execute: (query: ReturnType<typeof sql>) => Promise<unknown> },
  entry: {
    readonly clientId: string;
    readonly actorUserId: string;
    readonly action: string;
    readonly targetUserId: string;
    readonly metadata: Record<string, unknown>;
  },
): Promise<void> {
  await tx.execute(
    sql`insert into public.audit_log
          (client_id, user_id, action, entity_type, entity_id, metadata)
        values (
          ${entry.clientId}::uuid,
          ${entry.actorUserId}::uuid,
          ${entry.action},
          'user',
          ${entry.targetUserId}::uuid,
          ${JSON.stringify(entry.metadata)}::jsonb
        )`,
  );
}

/**
 * Distingue un choque de índice único de cualquier otro fallo.
 *
 * Dos detalles que costaron un error 500 antes de estar bien:
 *
 * **Se recorre la cadena de `cause`.** Drizzle no propaga el error de `pg` tal cual: lo
 * envuelve en un `DrizzleQueryError` que lleva la consulta y los parámetros, y deja el
 * original en `cause`. Mirando solo el nivel superior, el `23505` nunca aparece y el caso
 * "ese correo ya tiene cuenta en otro cliente" acaba como fallo del servidor en lugar de
 * como mensaje explicado.
 *
 * **Se compara el `code`, no el mensaje.** Los textos de Postgres cambian con la versión y
 * con el idioma del servidor —este proyecto se desarrolla contra uno en español—, así que
 * compararlos sería una condición que se rompe sola.
 */
function isUniqueViolation(error: unknown): boolean {
  // Tope de profundidad por si alguna capa construyera una cadena cíclica de causas.
  for (let current = error, depth = 0; current != null && depth < 5; depth += 1) {
    if (typeof current !== 'object') break;

    if ('code' in current && (current as { code?: unknown }).code === UNIQUE_VIOLATION) {
      return true;
    }

    current = (current as { cause?: unknown }).cause;
  }

  return false;
}
