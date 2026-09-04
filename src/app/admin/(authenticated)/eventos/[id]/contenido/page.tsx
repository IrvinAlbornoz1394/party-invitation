import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EventPublishPanel } from '@/components/dashboard/admin/EventPublishPanel';
import { EventContentScreen } from '@/components/dashboard/client/EventContentScreen';
import { editEventContent, findEventForPlatform } from '@/infrastructure/container';
import { requirePlatformCredentials } from '@/lib/auth/current-session';
import {
  publishEventAction,
  saveAdminContentAction,
  shareContentLinkAction,
} from './actions';
import { INITIAL_ADMIN_CONTENT_STATE, INITIAL_PUBLISH_STATE } from './form-state';

export const metadata: Metadata = {
  title: 'Contenido del evento · Plataforma',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * El contenido de un evento, llenado por la plataforma.
 *
 * Existe porque no todos los clientes llenan su formulario: muchos mandan los datos por WhatsApp
 * y esperan que se los capturemos. Hasta ahora eso no se podía hacer desde ninguna parte — el
 * editor vivía solo en el panel del cliente, detrás de una membresía que un admin no tiene.
 *
 * ## Es la misma pantalla, no una copia
 *
 * Reutiliza `EventContentScreen` con otra acción de guardado, otro encabezado y otra ruta de
 * vista previa. Escribir un segundo editor con los mismos trece campos y las mismas tres
 * colecciones habría sido más rápido hoy y una fuente de divergencia para siempre: el día que
 * los dos formularios no coincidieran, el admin guardaría algo que el cliente no puede escribir.
 *
 * ## El cliente se resuelve en el servidor
 *
 * La dirección solo trae el identificador del evento. A qué cliente pertenece lo dice
 * `findEventForPlatform`, y con eso se abre el contexto para la operación. Nunca llega por la
 * URL ni por un campo oculto: eso convertiría la pantalla en «dime de quién quieres ver el
 * contenido».
 */
export default async function AdminEventContentPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const credentials = await requirePlatformCredentials();
  const event = await findEventForPlatform.execute(credentials, id);

  if (event === null) notFound();

  const [draft, collections] = await Promise.all([
    editEventContent.loadAsPlatform(credentials, event.clientId, id),
    editEventContent.loadCollectionsAsPlatform(credentials, event.clientId, id),
  ]);

  if (!draft || !collections) notFound();

  return (
    <EventContentScreen
      eventId={id}
      draft={draft}
      collections={collections}
      timeZone={TIME_ZONE_LABEL}
      action={saveAdminContentAction}
      initialState={INITIAL_ADMIN_CONTENT_STATE}
      title={event.title}
      description={`Contenido de la invitación de ${event.clientName ?? 'este cliente'}. Se guarda igual que lo guardaría el cliente.`}
      previewUrl={`/admin/eventos/${id}/vista`}
      banner={
        <EventPublishPanel
          eventId={id}
          status={event.status}
          clientFillsContent={event.clientFillsContent}
          publishAction={publishEventAction}
          shareAction={shareContentLinkAction}
          initialState={INITIAL_PUBLISH_STATE}
        />
      }
    />
  );
}

/* La misma etiqueta que en el panel del cliente: la zona se enseña, no se edita. */
const TIME_ZONE_LABEL = 'Mérida';
