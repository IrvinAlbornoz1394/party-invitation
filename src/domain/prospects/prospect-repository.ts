import type { PlatformCredentials } from '../auth/platform-credentials';
import type { Prospect, ProspectForm, ProspectStatus, TouchChannel } from './prospect';

/** Lo que responde el formulario público. */
export type SubmitProspectResult =
  | { readonly outcome: 'received' }
  /** Demasiadas solicitudes desde la misma conexión en la última hora. */
  | { readonly outcome: 'rate-limited' }
  | { readonly outcome: 'invalid' };

/**
 * Puerto de persistencia de los prospectos.
 *
 * Los dos caminos que declara tienen autorizaciones opuestas y por eso conviene leerlos juntos:
 * escribir es **anónimo** —cualquiera desde la web— y leer exige una cuenta de plataforma. Es la
 * única tabla del sistema con esa asimetría, y de ahí sale que todo pase por funciones
 * `SECURITY DEFINER` en vez de por RLS: no hay ningún cliente con el que acotar a quien todavía
 * no es cliente.
 */
export interface ProspectRepository {
  /** Desde el formulario público. Sin sesión: quien escribe aquí no tiene cuenta. */
  submit(form: ProspectForm, clientIp: string | null): Promise<SubmitProspectResult>;

  /** La bandeja entera. El orden de urgencia lo pone el dominio, no la consulta. */
  list(credentials: PlatformCredentials): Promise<readonly Prospect[]>;

  /**
   * Cuántas piden atención hoy: las nuevas y las vencidas.
   *
   * Existe aparte de `list` porque alimenta el contador del menú, o sea que corre en cada carga de
   * cualquier pantalla de `/admin`. Contar sobre el listado traería todas las filas con su
   * bitácora agregada para pintar un número.
   */
  countPending(credentials: PlatformCredentials): Promise<number>;

  /**
   * Anota un contacto y, en el mismo acto, mueve el estado y la próxima fecha.
   *
   * Van juntos porque son una sola cosa —«le escribí y quedamos en el viernes»—. Separarlos
   * dejaría bitácoras sin estado o estados sin explicación.
   */
  recordTouch(input: {
    readonly credentials: PlatformCredentials;
    readonly prospectId: string;
    readonly channel: TouchChannel;
    readonly note: string;
    readonly status: ProspectStatus | null;
    readonly nextFollowUpAt: Date | null;
    readonly lostReason: string | null;
  }): Promise<boolean>;

  /**
   * Vincula el prospecto con el cliente en que se convirtió y lo pasa a `won`.
   *
   * No crea el cliente: eso es `CreateClient`, que ya existe. Están separados porque el caso real
   * incluye que el cliente se diera de alta **antes** de que alguien se acordara del prospecto.
   */
  linkToClient(input: {
    readonly credentials: PlatformCredentials;
    readonly prospectId: string;
    readonly clientId: string;
  }): Promise<boolean>;

  /** La bitácora de un prospecto, de lo más reciente a lo más antiguo. */
  listTouches(
    credentials: PlatformCredentials,
    prospectId: string,
  ): Promise<readonly ProspectTouch[]>;
}

export interface ProspectTouch {
  readonly id: string;
  readonly channel: TouchChannel;
  readonly note: string;
  readonly createdAt: Date;
  readonly authorEmail: string | null;
}
