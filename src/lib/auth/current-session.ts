import 'server-only';

import { cache } from 'react';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import type { Actor, ClientActor, PlatformActor } from '@/domain/auth/actor';
import { canAdministerPlatform, isClientActor } from '@/domain/auth/actor';
import type { PlatformCredentials } from '@/domain/auth/platform-credentials';
import { resolveSession } from '@/infrastructure/container';
import { clientIpFromHeaders } from '@/lib/request-ip';
import { readSessionCookie } from './session-cookie';

/**
 * Punto de entrada de la autenticación para la capa de presentación.
 *
 * Cualquier ruta que necesite saber quién está pidiendo la página pasa por aquí. Es lo que
 * mantiene la comprobación en un solo sitio: si cada layout resolviera la cookie por su
 * cuenta, la diferencia entre "esta ruta valida la sesión" y "esta se le olvidó" sería
 * invisible al leer el código.
 *
 * Hay tres puertas y cada una devuelve un tipo distinto:
 *
 * - `requireActor()` — hay sesión, de la clase que sea. La usa `/acceso` para decidir a
 *   dónde mandar a quien ya entró.
 * - `requireClientActor()` — la frontera de `/panel`.
 * - `requirePlatformAdmin()` — la frontera de `/admin`.
 *
 * Que devuelvan tipos distintos es lo que hace que la frontera no se pueda olvidar: una
 * pantalla de `/panel` necesita `clientId` para consultar nada, y `clientId` solo existe en
 * el tipo que devuelve `requireClientActor()`.
 */

/**
 * `cache()` de React deduplica la llamada dentro de una misma petición.
 *
 * Importa más de lo que parece. Un layout, la página que contiene y tres componentes que
 * necesiten el actor harían cinco viajes a la base de datos —y cinco `update` de
 * `last_used_at`, porque `app.resolve_session` escribe— para resolver el mismo token. Con
 * la memoización es uno.
 */
export const getCurrentActor = cache(async (): Promise<Actor | null> => {
  const token = await readSessionCookie();

  return resolveSession.execute(token);
});

/**
 * Redirige a la pantalla de acceso si no hay sesión.
 *
 * Devuelve `Actor` sin `| null`, y ese detalle de tipos es la mitad del valor: después de
 * llamar a esto, el compilador ya no permite tratar el caso "sin sesión", así que no hay
 * forma de renderizar media pantalla del panel para alguien que no entró.
 *
 * `redirect()` lanza una excepción interna de Next que nunca hay que capturar; por eso esta
 * función no vuelve nunca cuando no hay sesión.
 */
export async function requireActor(): Promise<Actor> {
  const actor = await getCurrentActor();

  if (actor === null) {
    /*
     * No se añade `?next=` con la ruta que se quería abrir. Un parámetro de redirección es
     * un vector de redirección abierta clásico —`/acceso?next=https://otro-sitio`— y
     * validarlo bien es más difícil de lo que parece. Hay una sola pantalla de entrada;
     * volver a ella y aterrizar en el inicio del panel que toque es un coste pequeño frente
     * a mantener ese parámetro seguro para siempre.
     */
    redirect('/acceso');
  }

  return actor;
}

/**
 * La frontera de `/panel`: exige una cuenta de cliente.
 *
 * Una cuenta de plataforma que pida una URL de `/panel` recibe un 404, no un redirect a
 * `/admin`. Es deliberado, aunque parezca menos amable: `/panel/eventos/<id>` de un cliente
 * cualquiera no significa nada para una cuenta de plataforma —esa pantalla vive en
 * `/admin`— y redirigir a la raíz sería llevarla a un sitio que no pidió. El 404 dice lo
 * que pasa: aquí no hay nada para ti.
 */
export async function requireClientActor(): Promise<ClientActor> {
  const actor = await requireActor();

  if (!isClientActor(actor)) notFound();

  return actor;
}

/**
 * La frontera de `/admin`: exige rol de plataforma.
 *
 * Responde 404 y no 403 por el mismo motivo que el resto del producto no distingue sus
 * fallos: un 403 confirma que la ruta existe. Para una cuenta de cliente que teclee
 * `/admin/clientes`, el panel de plataforma sencillamente no está ahí.
 */
export async function requirePlatformAdmin(): Promise<PlatformActor> {
  const actor = await requireActor();

  if (!canAdministerPlatform(actor) || actor.kind !== 'platform') notFound();

  return actor;
}

/**
 * Lo que necesita una operación de plataforma: el actor, su token y la IP.
 *
 * El token viaja porque las funciones de la base de datos lo exigen —ver
 * `domain/auth/platform-credentials.ts`—. Se arma aquí, en un solo sitio, para que ninguna
 * pantalla tenga que acordarse de leer la cookie por su cuenta.
 */
export async function requirePlatformCredentials(): Promise<PlatformCredentials> {
  const actor = await requirePlatformAdmin();
  const sessionToken = await readSessionCookie();

  // No puede ser null: `requirePlatformAdmin` acaba de resolver una sesión a partir de esta
  // misma cookie. Se comprueba igual porque el tipo lo permite, y porque tratar el caso
  // imposible con un redirect es más barato que un `!` que algún día deje de ser cierto.
  if (sessionToken === null) redirect('/acceso');

  return { actor, sessionToken, clientIp: await getRequestIp() };
}

/**
 * La IP de la petición, memoizada por el mismo motivo que el actor.
 *
 * Se lee una sola vez porque cada llamada implica resolver las cabeceras, y porque los
 * límites de intentos cuentan por IP: leerla dos veces no duplicaría el conteo, pero
 * tenerla en un solo sitio evita que dos caminos la extraigan con criterios distintos.
 */
export const getRequestIp = cache(async (): Promise<string | null> =>
  clientIpFromHeaders(await headers()),
);

/** User agent de la petición, para el rastro de la sesión y de los intentos. */
export const getRequestUserAgent = cache(async (): Promise<string | null> => {
  const value = (await headers()).get('user-agent');

  // Se recorta porque es una cabecera que envía el cliente y puede venir enorme. La columna
  // es `text` y aguantaría, pero guardar kilobytes de basura por intento fallido es una vía
  // barata de inflar la base de datos.
  return value ? value.slice(0, 512) : null;
});

/** A dónde va cada clase de cuenta después de entrar. */
export function homePathFor(actor: Actor): string {
  return actor.kind === 'platform' ? '/admin' : '/panel';
}
