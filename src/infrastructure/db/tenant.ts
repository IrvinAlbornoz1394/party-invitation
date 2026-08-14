import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, type Database } from './client';

/** Transacción de Drizzle. Es lo que reciben los callbacks con contexto de tenant. */
export type TenantTransaction = Parameters<Parameters<Database['transaction']>[0]>[0];

const uuidSchema = z.uuid();

/**
 * Ejecuta trabajo con el contexto de tenant fijado, de forma que Row-Level Security
 * pueda filtrar por él.
 *
 * Por qué una transacción: `set_config(..., true)` fija la variable de forma LOCAL a
 * la transacción, así que se descarta al terminar. Eso importa con un pool: sin el
 * `true`, la variable quedaría pegada a la conexión y la siguiente petición —de otro
 * cliente— heredaría el contexto del anterior. Ese sería exactamente el bug de fuga
 * entre tenants que RLS pretende evitar.
 *
 * El id se valida como UUID antes de enviarse. Además va como parámetro y no
 * interpolado, porque `SET LOCAL` no acepta parámetros y `set_config()` sí.
 *
 * Este helper es para el camino de un CLIENTE, donde el tenant sale de su propia sesión y
 * no puede ser otro. El panel de plataforma usa `withAuthorizedClientContext()`, y el
 * camino público de las invitaciones no pasa por ninguno de los dos: va por
 * `DrizzleInvitationRepository`, que obtiene el contexto validando slug y código.
 */
export async function withTenant<T>(
  clientId: string,
  fn: (tx: TenantTransaction) => Promise<T>,
): Promise<T> {
  const parsed = uuidSchema.safeParse(clientId);
  if (!parsed.success) {
    throw new Error('withTenant requiere un client_id con formato UUID');
  }

  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.current_client_id', ${parsed.data}, true)`);
    return fn(tx);
  });
}

/**
 * Igual, pero para el panel de plataforma: primero pide permiso, después fija el contexto.
 *
 * Es lo que sustituyó a la impersonación. Antes, el superadministrador cambiaba el cliente
 * activo de su SESIÓN y a partir de ahí todo lo que hiciera —hasta que volviera a
 * cambiarlo— ocurría dentro de ese cliente. Aquí el contexto dura una transacción.
 *
 * Las dos cosas van en la MISMA transacción, y ese detalle es el que sostiene la
 * propiedad. Si la autorización se pidiera en una conexión y el contexto se fijara en
 * otra, entre las dos habría una ventana: bastaría con que el cliente se suspendiera en
 * medio, o con que alguien reordenara las llamadas al refactorizar, para acabar
 * trabajando dentro de un cliente que la base de datos ya no autoriza.
 *
 * Devuelve `null` cuando no se autoriza —sesión que no es de plataforma, cliente
 * inexistente o suspendido— en lugar de lanzar. Quien llama tiene que decidir qué enseña,
 * y en el panel de plataforma eso es un 404: exactamente lo mismo que ve quien pide un
 * cliente que no existe, así que la respuesta no distingue "no existe" de "no puedes".
 */
export async function withAuthorizedClientContext<T>(
  sessionTokenHash: string,
  clientId: string,
  fn: (tx: TenantTransaction) => Promise<T>,
): Promise<T | null> {
  const parsed = uuidSchema.safeParse(clientId);
  if (!parsed.success) return null;

  return db.transaction(async (tx) => {
    const authorized = await tx.execute<{ ok: boolean; [column: string]: unknown }>(
      sql`select app.authorize_client_context(${sessionTokenHash}, ${parsed.data}::uuid) as ok`,
    );

    if (authorized.rows.at(0)?.ok !== true) return null;

    await tx.execute(sql`select set_config('app.current_client_id', ${parsed.data}, true)`);

    return fn(tx);
  });
}
