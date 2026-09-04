import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { InvitationRenderer } from '@/components/invitation/InvitationRenderer';
import { assembleInvitation } from '@/domain/invitation/event-content';
import { parseInvitationTheme } from '@/domain/invitation/theme';
import { editEventContent, findEventForPlatform } from '@/infrastructure/container';
import { requirePlatformCredentials } from '@/lib/auth/current-session';

export const metadata: Metadata = {
  title: 'Vista previa',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * La invitación de un evento, vista por la plataforma.
 *
 * Es la gemela de `/panel/eventos/[id]/vista` y existe por lo mismo que aquella —el marco de la
 * vista previa tiene que ser su propio documento, ver su cabecera— más una razón propia: la del
 * panel exige **membresía en el cliente**, y un admin de plataforma no la tiene. Sin esta ruta,
 * el editor de contenido del admin enseñaría un 404 dentro del marco.
 *
 * Vive en el grupo `(preview)` para no heredar el armazón del panel: dentro de un `<iframe>` no
 * puede haber menú ni cabecera.
 *
 * La autorización es la de siempre en `/admin`: credenciales de plataforma, y el contexto del
 * cliente se abre para la ocasión a partir del evento —el `clientId` se resuelve en el servidor,
 * nunca llega por la URL—.
 */
export default async function AdminEventPreviewPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const credentials = await requirePlatformCredentials();
  const event = await findEventForPlatform.execute(credentials, id);

  if (event === null) notFound();

  const loaded = await editEventContent.previewAsPlatform(credentials, event.clientId, id);

  if (!loaded) notFound();

  return (
    <InvitationRenderer
      theme={parseInvitationTheme(loaded.content.themeTokens)}
      blocks={assembleInvitation(loaded.content.source, loaded.content.blocks)}
      musicUrl={loaded.content.musicUrl}
      musicTitle={loaded.content.musicTitle}
    />
  );
}
