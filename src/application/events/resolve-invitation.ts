import { normalizeAccessCode } from '@/domain/events/access-code';
import { normalizeEventSlug } from '@/domain/events/event-slug';
import type { InvitationAccessResult } from '@/domain/events/invitation';
import type { InvitationRepository } from '@/domain/events/invitation-repository';

export interface ResolveInvitationInput {
  readonly slug: string;
  readonly code: string;
  readonly clientIp: string | null;
}

/**
 * Caso de uso: abrir una invitación desde su URL pública.
 *
 * Recibe el repositorio por constructor en vez de importarlo: el caso de uso depende
 * de la interfaz del dominio, no de Drizzle. Así se puede probar con un doble en
 * memoria sin levantar Postgres.
 */
export class ResolveInvitation {
  constructor(private readonly invitations: InvitationRepository) {}

  async execute(input: ResolveInvitationInput): Promise<InvitationAccessResult> {
    /*
     * Validación de forma antes de tocar la base de datos.
     *
     * No es solo eficiencia: un slug o un código malformados no deben consumir el
     * presupuesto de intentos de esa IP. Si contaran, cualquiera podría agotarle el
     * límite a un invitado legítimo mandándole basura desde su misma red.
     */
    const slug = normalizeEventSlug(input.slug);
    if (slug === null) return { outcome: 'denied' };

    const code = normalizeAccessCode(input.code);
    if (code === null) return { outcome: 'denied' };

    return this.invitations.findForAccess({ slug, code, clientIp: input.clientIp });
  }
}
