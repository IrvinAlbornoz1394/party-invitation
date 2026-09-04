import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  inet,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { createdAtOnly, timestamps } from './_shared';

/**
 * Rol de una membresía.
 *
 * Antes era `user_role` y vivía como columna de `users`. Se mudó porque un rol no
 * significa nada sin el alcance al que aplica: «staff» de todo un cliente y «staff» de un
 * solo evento son permisos distintos con el mismo nombre, y con el rol en la identidad el
 * segundo no era representable.
 *
 * `viewer` es el rol de solo lectura que el cliente concede sobre UN evento —los novios de
 * la boda que organiza, los papás de la quinceañera—. No aparece en la jerarquía de
 * `ROLE_RANK` de `domain/auth/actor.ts` como un rango más bajo: no es un `staff` con menos
 * permisos, es un rol que no escribe nada, y compararlo por rango invitaría a tratarlo como
 * «staff-1» el día que alguien añada una comprobación por rango.
 */
export const membershipRole = pgEnum('membership_role', ['owner', 'admin', 'staff', 'viewer']);

/**
 * Rol sobre la plataforma. Nullable: la inmensa mayoría de las cuentas no tiene
 * ninguno, y ese es el valor por defecto.
 *
 * Va en una columna aparte y no como un valor más de `user_role` porque mezclar el
 * privilegio de tenant con el de plataforma en un solo enum haría que cualquier
 * comparación de rol mal escrita pudiera conceder acceso a todos los clientes. Ver
 * `src/domain/auth/actor.ts`.
 *
 * `support` está declarado pero hoy no otorga nada: se reserva el valor para no
 * necesitar una migración cuando haya soporte, y el privilegio se concede cuando se
 * decida, no por existir.
 */
export const platformRole = pgEnum('platform_role', ['superadmin', 'support']);

export const userStatus = pgEnum('user_status', ['active', 'invited', 'disabled']);

/** Medio de entrega del código de acceso. */
export const otpChannel = pgEnum('otp_channel', ['email', 'whatsapp']);

/** Qué se estaba intentando cuando se registró el intento. */
export const authAttemptKind = pgEnum('auth_attempt_kind', ['issue', 'verify']);

/**
 * Identidad con acceso a un panel. El invitado final nunca es un usuario: entra por un
 * enlace público y no tiene cuenta.
 *
 * ## Aquí vive quién eres, no qué alcanzas
 *
 * La tabla tuvo `client_id` y `role`, y con eso una cuenta pertenecía a un cliente y a uno
 * solo. Eso dejaba fuera tres casos que el producto necesita: un acceso limitado a UN
 * evento —los novios de la boda que organiza un cliente, sin ver las demás bodas de ese
 * cliente—, el mismo correo alcanzando dos clientes distintos, y que el sistema pueda
 * saber a qué evento entra alguien. Los tres fallaban por lo mismo: la pertenencia era una
 * columna de la identidad.
 *
 * Ahora la pertenencia son filas de `memberships` y aquí solo queda la identidad: el
 * correo con el que se pide el código, el teléfono al que entregarlo y el estado de la
 * cuenta. Ver `docs/ACCESO.md`.
 *
 * El único de `email` pasa a ser correcto en vez de un estorbo: una persona, una
 * identidad, un sitio donde pedir el código. Que ese correo haya sido dueño de un cliente
 * hace años y hoy sea visor del evento de otro ya no es una contradicción.
 *
 * ## `platform_role` se queda
 *
 * Podría ser una membresía más y no lo es. Mantenerlo como columna conserva la propiedad
 * que protege `/admin`: el privilegio de plataforma no vive en el mismo espacio de valores
 * que el de tenant, así que ninguna comprobación de rol dentro de un cliente puede
 * concederlo por una comparación mal escrita.
 *
 * El CHECK `users_client_xor_platform` se fue con `client_id`. Lo sustituye un invariante
 * que ya no es expresable en una sola fila —**una cuenta de plataforma no tiene
 * membresías**— y que por eso lo verifica `npm run db:check` en vez de un CHECK.
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Se normaliza a minúsculas antes de insertar; el índice único es sensible a mayúsculas. */
  email: text('email').notNull().unique(),
  /**
   * Teléfono en E.164 con `+`, para entregar el código por WhatsApp.
   *
   * Es un destino de entrega, no una identidad: no tiene único y nadie inicia sesión
   * con él. Si fuera identidad habría dos claves capaces de resolver a cuentas
   * distintas, y los límites de intentos se podrían duplicar alternándolas.
   */
  phone: text('phone'),
  /**
   * Nullable, y a propósito.
   *
   * Un visor no tiene por qué dar su nombre: con el correo basta para pedir el código, y
   * exigir datos personales que nadie va a leer es fricción a cambio de nada. Cómo se
   * llama esa persona **para el cliente que le dio acceso** es `memberships.label`, que es
   * donde pertenece — la misma persona es «los novios» en un evento y otra cosa en otro.
   *
   * Donde la interfaz enseñe un nombre y no haya, enseña el correo.
   */
  name: text('name'),
  /** Rol SOBRE la plataforma. Ver el comentario del enum. */
  platformRole: platformRole('platform_role'),
  status: userStatus('status').notNull().default('active'),
  /** Canal que se usa cuando el usuario no pide uno explícitamente. */
  preferredOtpChannel: otpChannel('preferred_otp_channel').notNull().default('email'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  ...timestamps,
});

