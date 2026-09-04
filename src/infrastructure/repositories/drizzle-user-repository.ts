import 'server-only';

import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { isMembershipRole, isUserRole } from '@/domain/auth/actor';
import { isOtpChannel } from '@/domain/auth/otp-channel';
import type { ManagedUser } from '@/domain/auth/user-management';
import type {
  EventAccessMember,
  EventAccessSnapshot,
  InviteUserInput,
  InviteUserResult,
  TeamMember,
  TeamSnapshot,
  UserRepository,
} from '@/domain/auth/user-repository';

import { clients, events, memberships, users } from '../db/schema';
import { withTenant } from '../db/tenant';

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

      /*
       * El equipo son las MEMBRESÍAS de alcance cliente, no las identidades: quien tiene
       * acceso a todo el cliente. Las de alcance evento —visores, y `staff` asignado a una
       * sola boda— no salen aquí; son accesos de un evento y se administran desde el evento.
       *
       * `isNull(memberships.eventId)` es por tanto una condición de negocio y no un filtro
       * técnico: sin ella esta pantalla mezclaría a los novios de cada boda con el equipo del
       * organizador.
       *
       * El estado y el rol se leen de la membresía; el correo y el nombre, de la identidad.
       * Ese reparto es todo el cambio del modelo visto desde una consulta.
       */
      const rows = await tx
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          phone: users.phone,
          role: memberships.role,
          status: memberships.status,
          platformRole: users.platformRole,
          preferredChannel: users.preferredOtpChannel,
          lastLoginAt: users.lastLoginAt,
          createdAt: memberships.createdAt,
        })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        // El `where` del cliente es redundante con RLS y va a propósito: si algún día alguien
        // ejecutara esta consulta sin contexto, el resultado sería vacío por las dos vías.
        // Defensa en profundidad barata.
        .where(and(eq(memberships.clientId, clientId), isNull(memberships.eventId)))
        .orderBy(asc(memberships.createdAt));

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
       * Va por `app.grant_membership()` y no por un INSERT propio, y el motivo no es
       * comodidad: crear la IDENTIDAD es una escritura que RLS no puede acotar. Un correo
       * puede alcanzar dos clientes, así que no existe ningún `client_id` con el que decidir
       * quién tiene derecho a crearlo —una política permisiva dejaría a un cliente fabricar
       * identidades ajenas, y una restrictiva impediría invitar a nadie—. Cuando RLS no
       * puede expresar la regla, la aplica una función. Ver la sección 4 de
       * sql/0001_security.sql.
       *
       * La función hace las dos cosas en una transacción: reutiliza la identidad si el correo
       * ya existe, la crea si no, y le añade la membresía —del alcance que diga `eventId`—. A
       * medias quedaría una cuenta capaz de pedir código y entrar a ninguna parte.
       *
       * Ya no hay caso `email-taken`. Que el correo exista en otro cliente dejó de ser un
       * conflicto —se le añade una membresía—, así que la respuesta es la misma que para un
       * correo nuevo y quien invita no averigua nada sobre en qué otros clientes está.
       */
      const granted = await tx.execute<{
        status: string;
        user_id: string | null;
        membership_id: string | null;
      }>(
        sql`select status, user_id, membership_id
              from app.grant_membership(
                ${input.clientId}::uuid,
                ${input.actorUserId}::uuid,
                ${input.eventId}::uuid,
                ${input.email},
                ${input.role},
                ${input.label},
                ${input.name},
                ${input.phone}
              )`,
      );

      const row = granted.rows.at(0);

      switch (row?.status) {
        case 'granted':
          // `user_id` no puede venir null con status `granted`; el fallback es para no
          // ampliar el tipo del resultado por un caso que la función no produce.
          return { outcome: 'invited', userId: row.user_id ?? '' };
        case 'already_member':
          return { outcome: 'already-in-team' };
        case 'already_member_disabled':
          return {
            outcome: 'access-revoked',
            membershipId: row.membership_id ?? '',
            userId: row.user_id ?? '',
          };
        default:
          /*
           * `forbidden`, `role_too_high` y `event_not_found` colapsan en uno. Los candados
           * del dominio ya pararon estos casos con un mensaje explicado, así que llegar aquí
           * significa que algo llamó al repositorio sin pasar por ellos: lo que toca es
           * negarse, no redactar un mensaje para un camino que no debería existir.
           */
          return { outcome: 'rejected' };
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
      /*
       * El rol vive en la membresía, así que cambiarlo es un UPDATE de tenant normal y RLS lo
       * acota. Es la diferencia con invitar: conceder toca la identidad, que no es de nadie;
       * cambiar el rol toca la relación, que sí es del cliente.
       *
       * `isNull(eventId)` acota al equipo: esta pantalla no cambia el rol de un visor.
       */
      await tx
        .update(memberships)
        .set({ role: input.role })
        .where(
          and(
            eq(memberships.userId, input.userId),
            eq(memberships.clientId, input.clientId),
            isNull(memberships.eventId),
          ),
        );

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
      /*
       * Se desactiva la MEMBRESÍA, no la identidad, y esa distinción es la que hace correcto
       * el modelo: quitarle el acceso a alguien en este cliente no puede dejarlo fuera de
       * otro donde también entra. Desactivar la identidad —`users.status`— es una operación de
       * plataforma, no de un cliente.
       */
      await tx
        .update(memberships)
        .set({ status: input.status })
        .where(
          and(
            eq(memberships.userId, input.userId),
            eq(memberships.clientId, input.clientId),
            isNull(memberships.eventId),
          ),
        );

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

  async loadEventAccess(input: {
    readonly clientId: string;
    readonly eventId: string;
  }): Promise<EventAccessSnapshot | null> {
    /*
     * Contexto de CLIENTE, no de evento, y no es comodidad: la política de `users` exige
     * `app.current_event_id() is null` —cierra la tabla entera en contexto de evento, para que
     * quien alcanza una sola boda no pueda enumerar a quién más entra al cliente—. Con el
     * contexto estrechado, esta consulta devolvería las membresías sin un solo correo al lado,
     * que es la única columna por la que la pantalla existe.
     *
     * El filtro por evento pasa entonces al `where`, y eso no lo debilita: la clave ajena
     * compuesta de `memberships` garantiza que un `event_id` de otro cliente no pueda existir en
     * una fila de este, así que filtrar por los dos no es redundancia sino la misma condición
     * escrita donde RLS ya no llega.
     */
    return withTenant(input.clientId, async (tx) => {
      const [event] = await tx
        .select({ title: events.title, clientName: clients.name })
        .from(events)
        .innerJoin(clients, eq(clients.id, events.clientId))
        .where(and(eq(events.id, input.eventId), eq(events.clientId, input.clientId)))
        .limit(1);

      // El evento no es de este cliente, o no existe. Las dos respuestas son la misma a
      // propósito: el id va en la URL, y distinguirlas convertiría la pantalla en un oráculo.
      if (!event) return null;

      const rows = await tx
        .select({
          membershipId: memberships.id,
          userId: users.id,
          email: users.email,
          name: users.name,
          label: memberships.label,
          role: memberships.role,
          status: memberships.status,
          lastLoginAt: users.lastLoginAt,
          createdAt: memberships.createdAt,
        })
        .from(memberships)
        .innerJoin(users, eq(users.id, memberships.userId))
        .where(
          and(eq(memberships.clientId, input.clientId), eq(memberships.eventId, input.eventId)),
        )
        .orderBy(asc(memberships.createdAt));

      const members: EventAccessMember[] = rows.map((row) => ({
        membershipId: row.membershipId,
        userId: row.userId,
        email: row.email,
        name: row.name,
        label: row.label,
        // Un rol que no reconozcamos cae al suelo y no al medio: si el enum creciera algún día,
        // lo peor que puede pasar es que alguien vea de menos.
        role: isMembershipRole(row.role) ? row.role : 'viewer',
        status: row.status,
        lastLoginAt: row.lastLoginAt,
        createdAt: row.createdAt,
      }));

      return { eventTitle: event.title, clientName: event.clientName, members };
    });
  }

  async setEventAccessStatus(input: {
    readonly clientId: string;
    readonly eventId: string;
    readonly membershipId: string;
    readonly userId: string;
    readonly status: 'active' | 'disabled';
    readonly actorUserId: string;
  }): Promise<void> {
    await withTenant(input.clientId, async (tx) => {
      /*
       * Se desactiva UNA membresía: la de este evento. Ni la identidad —esa persona puede ser
       * dueña de otro cliente— ni sus otras membresías. El `eventId` en el `where` es una
       * frontera de seguridad y no un filtro de comodidad: RLS acota a este cliente y ahí se
       * detiene, así que sin esta condición un colaborador podría desactivar desde aquí la
       * membresía del dueño.
       *
       * Se desactiva en vez de borrarse porque `memberships.status` es lo que permite responder
       * quién tuvo acceso a un evento, y porque la bitácora quedaría apuntando a filas que ya no
       * existen.
       */
      await tx
        .update(memberships)
        .set({ status: input.status })
        .where(
          and(
            eq(memberships.id, input.membershipId),
            eq(memberships.clientId, input.clientId),
            eq(memberships.eventId, input.eventId),
          ),
        );

      /*
       * Y **no** se llama a `app.revoke_user_sessions()`, al contrario que `setStatus()`. Esa
       * función hace `update sessions where user_id = …` sin filtrar por cliente: usarla aquí
       * sacaría del sistema entero a alguien por haberle retirado una boda.
       *
       * Tampoco hace falta. `app.resolve_session()` relee las membresías en CADA petición
       * filtrando `m.status <> 'disabled'`, así que la siguiente petición de esa sesión ya no
       * trae el evento y `requireEventAccess()` responde 404. La diferencia con el equipo es
       * real y por eso allí sí se cortan: retirar el acceso al cliente entero deja una sesión
       * abierta con el panel delante hasta que alguien recargue.
       */

      await writeAudit(tx, {
        clientId: input.clientId,
        actorUserId: input.actorUserId,
        action: input.status === 'disabled' ? 'membership.revoked' : 'membership.restored',
        targetUserId: input.userId,
        metadata: { event_id: input.eventId, membership_id: input.membershipId },
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
