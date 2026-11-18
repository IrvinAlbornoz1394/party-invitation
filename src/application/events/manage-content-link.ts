import { canAdministerPlatform } from '@/domain/auth/actor';
import type { PlatformCredentials } from '@/domain/auth/platform-credentials';
import { generateSessionToken, SESSION_TTL_MS } from '@/domain/auth/session';
import {
  CONTENT_LINK_TTL_MS,
  type ContentLinkRepository,
  type RedeemContentLinkOutcome,
} from '@/domain/events/content-link';

/** Lo que enseña el modal del admin: el enlace vigente, o que no hay ninguno. */
export type ContentLinkState =
  | {
      readonly outcome: 'active';
      readonly url: string;
      readonly expiresAt: Date;
      readonly openedAt: Date | null;
    }
  | { readonly outcome: 'none' }
  | { readonly outcome: 'forbidden' };

/**
 * El enlace del cliente, del lado del admin: verlo para copiarlo, o generar uno nuevo.
 *
 * Ya no se manda por correo. El admin lo pega en el WhatsApp del cliente, que es donde de verdad
 * se habla con él, y el correo solo añadía un enlace más que podía acabar en spam.
 */
export class ManageContentLink {
  constructor(
    private readonly links: ContentLinkRepository,
    private readonly siteUrl: string,
  ) {}

  async current(credentials: PlatformCredentials, clientId: string, eventId: string): Promise<ContentLinkState> {
    if (!canAdministerPlatform(credentials.actor)) return { outcome: 'forbidden' };

    const link = await this.links.findActive(credentials, clientId, eventId);

    return link
      ? { outcome: 'active', url: contentLinkUrl(this.siteUrl, link.token), expiresAt: link.expiresAt, openedAt: link.openedAt }
      : { outcome: 'none' };
  }

  /** Genera uno nuevo y revoca el anterior: el enlace que se hubiera mandado antes deja de servir. */
  async generate(credentials: PlatformCredentials, clientId: string, eventId: string): Promise<ContentLinkState> {
    if (!canAdministerPlatform(credentials.actor)) return { outcome: 'forbidden' };

    const link = await this.links.issue({
      credentials,
      clientId,
      eventId,
      expiresAt: new Date(Date.now() + CONTENT_LINK_TTL_MS),
    });

    return link
      ? { outcome: 'active', url: contentLinkUrl(this.siteUrl, link.token), expiresAt: link.expiresAt, openedAt: link.openedAt }
      : { outcome: 'none' };
  }
}

export type RedeemContentLinkResult =
  | (Extract<RedeemContentLinkOutcome, { outcome: 'ok' }> & { readonly sessionToken: string })
  | Exclude<RedeemContentLinkOutcome, { outcome: 'ok' }>;

/**
 * El cliente pulsa «Entrar» en la página del enlace y queda con la sesión abierta.
 *
 * La sesión dura lo normal (`SESSION_TTL_MS`): el enlace vence a los cinco días, pero quien ya
 * entró sigue dentro y puede volver a su formulario hasta enviarlo, sin enlace nuevo.
 */
export class RedeemContentLink {
  constructor(private readonly links: ContentLinkRepository) {}

  async execute(input: {
    readonly token: string;
    readonly ip: string | null;
    readonly userAgent: string | null;
  }): Promise<RedeemContentLinkResult> {
    /* Un token mal formado no llega a la base: los nuestros son 43 caracteres base64url. */
    if (!/^[A-Za-z0-9_-]{20,100}$/.test(input.token)) return { outcome: 'invalid' };

    const sessionToken = generateSessionToken();
    const result = await this.links.redeem({
      token: input.token,
      sessionToken,
      sessionTtlMs: SESSION_TTL_MS,
      ip: input.ip,
      userAgent: input.userAgent,
    });

    return result.outcome === 'ok' ? { ...result, sessionToken } : result;
  }
}

/** La dirección que se pega en el WhatsApp del cliente. */
export function contentLinkUrl(siteUrl: string, token: string): string {
  return `${siteUrl}/llenar/${token}`;
}
