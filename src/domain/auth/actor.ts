/**
 * Quién está haciendo la petición.
 *
 * ## Dos clases de actor, no una con campos opcionales
 *
 * La plataforma tiene dos paneles y son dos mundos distintos: quien entra a `/admin`
 * gestiona los clientes y los eventos de todos; quien entra a `/panel` gestiona los
 * eventos de su cliente y nada más. El actor lo refleja con una unión discriminada por
 * `kind`.
 *
 * La alternativa —un solo objeto con `clientId: string | null` y `platformRole` también
 * nullable— compila igual y es la que se escribe por inercia. Se descartó porque deja
 * representables los dos estados que no existen: un actor con las dos cosas y un actor sin
 * ninguna. Con la unión, `clientId` no está declarado en el brazo de plataforma, así que
 * una pantalla de `/panel` que intente usarlo sin comprobar antes el tipo **no compila**.
 * La comprobación deja de depender de la disciplina y pasa a hacerla el compilador.
 *
 * El mismo invariante lo sostiene la base de datos: una cuenta de plataforma no tiene
 * membresías, y `npm run db:check` lo verifica. Que esté en los dos sitios no es duplicación
 * ociosa: la base de datos protege los datos de un script mal escrito, y el tipo protege el
 * código de un olvido. Ninguno de los dos cubre lo del otro.
 *
 * ## Identidad y alcance son dos tipos, no uno
 *
 * `ClientAccount` es quién eres y qué alcanzas —la sesión—. `ClientActor` es con qué tenant se
 * está trabajando en esta petición. La separación existe porque una identidad puede alcanzar
 * varios sitios: el dueño de un cliente con tres eventos, o alguien que es dueño en uno y
 * visor en otro. Un solo tipo con `clientId` obligaría a elegir uno al construir la sesión, y
 * ese es exactamente el estado mutable que se eliminó al quitar la impersonación.
 *
 * ## Por qué desapareció la impersonación
 *
 * Antes existía un tercer concepto —el cliente ACTIVO— porque el superadministrador no
 * tenía panel propio: entraba al de un cliente y trabajaba "como si fuera él". Eso obligaba
 * a distinguir "el cliente al que pertenezco" de "el cliente en el que estoy", a mantener
 * un campo mutable en la sesión y a poner un aviso permanente en la interfaz por el riesgo
 * real, que no era técnico sino humano: olvidar dónde estás y hacer un cambio creyéndolo
 * tuyo.
 *
 * Con dos paneles ese estado no existe. Un `ClientActor` se resuelve por petición a partir de
 * la URL que se está pidiendo y se descarta con ella; un `PlatformActor` no tiene ninguno y
 * abre el contexto de un cliente para una operación concreta, con la base de datos
 * autorizándolo cada vez (`app.authorize_client_context`).
 *
 * Que el alcance salga de la URL y no de la sesión es deliberado, y por el mismo motivo por el
 * que se fue `sessions.active_client_id`: con dos eventos abiertos en dos pestañas, un contexto
 * guardado en el servidor haría que una de las dos trabajara sobre el de la otra.
 */