/**
 * Códigos de un solo uso para iniciar sesión.
 *
 * ## Solo el HMAC, nunca el código
 *
 * `code_hash` es HMAC-SHA256 con `AUTH_SECRET` como clave, no un SHA-256 a secas. La
 * diferencia es decisiva con seis dígitos: el millón de preimágenes de SHA-256 se
 * calcula en menos de un segundo, así que un hash simple de un OTP equivale a guardarlo
 * en claro. Con HMAC y la clave fuera de la base de datos, un dump no revela ningún
 * código.
 *
 * El HMAC se calcula sobre `otp:v1:<identifier>:<code>`, es decir ligado al correo. Dos
 * consecuencias buscadas: el mismo código para dos cuentas distintas produce hashes
 * distintos, y un código no se puede canjear con un correo que no es el suyo.
 *
 * ## El rol de la aplicación no tiene permisos aquí
 *
 * Se accede solo por las funciones SECURITY DEFINER de sql/0001_security.sql.
 */
export const otpChallenges = pgTable(
  'otp_challenges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /**
     * Correo normalizado con el que se pidió el código. Se repite aquí en lugar de
     * llegar por el join con `users` porque es la clave de búsqueda del canje y de la
     * invalidación de códigos anteriores, y porque tiene que seguir siendo el valor con
     * el que se emitió aunque la cuenta cambie de correo después.
     */
    identifier: text('identifier').notNull(),
    codeHash: text('code_hash').notNull(),
    /** Canal por el que se entregó de verdad, que puede no ser el pedido. */
    channel: otpChannel('channel').notNull(),
    /**
     * Destino real de la entrega (correo o teléfono). Se guarda para poder responder
     * "¿a dónde fue el código?" en soporte sin tener que reconstruirlo.
     */
    destination: text('destination').notNull(),
    /**
     * Intentos fallidos contra este código. Defensa en profundidad: el tope observable
     * se aplica por identificador en `auth_attempts` para no delatar qué correos existen,
     * pero además el reto se quema aquí al agotarse.
     */
    attempts: integer('attempts').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    /** Sellado al canjearse, al quemarse por intentos o al emitirse uno nuevo. */
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    requestIp: inet('request_ip'),
    requestUserAgent: text('request_user_agent'),
    ...createdAtOnly,
  },
  (t) => [
    /**
     * Un solo código vivo por identificador.
     *
     * Es un único PARCIAL, no un único normal: los retos consumidos se conservan para
     * auditoría y habría muchos por correo. Lo que la base de datos garantiza es que dos
     * peticiones simultáneas no puedan dejar dos códigos válidos a la vez — sin esto, la
     * invalidación del anterior sería una carrera y el usuario tendría dos códigos
     * buenos, o el atacante dos oportunidades.
     */
    uniqueIndex('otp_challenges_active_identifier_idx')
      .on(t.identifier)
      .where(sql`consumed_at is null`),
    index('otp_challenges_user_id_created_at_idx').on(t.userId, t.createdAt),
    index('otp_challenges_expires_at_idx').on(t.expiresAt),
  ],
);

/**
 * Intentos de autenticación, para los límites y para el rastro forense.
 *
 * Es la pieza que evita que el formulario de login sirva para enumerar clientes. Aquí se
 * registra **también** lo que se intenta con correos que no existen, así que los topes se
 * alcanzan igual con cuenta y sin ella: pedir un código para un correo desconocido y
 * fallar cinco veces produce exactamente la misma respuesta que hacerlo con uno real.
 *
 * El identificador se guarda hasheado. Un correo que no está registrado no es un dato del
 * negocio, es el correo de un tercero que alguien tecleó: acumularlo en claro convertiría
 * una tabla de logs en una lista de direcciones. El hash es HMAC con el mismo secreto, de
 * forma que se puede contar por identificador sin poder leerlos.
 *
 * El rol de la aplicación tampoco tiene permisos aquí. Si los tuviera, podría borrar sus
 * propios intentos y anular todos los límites de una sola sentencia.
 */
export const authAttempts = pgTable(
  'auth_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kind: authAttemptKind('kind').notNull(),
    /** HMAC del correo normalizado. Ver el comentario de la tabla. */
    identifierHash: text('identifier_hash').notNull(),
    clientIp: inet('client_ip'),
    succeeded: boolean('succeeded').notNull(),
    ...createdAtOnly,
  },
  (t) => [
    /** Índice de la consulta del límite por identificador dentro de la ventana. */
    index('auth_attempts_identifier_idx').on(t.identifierHash, t.kind, t.createdAt),
    index('auth_attempts_ip_idx').on(t.clientIp, t.kind, t.createdAt),
  ],
);

/**
 * Sesiones del panel. Igual que los códigos: solo el HMAC del token, y sin permisos para
 * el rol de la aplicación.
 *
 * No guarda ningún cliente, y ahora menos que nunca. Antes existía un `active_client_id`
 * mutable que era lo que sostenía la impersonación: el superadministrador lo cambiaba y
 * pasaba a trabajar dentro de otro tenant. Con dos paneles separados esa pieza sobra, y
 * quitarla elimina de golpe toda una clase de fallo: una sesión que quedó apuntando al
 * cliente equivocado.
 *
 * La sesión autentica una **identidad** y nada más. Con qué membresía se está trabajando no
 * vive aquí sino en la URL (`/panel/eventos/<id>/…`), por el mismo motivo por el que se fue
 * `active_client_id`: un contexto mutable guardado en el servidor se queda pegado, y con dos
 * eventos abiertos en dos pestañas una de las dos trabajaría sobre el contexto de la otra.
 */
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
    /** Sellado al cerrar sesión. Se conserva la fila para poder auditar. */
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdIp: inet('created_ip'),
    createdUserAgent: text('created_user_agent'),
    ...timestamps,
  },
  (t) => [
    index('sessions_user_id_idx').on(t.userId),
    index('sessions_expires_at_idx').on(t.expiresAt),
  ],
);
