import type { TenantScope } from '@/domain/auth/actor';
import type { EventCollections } from './event-collections';
import type { EventContentDraft } from './event-content-draft';
import type { NewEvent } from './new-event';
import type { PlatformCredentials } from '../auth/platform-credentials';

/**
 * Un evento tal como se lista, en los dos paneles.
 *
 * `clientName` viene relleno solo en el listado de plataforma: en el panel de un cliente
 * sería la misma cadena repetida en todas las filas, y una columna que siempre dice lo
 * mismo es ruido.
 */
export interface EventSummary {
  readonly id: string;
  readonly clientId: string;
  readonly clientName: string | null;
  readonly title: string;
  readonly slug: string;
  readonly status: string;
  readonly startsAt: Date;
  readonly planKey: string;
  /**
   * El código que protege la invitación, en claro.
   *
   * Va aquí porque sin él el panel no puede componer la URL que se reparte: la dirección de
   * una invitación es `/<slug>/<código>`, y el slug solo no lleva a ninguna parte. Es
   * exactamente la razón por la que `events.access_code` se guarda sin hashear —el
   * organizador tiene que poder recuperar su enlace—, así que no exponerlo aquí dejaba esa
   * decisión de diseño sin consumidor y el panel sin su función más básica.
   *
   * Que el código sea legible desde el panel NO lo debilita: es una credencial portadora
   * cuya protección real son el espacio de 32^6 y el límite de intentos por IP que aplica
   * `app.resolve_invitation_access()`. Quien ve esta pantalla ya pasó por la sesión.
   */
  readonly accessCode: string;
  /**
   * Si se espera que **el cliente** llene el contenido de este evento.
   *
   * Lo necesita la lista de la plataforma para dos cosas: ofrecer «enviar enlace al cliente»
   * solo donde tiene sentido, y distinguir un borrador que espera al cliente de uno que espera
   * a la plataforma. Ver la columna en el esquema para cuándo se apaga sola.
   */
  readonly clientFillsContent: boolean;
}

/**
 * Un evento nuevo, listo para escribirse.
 *
 * Es lo validado por `newEventSchema` más las dos cosas que no salen de ningún formulario: el
 * código de acceso, que lo genera un CSPRNG, y quién lo está dando de alta, que sale de la
 * sesión. Ninguna de las dos puede llegar de fuera, y por eso se añaden aquí y no allí.
 */
/** A dónde se le puede escribir a un cliente. Ver `findClientContact`. */
export interface ClientContact {
  readonly name: string;
  readonly email: string | null;
  /** Sin uso todavía: el canal de WhatsApp no está integrado. */
  readonly phone: string | null;
}

export interface NewEventRecord extends NewEvent {
  readonly accessCode: string;
  /** Se guarda en `events.created_by` y firma la entrada de la bitácora. */
  readonly actorUserId: string;
}

export type CreateEventResult =
  | { readonly outcome: 'created'; readonly eventId: string }
  /**
   * Ya hay una invitación en esa dirección.
   *
   * Puede ser de OTRO cliente: `events.slug` es único en toda la plataforma porque la invitación
   * se sirve en la raíz del dominio. Es la única respuesta de este puerto que habla de datos que
   * quien pregunta no puede ver, y es inevitable — el índice único es global.
   */
  | { readonly outcome: 'slug-taken' }
  /** El plan, la plantilla, el tema o el tipo de evento no existen. Solo pasa con una llamada a mano. */
  | { readonly outcome: 'unknown-catalog' }
  /** La base de datos no autorizó abrir el contexto de ese cliente. */
  | { readonly outcome: 'forbidden' };

export interface EventRepository {
  /**
   * Da de alta un evento y su composición de bloques, en una sola transacción.
   *
   * Las dos cosas juntas y no en dos pasos: un evento sin bloques no es una invitación a medias,
   * es una página en blanco, y arreglarlo desde la aplicación exigiría una pantalla que no
   * existe. La composición se copia de la plantilla elegida — es lo que `template_blocks`
   * describe como «con qué nace cada bloque».
   */
  create(
    credentials: PlatformCredentials,
    input: NewEventRecord,
  ): Promise<CreateEventResult>;

  /**
   * Los eventos de un cliente, leídos con el contexto de tenant puesto.
   *
   * Es el camino de `/panel`, y es el mismo que usa `/admin` cuando entra a un cliente
   * concreto: uno con su propio `clientId`, el otro con uno autorizado antes por
   * `app.authorize_client_context`. Que sea la misma consulta importa — significa que el
   * panel de plataforma ve exactamente lo que ve el cliente, con Row-Level Security
   * puesta, y no una vista paralela sin aislamiento que pueda divergir.
   */
  /**
   * El contenido editable de un evento, para el formulario del panel.
   *
   * Devuelve `null` cuando el evento no está en el alcance, que con RLS puesto es lo mismo que
   * decir que no existe para quien pregunta.
   */
  loadContentDraft(scope: TenantScope, eventId: string): Promise<EventContentDraft | null>;

  /**
   * Guarda el contenido editable.
   *
   * La fecha y la hora llegan como texto en la **hora local del evento** y la conversión al
   * instante la hace Postgres con `AT TIME ZONE`, leyendo la zona de la propia fila. Es lo que
   * evita que quien captura desde otra zona —o con la zona del teléfono mal puesta— guarde la
   * boda a otra hora sin que nada lo señale.
   *
   * Devuelve `false` si no llegó a escribir ninguna fila: el evento no está en el alcance.
   */
  saveContentDraft(input: {
    readonly scope: TenantScope;
    readonly eventId: string;
    readonly draft: EventContentDraft;
    readonly actorUserId: string;
  }): Promise<boolean>;

