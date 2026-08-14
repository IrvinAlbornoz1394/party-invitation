import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
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
import { clients } from './clients';

/** Rol dentro de un cliente. */
export const userRole = pgEnum('user_role', ['owner', 'admin', 'staff']);

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
 * Cuenta con acceso a un panel. El invitado final nunca es un usuario: entra por un
 * enlace público y no tiene cuenta.
 *
 * ## Dos clases de cuenta en una sola tabla
 *
 * `client_id` es NULLABLE, y ahí está toda la distinción:
 *
 * - `client_id` no nulo, `platform_role` nulo → cuenta de un cliente. Entra a `/panel`
 *   y solo ve los eventos de su cliente.
 * - `client_id` nulo, `platform_role` no nulo → cuenta de la plataforma. Entra a
 *   `/admin` y gestiona clientes y eventos.
 *
 * Van en la misma tabla porque el correo tiene que ser único entre las dos: es la
 * identidad con la que se pide el código de acceso, y si hubiera dos tablas la misma
 * dirección podría resolver a dos cuentas y el login no sabría a cuál.
 *
 * Lo que antes se resolvía con una "organización de plataforma" —un tenant ficticio al
 * que pertenecía el superadministrador— desaparece: no hacía falta un cliente inventado
 * para representar a quien no es cliente de sí mismo.
 *
 * El invariante lo impone la base de datos con un CHECK, no la aplicación. Una cuenta
 * con las dos cosas a la vez sería un cliente con acceso a `/admin`, y una con ninguna
 * sería una cuenta que puede iniciar sesión y no pertenece a ningún panel.
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** null solo para las cuentas de plataforma. Ver el comentario de la tabla. */
    clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }),
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
    name: text('name').notNull(),
    /** Rol DENTRO del cliente. Para una cuenta de plataforma no significa nada. */
    role: userRole('role').notNull().default('admin'),
    /** Rol SOBRE la plataforma. Ver el comentario del enum. */
    platformRole: platformRole('platform_role'),
    status: userStatus('status').notNull().default('active'),
    /** Canal que se usa cuando el usuario no pide uno explícitamente. */
    preferredOtpChannel: otpChannel('preferred_otp_channel').notNull().default('email'),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    /**
     * O es de un cliente, o es de la plataforma. Nunca las dos, nunca ninguna.
     *
     * Va como CHECK y no como validación de la aplicación porque es la frontera entre
     * los dos paneles: una cuenta que cumpliera las dos condiciones tendría acceso a
     * `/admin` y además un tenant propio, que es justo la escalada que el modelo evita.
     */
    check(
      'users_client_xor_platform',
      sql`(${t.clientId} is not null and ${t.platformRole} is null)
          or (${t.clientId} is null and ${t.platformRole} is not null)`,
    ),
    index('users_client_id_idx').on(t.clientId),
  ],
);

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
 * No guarda ningún cliente. Antes existía un `active_client_id` mutable que era lo que
 * sostenía la impersonación: el superadministrador lo cambiaba y pasaba a trabajar dentro
 * de otro tenant. Con dos paneles separados esa pieza sobra, y quitarla elimina de golpe
 * toda una clase de fallo —una sesión que quedó apuntando al cliente equivocado— porque
 * el tenant de una cuenta de cliente vuelve a ser un solo valor inmutable:
 * `users.client_id`. Una cuenta de plataforma sencillamente no tiene tenant.
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
