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
 * El mismo invariante está impuesto en la base de datos por el CHECK
 * `users_client_xor_platform`. Que esté en los dos sitios no es duplicación ociosa: el
 * CHECK protege los datos de un script mal escrito, y el tipo protege el código de un
 * olvido. Ninguno de los dos cubre lo del otro.
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
 * Con dos paneles ese estado no existe. Un `ClientActor` tiene exactamente un cliente y no
 * cambia nunca; un `PlatformActor` no tiene ninguno y abre el contexto de un cliente para
 * una operación concreta, con la base de datos autorizándolo cada vez
 * (`app.authorize_client_context`).
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
  readonly name: string;
}

/** Cuenta de un cliente. Trabaja en `/panel` y su tenant es fijo. */
export interface ClientActor extends ActorIdentity {
  readonly kind: 'client';
  /** El tenant de todas sus consultas. Es el valor que recibe `withTenant()`. */
  readonly clientId: string;
  readonly role: UserRole;
}

/** Cuenta de la plataforma. Trabaja en `/admin` y no pertenece a ningún tenant. */
export interface PlatformActor extends ActorIdentity {
  readonly kind: 'platform';
  readonly platformRole: PlatformRole;
}

export type Actor = ClientActor | PlatformActor;

export function isClientActor(actor: Actor): actor is ClientActor {
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
 * Un `staff` gestiona el evento pero no puede invitar ni quitar compañeros: quien tiene esa
 * capacidad puede darse a sí mismo cualquier otra, así que es la frontera real dentro de un
 * cliente.
 */
export function canManageUsers(actor: ClientActor): boolean {
  return hasRoleAtLeast(actor, 'admin');
}

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

export function isPlatformRole(value: unknown): value is PlatformRole {
  return typeof value === 'string' && (PLATFORM_ROLES as readonly string[]).includes(value);
}