  /** Las tres listas ordenadas del evento: sedes, cronograma y galería. */
  loadCollections(scope: TenantScope, eventId: string): Promise<EventCollections>;

  /**
   * Guarda las tres listas, conservando las filas que ya existían.
   *
   * No borra y reinserta: las filas que traen `id` se actualizan, las que no lo traen se
   * insertan, y las que dejaron de aparecer se borran. Es lo que conserva las columnas que este
   * formulario no toca —`storage_key`, `width`, `height` de una foto— y lo que mantiene estables
   * los identificadores.
   *
   * El orden lo da la posición en el array.
   */
  saveCollections(input: {
    readonly scope: TenantScope;
    readonly eventId: string;
    readonly collections: EventCollections;
  }): Promise<boolean>;

  /**
   * Recibe el alcance y no solo el cliente: con evento, devuelve ese evento y nada más.
   *
   * Es la misma consulta para las dos cosas porque quien decide cuántas filas salen es RLS y no
   * un `where` de más. Un visor pide «los eventos de mi alcance» y recibe uno.
   */
  listForClient(scope: TenantScope): Promise<readonly EventSummary[]>;

  /**
   * Un evento del propio cliente.
   *
   * Lo pide la pantalla de contenido para saber dos cosas que el borrador no dice: en qué estado
   * está —si ya se mandó a revisión— y si es él quien tiene que llenarlo. Devuelve `null` si no
   * está en su alcance, que para la pantalla es lo mismo que si no existiera.
   */
  findForClient(scope: TenantScope, eventId: string): Promise<EventSummary | null>;

  /**
   * Los eventos de un cliente, pedidos desde el panel de plataforma.
   *
   * Existe como método aparte en vez de dejar que `/admin` llame a `listForClient` con el
   * id que quiera. La diferencia es que este pide permiso a la base de datos antes de
   * abrir el contexto, y devuelve `null` si no lo obtiene. Si el panel de plataforma
   * pudiera usar el otro, la autorización sería algo de lo que hay que acordarse en cada
   * pantalla nueva — y de eso uno se acuerda hasta que no.
   */
  listForClientAsPlatform(
    credentials: PlatformCredentials,
    clientId: string,
  ): Promise<readonly EventSummary[] | null>;

  /** Todos los eventos de todos los clientes. Solo para el panel de plataforma. */
  listAllForPlatform(credentials: PlatformCredentials): Promise<readonly EventSummary[]>;

  /* ── El contenido, desde la plataforma ──────────────────────────────────────
     Las mismas cuatro operaciones de arriba, con el contexto del cliente abierto por
     `app.authorize_client_context()` en vez de por la sesión de un miembro. El admin no
     impersona a nadie: pide permiso para una operación y la hace. */

  loadContentDraftAsPlatform(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
  ): Promise<EventContentDraft | null>;

  saveContentDraftAsPlatform(input: {
    readonly credentials: PlatformCredentials;
    readonly clientId: string;
    readonly eventId: string;
    readonly draft: EventContentDraft;
  }): Promise<boolean>;

  loadCollectionsAsPlatform(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
  ): Promise<EventCollections | null>;

  saveCollectionsAsPlatform(input: {
    readonly credentials: PlatformCredentials;
    readonly clientId: string;
    readonly eventId: string;
    readonly collections: EventCollections;
  }): Promise<boolean>;

  /* ── El camino del evento ───────────────────────────────────────────────────
     Quién puede hacer qué está en `domain/events/event-status.ts`; estas son las
     escrituras, y cada una comprueba el estado de partida en su propio UPDATE para que dos
     pestañas abiertas no puedan publicar dos veces ni revivir un archivado. */

  /**
   * Publica un evento. Devuelve falso si no estaba en un estado desde el que se pueda.
   *
   * La vigencia se calcula aquí y no en la aplicación: sale de `plans.duration_months`, que es
   * un dato del catálogo, y hacerlo en SQL garantiza que el instante de publicación y el de
   * caducidad se midan con el mismo reloj.
   */
  publish(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
  ): Promise<boolean>;

  /** El cliente da por terminado su contenido. Solo desde borrador. */
  sendToReview(scope: TenantScope, eventId: string): Promise<boolean>;

  /** Enciende o apaga la espera del contenido del cliente. */
  setClientFillsContent(input: {
    readonly credentials: PlatformCredentials;
    readonly clientId: string;
    readonly eventId: string;
    readonly value: boolean;
  }): Promise<boolean>;

  /**
   * Un evento concreto, leído por la plataforma.
   *
   * La consulta es la del panel del cliente (`findEventInClient`): el admin ve exactamente lo
   * mismo, con el contexto abierto para la ocasión. Devuelve `null` si no existe o si este admin
   * no puede abrir el contexto de ese cliente.
   */
  findForPlatform(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
  ): Promise<EventSummary | null>;

  /**
   * Por dónde se le puede avisar a un cliente, y cómo se llama.
   *
   * Devuelve los dos canales aunque hoy solo se use uno: el correo, que desde el alta es
   * obligatorio, y el teléfono, que se guarda para cuando WhatsApp entre. Que el puerto los
   * devuelva juntos es lo que permitirá encender el segundo canal sin tocar ni un caso de uso.
   */
  findClientContact(
    credentials: PlatformCredentials,
    clientId: string,
  ): Promise<ClientContact | null>;

  /**
   * Los correos a los que avisar de que hay algo que revisar.
   *
   * Es la lista de cuentas de plataforma activas, y la resuelve una función SECURITY DEFINER
   * porque `users` está sellada para el rol de la aplicación. No recibe credenciales: la llama
   * el caso de uso del **cliente** que manda su evento, que no es de plataforma y no debe poder
   * leer esa tabla — solo disparar el aviso.
   */
  listPlatformNoticeEmails(): Promise<readonly string[]>;
}
