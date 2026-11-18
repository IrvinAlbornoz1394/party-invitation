import type { PlatformCredentials } from '@/domain/auth/platform-credentials';

/**
 * El enlace para que el cliente llene su información.
 *
 * El admin lo copia desde la lista de eventos y lo pega en el WhatsApp del cliente. Al abrirlo y
 * pulsar «Entrar», el cliente aterriza en su formulario con la sesión abierta, sin pedir código.
 *
 * ## Una credencial, con sus límites
 *
 * `docs/ACCESO.md` descartaba los enlaces que sirven para entrar, y por buenas razones: se
 * reenvían, se guardan, acaban donde no deben. Este los acepta con cuatro límites que responden a
 * esas razones:
 *
 *   · **Cinco días** de vigencia, y uno solo vigente por evento: generar otro revoca el anterior.
 *   · **Un solo evento.** La sesión que abre alcanza ese evento y nada más, aunque la cuenta sea
 *     la de un organizador con veinte bodas. Lo impone la base de datos (`app.resolve_session`).
 *   · **Se cierra al enviar.** En cuanto el cliente manda su información el enlace deja de abrir
 *     sesiones; para volver a editar hace falta que el admin lo permita.
 *   · **No se canjea al abrirse**, sino al pulsar un botón: las vistas previas de WhatsApp abren
 *     los enlaces por su cuenta.
 */
export const CONTENT_LINK_TTL_MS = 5 * 24 * 60 * 60 * 1000;

/** El enlace vigente de un evento, tal como lo ve el admin. */
export interface ActiveContentLink {
  readonly id: string;
  /** El token que va en la URL, recalculado a partir del id; nunca se guarda. */
  readonly token: string;
  readonly expiresAt: Date;
  readonly openedAt: Date | null;
}

export type RedeemContentLinkOutcome =
  | { readonly outcome: 'ok'; readonly eventId: string; readonly sessionExpiresAt: Date }
  | { readonly outcome: 'invalid' }
  | { readonly outcome: 'expired' }
  | { readonly outcome: 'closed' }
  | { readonly outcome: 'no-account' };

export interface ContentLinkRepository {
  /** El enlace vigente del evento, o `null` si no hay ninguno sin revocar y sin vencer. */
  findActive(credentials: PlatformCredentials, clientId: string, eventId: string): Promise<ActiveContentLink | null>;

  /** Revoca el vigente y crea uno nuevo, en la misma transacción. */
  issue(input: {
    readonly credentials: PlatformCredentials;
    readonly clientId: string;
    readonly eventId: string;
    readonly expiresAt: Date;
  }): Promise<ActiveContentLink | null>;

  /** Canjea el token por una sesión de ese evento (`app.redeem_content_link`). */
  redeem(input: {
    readonly token: string;
    readonly sessionToken: string;
    readonly sessionTtlMs: number;
    readonly ip: string | null;
    readonly userAgent: string | null;
  }): Promise<RedeemContentLinkOutcome>;
}
