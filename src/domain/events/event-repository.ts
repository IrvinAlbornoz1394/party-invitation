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
}

export interface EventRepository {
  /**
   * Los eventos de un cliente, leídos con el contexto de tenant puesto.
   *
   * Es el camino de `/panel`, y es el mismo que usa `/admin` cuando entra a un cliente
   * concreto: uno con su propio `clientId`, el otro con uno autorizado antes por
   * `app.authorize_client_context`. Que sea la misma consulta importa — significa que el
   * panel de plataforma ve exactamente lo que ve el cliente, con Row-Level Security
   * puesta, y no una vista paralela sin aislamiento que pueda divergir.
   */
  listForClient(clientId: string): Promise<readonly EventSummary[]>;

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
}
