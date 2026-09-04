import 'server-only';

import { cache } from 'react';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import type {
  Actor,
  ClientAccount,
  ClientActor,
  Membership,
  PlatformActor,
} from '@/domain/auth/actor';
import {
  canAdministerPlatform,
  clientScopedMemberships,
  isClientAccount,
  membershipForEvent,
  scopeFromMembership,
} from '@/domain/auth/actor';
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
 * - `requireClientAccount()` — la frontera de `/panel`: hay cuenta de cliente.
 * - `requireClientScope()` — además, con qué cliente se trabaja.
 * - `requireEventAccess(id)` — además, que ese evento se alcance.
 * - `requirePlatformAdmin()` — la frontera de `/admin`.
 *
 * Que devuelvan tipos distintos es lo que hace que la frontera no se pueda olvidar: una
 * pantalla de `/panel` necesita `clientId` para consultar nada, y `clientId` no existe en la
 * cuenta —solo en el `ClientActor` que devuelven `requireClientScope()` y `requireEventAccess()`
 * después de autorizar—. Pedir datos sin haber autorizado un alcance no compila.
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
/**
 * A dónde mandar a quien no tiene sesión, recordando a dónde iba.
 *
 * Sin el parámetro, entrar por un enlace directo —el que le llega al cliente por correo para
 * llenar su invitación— acababa siempre en el inicio del panel: la persona hacía login y tenía
 * que volver a buscar su evento. Con él, el flujo es el que todo el mundo espera: pides una
 * dirección, te piden identificarte, y al identificarte llegas a la dirección que pediste.
 *
 * El nombre del parámetro va en español como el resto de las URL del sitio.
 */
export function loginPathFor(returnTo?: string | null): string {
  const safe = safeReturnTo(returnTo);

  return safe === null ? '/acceso' : `/acceso?volver=${encodeURIComponent(safe)}`;
}

/**
 * La dirección de vuelta, si se puede confiar en ella.
 *
 * Solo rutas **de este sitio**: una que empiece por `/` y no por `//`. Es la protección contra el
 * redirect abierto, que es el fallo clásico de este patrón — con `?volver=https://otro-sitio` se
 * manda a alguien recién identificado a una copia de la pantalla de acceso, y ahí es donde se
 * regalan las credenciales.
 *
 * `//evil.com` merece la mención aparte porque **es** una URL absoluta con esquema heredado, y a
 * ojo parece una ruta del sitio. Es la comprobación que se olvida.
 */
export function safeReturnTo(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;

  return value;
}

export async function requireActor(returnTo?: string): Promise<Actor> {
  const actor = await getCurrentActor();

  if (actor === null) {
    /*
     * No se añade `?next=` con la ruta que se quería abrir. Un parámetro de redirección es
     * un vector de redirección abierta clásico —`/acceso?next=https://otro-sitio`— y
     * validarlo bien es más difícil de lo que parece. Hay una sola pantalla de entrada;
     * volver a ella y aterrizar en el inicio del panel que toque es un coste pequeño frente
     * a mantener ese parámetro seguro para siempre.
     */
    redirect(loginPathFor(returnTo));
  }

  return actor;
}

/**
 * La frontera de `/panel`: exige una cuenta de cliente, sin resolver todavía qué alcanza.
 *
 * Una cuenta de plataforma que pida una URL de `/panel` recibe un 404, no un redirect a
 * `/admin`. Es deliberado, aunque parezca menos amable: `/panel/eventos/<id>` de un cliente
 * cualquiera no significa nada para una cuenta de plataforma —esa pantalla vive en
 * `/admin`— y redirigir a la raíz sería llevarla a un sitio que no pidió. El 404 dice lo
 * que pasa: aquí no hay nada para ti.
 */
export async function requireClientAccount(returnTo?: string): Promise<ClientAccount> {
  const actor = await requireActor(returnTo);

  if (!isClientAccount(actor)) notFound();

  return actor;
}

/**
 * El alcance de cliente de las pantallas que administran el cliente entero: equipo, ajustes,
 * la lista de eventos.
 *
 * Resuelve la única membresía de alcance cliente de la cuenta. Si no tiene ninguna —un visor,
 * que solo alcanza un evento— rebota al selector, que es donde sí hay algo para esa persona.
 *
 * ## Y si tuviera varias
 *
 * Hoy responde 404, y es una limitación conocida, no un descuido. Una identidad con dos
 * membresías de alcance cliente alcanza dos clientes enteros, y estas pantallas no llevan el
 * cliente en la URL: elegir uno «por defecto» significaría enseñarle el equipo de un cliente a
 * quien pidió el del otro, sin decírselo. Fallar es la lectura correcta hasta que estas rutas
 * tengan el cliente en la URL, como ya lo tienen las de evento. Está anotado en
 * `docs/ACCESO.md`.
 *
 * El caso no ocurre con los datos de hoy: cada identidad se da de alta en un cliente.
 */
export async function requireClientScope(): Promise<ClientActor> {
  const account = await requireClientAccount();
  const scoped = clientScopedMemberships(account);

  if (scoped.length === 0) redirect('/panel');
  if (scoped.length > 1) notFound();

  // `scoped[0]` existe: acabamos de comprobar que hay exactamente uno. El operador de
  // aserción se evita porque `noUncheckedIndexedAccess` puede activarse cualquier día.
  const membership = scoped.at(0);
  const scope = membership ? scopeFromMembership(account, membership) : null;

  // Un `viewer` no puede tener alcance cliente —lo impide el CHECK `memberships_role_scope`—
  // así que llegar aquí significaría que la base de datos tiene una fila imposible. 404.
  if (scope === null) notFound();

  return scope;
}

/**
 * La frontera de una pantalla de evento: `/panel/eventos/<id>/…`.
 *
 * Devuelve las dos cosas que hacen falta y que no se pueden separar sin abrir un hueco: la
 * **membresía** que autoriza —con su rol, su plan y su etiqueta, que es de donde saldrá el
 * menú— y el **alcance** con el que consultar, que es null cuando quien mira es un visor.
 *
 * Un evento que la cuenta no alcanza responde 404, igual que uno que no existe. Los dos casos
 * tienen que ser indistinguibles: un 403 confirmaría que ese evento existe, y el id va en la
 * URL, así que sería un oráculo para averiguar qué eventos hay.
 *
 * La autorización sale de las membresías y no de «¿está en la lista de eventos de mi cliente?»,
 * que es como se hacía antes. La diferencia es justo el caso nuevo: los novios alcanzan un
 * evento **sin** alcanzar el cliente que lo contiene, así que la pregunta por el cliente
 * respondería que no.
 */
export async function requireEventAccess(
  eventId: string,
  /**
   * A dónde volver después de identificarse, cuando no hay sesión.
   *
   * Lo pasa la pantalla y no se deduce aquí porque un componente de servidor no conoce su propia
   * dirección: Next no la expone. Solo lo necesita la de contenido —es la que se manda por
   * correo—, así que el resto lo omite y sigue cayendo en el inicio del panel.
   */
  returnTo?: string,
): Promise<{
  readonly account: ClientAccount;
  readonly membership: Membership;
  /** null cuando el rol es `viewer`: no hay alcance de escritura que construir. */
  readonly scope: ClientActor | null;
}> {
  const account = await requireClientAccount(returnTo);
  const membership = membershipForEvent(account, eventId);

  if (membership === null) notFound();

  return { account, membership, scope: scopeFromMembership(account, membership) };
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
