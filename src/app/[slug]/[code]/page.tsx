import { cache } from 'react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { InvitationRenderer } from '@/components/invitation/InvitationRenderer';
import { InvitationUnavailable } from '@/components/marketing/InvitationUnavailable';
import type { InvitationAccessResult } from '@/domain/events/invitation';
import { assembleInvitation } from '@/domain/invitation/event-content';
import { parseInvitationTheme } from '@/domain/invitation/theme';
import { resolveInvitation } from '@/infrastructure/container';
import { clientIpFromHeaders } from '@/lib/request-ip';

interface PageProps {
  params: Promise<{ slug: string; code: string }>;
}

/**
 * Resolución compartida entre `generateMetadata` y el componente de página.
 *
 * `cache()` de React deduplica la llamada dentro de una misma petición. Sin esto,
 * Next ejecutaría la resolución dos veces —una por la metadata y otra por el render—,
 * lo que registraría dos intentos y consumiría el doble del presupuesto de la IP.
 * Un invitado legítimo agotaría su límite en la mitad de recargas.
 */
const resolveAccess = cache(
  async (slug: string, code: string, clientIp: string | null): Promise<InvitationAccessResult> =>
    resolveInvitation.execute({ slug, code, clientIp }),
);

/** Lee la IP una sola vez por petición, por el mismo motivo que arriba. */
const requestIp = cache(async (): Promise<string | null> =>
  clientIpFromHeaders(await headers()),
);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, code } = await params;
  const access = await resolveAccess(slug, code, await requestIp());

  /*
   * Sin acceso no se filtra ni el título. Si la metadata revelara el nombre del
   * festejado, bastaría con pedir la página y leer el <title> para saber qué eventos
   * existen, sin necesidad de acertar el código.
   */
  if (access.outcome !== 'granted') {
    return { title: 'Invitaciones digitales', robots: { index: false, follow: false } };
  }

  const { invitation } = access;
  const fullName = invitation.celebrantFullName ?? invitation.celebrantName;
  const description = invitation.tagline ?? `Te invitamos a celebrar con ${fullName}.`;

  return {
    title: `${fullName} · ${invitation.eventTypeLabel ?? 'Celebración'}`,
    description,
    /*
     * Las invitaciones no se indexan. Son privadas por diseño: si Google las rastreara,
     * el código de acceso dejaría de servir de nada en cuanto una apareciera en los
     * resultados de búsqueda.
     */
    robots: { index: false, follow: false, nocache: true },
    openGraph: {
      type: 'website',
      locale: 'es_MX',
      title: `${fullName} ${invitation.celebrantLastName ?? ''}`.trim(),
      description,
      images: invitation.storyImageUrl ? [{ url: invitation.storyImageUrl }] : undefined,
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function InvitationPage({ params }: PageProps) {
  const { slug, code } = await params;
  const access = await resolveAccess(slug, code, await requestIp());

  /*
   * Código incorrecto, evento inexistente, borrador o vencido: todos acaban en la
   * landing. No se distinguen ni con un mensaje de error, porque cualquier diferencia
   * de comportamiento serviría para averiguar qué invitaciones existen.
   */
  if (access.outcome === 'denied') {
    redirect('/');
  }

  /*
   * El límite sí se señala, con un parámetro que la landing puede leer para avisar
   * discretamente. Que exista un límite no es secreto, y sin ninguna pista un invitado
   * que se equivocó al teclear varias veces se quedaría sin entender por qué rebota.
   */
  if (access.outcome === 'rate-limited') {
    redirect('/?acceso=limite');
  }

  /*
   * El código es bueno pero la invitación no está a la vista todavía. Es el único caso en el que
   * a quien llega se le cuenta algo: ver `InvitationUnavailable`.
   */
  if (access.outcome === 'unavailable') {
    return <InvitationUnavailable reason={access.reason} />;
  }

  /*
   * De aquí en adelante no hay ninguna decisión más que tomar sobre qué se ve: los bloques, su
   * orden, sus variantes y el tema salen del evento. El motor los pinta.
   *
   * Las dos llamadas son puras y del dominio: una compone el contenido de cada bloque a partir
   * del evento (`event-content.ts`) y la otra interpreta los tokens del tema reparando el
   * contraste (`theme.ts`). Ninguna lanza — una invitación repartida no puede caerse porque un
   * bloque esté a medio configurar.
   */
  const { content } = access;

  return (
    <InvitationRenderer
      theme={parseInvitationTheme(content.themeTokens)}
      blocks={assembleInvitation(content.source, content.blocks)}
      musicUrl={content.musicUrl}
      musicTitle={content.musicTitle}
    />
  );
}
