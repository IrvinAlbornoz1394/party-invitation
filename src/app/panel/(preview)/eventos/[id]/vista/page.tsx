import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { tenantScopeOf } from '@/domain/auth/actor';
import { InvitationRenderer } from '@/components/invitation/InvitationRenderer';
import { assembleInvitation } from '@/domain/invitation/event-content';
import { parseInvitationTheme } from '@/domain/invitation/theme';
import { editEventContent } from '@/infrastructure/container';
import { requireEventAccess } from '@/lib/auth/current-session';

export const metadata: Metadata = {
  title: 'Vista previa',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * La invitación de un evento, tal como se verá, dentro del panel.
 *
 * Existe para que el editor de contenido tenga algo real que enseñar al lado del formulario. Usa
 * `InvitationRenderer` y `assembleInvitation` —los mismos que sirven la invitación al invitado—
 * y por eso lo que se ve aquí no es una aproximación: es la pieza.
 *
 * ## Por qué es una ruta y no un componente dentro del editor
 *
 * Podría montarse el renderizador directamente en la pantalla de contenido, y sería peor por dos
 * motivos que se notan enseguida.
 *
 * El primero es el CSS. La invitación se pinta con Tailwind y sin preflight, y los dos paneles
 * con antd; meter las dos cosas en el mismo documento es la pelea de especificidad que
 * `docs/BACKEND.md` describe en «Estilos». En un `<iframe>` la invitación tiene su propio
 * documento y no hay nada que negociar.
 *
 * El segundo es que la invitación se dimensiona para un teléfono. Dentro de un panel de
 * escritorio heredaría el ancho del contenedor y sus medias queries dirían «escritorio»; en el
 * marco, el `<iframe>` **es** el viewport, así que se ve exactamente lo que verá quien la abra.
 *
 * ## Vive en su propio grupo de rutas
 *
 * Fuera de `(event)`, cuyo layout envuelve todo en el armazón del panel: dentro del marco no
 * puede haber menú ni cabecera. Y fuera de `(authenticated)`, cuyo layout exige alcance de
 * cliente — así un visor también puede ver la invitación de su evento, que es de las pocas cosas
 * que un visor sí debería poder mirar.
 *
 * La autorización es la de siempre: `requireEventAccess()` responde 404 tanto si el evento no
 * existe como si no se alcanza. No hay código de invitación ni límite por IP en este camino, y no
 * hacen falta: quien mira su propio borrador no está adivinando nada. Tampoco se exige que esté
 * publicado — ver el borrador antes de publicarlo es justamente para lo que existe.
 */
export default async function EventPreviewPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { membership } = await requireEventAccess(id);

  /*
   * `tenantScopeOf` y no el actor: mirar es una lectura, y le basta el alcance. Es lo que permite
   * que un visor vea la invitación de su evento sin que esta pantalla tenga que fabricarle un
   * actor de escritura que no le corresponde.
   */
  const loaded = await editEventContent.preview(tenantScopeOf(membership), id);

  if (!loaded) notFound();

  const theme = parseInvitationTheme(loaded.content.themeTokens);
  const blocks = assembleInvitation(loaded.content.source, loaded.content.blocks);

  return (
    <InvitationRenderer
      theme={theme}
      blocks={blocks}
      musicUrl={loaded.content.musicUrl}
      musicTitle={loaded.content.musicTitle}
    />
  );
}