export const USER_ROLES = ['owner', 'admin', 'staff'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Rol sobre la plataforma.
 *
 * `support` está declarado pero hoy no otorga nada. El valor existe para no necesitar una
 * migración cuando haya soporte; el privilegio se concederá cuando alguien lo decida, no
 * por el hecho de que el valor exista. Un rol nuevo nace sin permisos y se le van dando,
 * nunca al contrario.
 */
export const PLATFORM_ROLES = ['superadmin', 'support'] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/**
 * Jerarquía de roles dentro de un cliente, de menor a mayor.
 *
 * Se compara por índice y no con una cadena de `if`, para que añadir un rol intermedio en
 * el futuro no obligue a revisar cada comprobación de permisos del proyecto.
 */
const ROLE_RANK: Record<UserRole, number> = { staff: 0, admin: 1, owner: 2 };

interface ActorIdentity {
  readonly userId: string;
  readonly email: string;
  /**
   * Nullable, y no por descuido: un acceso de solo lectura se concede con el correo y nada
   * más. Quien pinte un nombre tiene que caer al correo cuando no hay ninguno — para eso está
   * `displayNameOf()`.
   */
  readonly name: string | null;
}

/** Rol de una membresía. `viewer` no está en `UserRole` — ver `MEMBERSHIP_ROLES`. */
export const MEMBERSHIP_ROLES = ['owner', 'admin', 'staff', 'viewer'] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

/**
 * Lo que una identidad alcanza. Es la traducción de una fila de `memberships`.
 *
 * `eventId` null significa **alcance cliente**: todos los eventos de ese cliente. Con evento,
 * ese evento y nada más.
 *
 * `clientName`, `eventTitle` y `planKey` vienen resueltos desde `app.resolve_session` y no se
 * consultan aparte, porque hay un problema de orden: para abrir el contexto de un cliente hay
 * que saber primero que se le alcanza, y eso es justamente lo que responde esta lista. Sin
 * ellos el selector no podría escribir «Boda de Ana y Luis · Bodas Mérida» sin una consulta
 * que RLS todavía no permite.
 */
export interface Membership {
  readonly membershipId: string;
  readonly clientId: string;
  readonly clientName: string;
  /** null = alcance cliente. */
  readonly eventId: string | null;
  readonly eventTitle: string | null;
  readonly eventSlug: string | null;
  /** El plan del evento, del que sale el menú. null en el alcance cliente. */
  readonly planKey: string | null;
  readonly role: MembershipRole;
  /** Cómo llama el cliente a esta persona. Solo tiene sentido en el alcance evento. */
  readonly label: string | null;
}

/**
 * Cuenta de un cliente, tal como sale de la sesión: una identidad y lo que alcanza.
 *
 * No tiene `clientId` ni `role`, y eso es el cambio entero del modelo visto desde los tipos.
 * Antes los tenía porque la pertenencia era una columna de la identidad; ahora son filas, y
 * cuál de ellas está en juego depende de la pantalla que se esté pidiendo. Quien necesite un
 * tenant concreto tiene que **resolver un alcance** — `ClientScope`—, y el compilador se lo
 * exige porque aquí no hay ningún `clientId` que usar por inercia.
 *
 * `memberships` puede venir vacío: una cuenta a la que se le retiraron todos los accesos sigue
 * pudiendo iniciar sesión. No es un fallo, es el caso que el selector tiene que saber contar.
 */
export interface ClientAccount extends ActorIdentity {
  readonly kind: 'client';
  readonly memberships: readonly Membership[];
}

/**
 * Qué filas se pueden ver: el cliente y, si el alcance es de un solo evento, ese evento.
 *
 * Está separado de `ClientActor` a propósito, y la distinción es la que hace posible un rol de
 * solo lectura. `TenantScope` responde **qué filas**; el rol de `ClientActor` responde **qué se
 * puede hacer con ellas**. Un visor tiene lo primero y no lo segundo: puede leer su evento y no
 * existe ningún `ClientActor` que lo represente, porque `UserRole` no incluye `viewer`.
 *
 * Si fueran un solo tipo habría que meter `viewer` en la jerarquía de roles, y entonces cada
 * comprobación de permisos del proyecto tendría que acordarse de excluirlo. La primera que se
 * olvidara le daría escritura a quien solo debía mirar.
 *
 * `ClientActor` lo satisface estructuralmente, así que un caso de uso que pida `TenantScope`
 * acepta las dos cosas sin conversión.
 */
export interface TenantScope {
  readonly clientId: string;
  /** No null solo en el alcance evento; es lo que hace que RLS estreche. */
  readonly eventId: string | null;
}

/** El alcance de lectura de una membresía, sea del rol que sea. */
export function tenantScopeOf(membership: Membership): TenantScope {
  return { clientId: membership.clientId, eventId: membership.eventId };
}

/**
 * Una membresía ya resuelta y autorizada: con qué tenant se va a trabajar en ESTA petición.
 *
 * Es lo que reciben los casos de uso y lo que alimenta a `withTenant()`. Conserva el nombre
 * `ClientActor` porque su forma y su papel no han cambiado —identidad más el cliente y el rol
 * con los que se está trabajando—; lo que cambió es de dónde sale: antes de una columna de
 * `users`, ahora de una membresía que alguien tuvo que elegir y autorizar.
 *
 * `eventId` no es null cuando el alcance es de un solo evento, y entonces `withTenant()` fija
 * también el contexto de evento y RLS estrecha. Es la diferencia entre «el dueño del cliente
 * mirando una boda» y «los novios mirando la suya»: la misma pantalla, distinto alcance.
 */
export interface ClientActor extends ActorIdentity, TenantScope {
  readonly kind: 'client';
  readonly role: UserRole;
}

/** Cuenta de la plataforma. Trabaja en `/admin` y no pertenece a ningún tenant. */
export interface PlatformActor extends ActorIdentity {
  readonly kind: 'platform';
  readonly platformRole: PlatformRole;
}

export type Actor = ClientAccount | PlatformActor;

export function isClientAccount(actor: Actor): actor is ClientAccount {
  return actor.kind === 'client';
}

export function isPlatformActor(actor: Actor): actor is PlatformActor {
  return actor.kind === 'platform';
}

/**
 * Permiso para entrar al panel de plataforma.
 *
 * Ser `PlatformActor` no basta: `support` también lo es y hoy no administra nada. Los dos
 * conceptos se separan aquí a propósito, para que el día que soporte tenga acceso de
 * lectura no haya que revisar pantalla por pantalla cuáles daban por hecho que "de
 * plataforma" equivalía a "puede todo".
 */
export function canAdministerPlatform(actor: Actor): boolean {
  return isPlatformActor(actor) && actor.platformRole === 'superadmin';
}

/** Si el actor alcanza al menos el rol indicado dentro de su cliente. */
export function hasRoleAtLeast(actor: ClientActor, minimum: UserRole): boolean {
  return ROLE_RANK[actor.role] >= ROLE_RANK[minimum];
}

/**
 * Permiso para administrar las cuentas del cliente.
 *
 * Solo el dueño. Quien puede repartir accesos puede darse a sí mismo cualquier otro, así que
 * esta es la frontera real dentro de un cliente y por eso la tiene una sola persona: la que
 * contrató. Un colaborador trabaja en los eventos y no decide quién más entra.
 *
 * Lo que un colaborador **sí** puede repartir es un acceso de solo lectura a un evento suyo
 * —ver `canGrantEventAccess`—, y no es una excepción a lo anterior: un visor es estrictamente
 * más débil que él y sobre un evento que ya alcanza entero, así que no hay ningún permiso que
 * pueda fabricarse por esa vía.
 */
export function canManageUsers(actor: ClientActor): boolean {
  return hasRoleAtLeast(actor, 'owner');
}

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

export function isPlatformRole(value: unknown): value is PlatformRole {
  return typeof value === 'string' && (PLATFORM_ROLES as readonly string[]).includes(value);
}

export function isMembershipRole(value: unknown): value is MembershipRole {
  return typeof value === 'string' && (MEMBERSHIP_ROLES as readonly string[]).includes(value);
}

/**
 * El nombre que se pinta, con el correo como respaldo.
 *
 * Existe porque `name` es nullable desde que un visor se da de alta con el correo y nada más,
 * y porque la alternativa —`name ?? email` repartido por cada pantalla— acaba con la mitad de
 * los sitios enseñando «null» o un hueco. Un solo sitio decide qué se ve cuando no hay nombre.
 */
export function displayNameOf(identity: { readonly name: string | null; readonly email: string }): string {
  return identity.name?.trim() || identity.email;
}

/** Las membresías de alcance cliente: las que dan el panel del cliente entero. */
export function clientScopedMemberships(account: ClientAccount): readonly Membership[] {
  return account.memberships.filter((membership) => membership.eventId === null);
}

/**
 * La membresía que da acceso a un evento concreto, o null.
 *
 * Mira los dos alcances, y el orden importa: primero la del propio evento y después la del
 * cliente que lo contiene. Cuando alguien tiene las dos, la más específica gana, porque conceder
 * un acceso a un solo evento nunca debería AMPLIAR lo que se ve — y sí ocurre: a un colaborador
 * del cliente se le puede dar un visor sobre una boda, y entonces esa boda pasa a ser de solo
 * lectura para él.
 *
 * ## El respaldo solo vale con un cliente
 *
 * Una membresía de alcance cliente no nombra ningún evento, así que desde aquí no hay forma de
 * saber si el evento pedido es suyo: eso lo resuelve quien llama, consultando los eventos de ese
 * alcance (lo hace el layout de `(event)`, que responde 404 si el evento no aparece).
 *
 * Con **una sola** membresía de alcance cliente no hay ambigüedad: o el evento es de ese cliente
 * o no se alcanza, y las dos respuestas son correctas. Con varias sí la habría —devolver la
 * primera equivale a decir «este evento es del cliente que me dé la gana»—, así que en ese caso
 * no se devuelve ninguna. Es el mismo límite que ya tiene `requireClientScope()`, que responde
 * 404 cuando hay más de una, y falla cerrado en lugar de adivinar.
 */
export function membershipForEvent(
  account: ClientAccount,
  eventId: string,
): Membership | null {
  const exact = account.memberships.find((membership) => membership.eventId === eventId);
  if (exact) return exact;

  const scoped = clientScopedMemberships(account);

  return scoped.length === 1 ? (scoped.at(0) ?? null) : null;
}

/**
 * Convierte una membresía en el alcance con el que se va a trabajar.
 *
 * Devuelve null para un `viewer`, y esa es la pieza que impide que un rol de solo lectura se
 * cuele en un camino de escritura: `ClientActor.role` es `UserRole`, que no incluye `viewer`,
 * así que no hay forma de construir uno para un visor ni por descuido. Las pantallas de solo
 * lectura reciben la membresía, no un actor.
 */
export function scopeFromMembership(
  account: ClientAccount,
  membership: Membership,
): ClientActor | null {
  if (membership.role === 'viewer') return null;

  return {
    kind: 'client',
    userId: account.userId,
    email: account.email,
    name: account.name,
    clientId: membership.clientId,
    role: membership.role,
    eventId: membership.eventId,
  };
}
