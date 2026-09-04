import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContentSubmitPanel } from '@/components/dashboard/client/ContentSubmitPanel';
import { EventContentScreen } from '@/components/dashboard/client/EventContentScreen';
import { editEventContent, submitEventContent } from '@/infrastructure/container';
import { requireEventAccess } from '@/lib/auth/current-session';
import { saveEventContentAction, submitContentAction } from './actions';
import { INITIAL_CONTENT_STATE, INITIAL_SUBMIT_STATE } from './form-state';

export const metadata: Metadata = {
  title: 'Contenido · Panel',
  robots: { index: false, follow: false, nocache: true },
};

/**
 * El contenido de un evento, editable por su cliente.
 *
 * Es la pantalla que existe en TODOS los planes, incluido Esencial, y con ella el panel deja de
 * ser exclusivo de Premium. La frontera del producto se movió el 2026-08-27: ya no separa
 * plataforma de cliente sino **contenido** de **diseño** (`docs/PROJECT.md`). Lo que el cliente
 * escribe aquí es suyo; la plantilla, el tema y las variantes siguen siendo del servicio.
 *
 * ## Un visor no entra
 *
 * `requireEventAccess` devuelve `scope: null` para un `viewer`, porque no hay ningún actor de
 * escritura que pueda representarlo. Sin actor no hay nada que cargar, así que responde 404 — el
 * mismo 404 que un evento inexistente. El menú tampoco enseña esta sección a un visor, pero eso
 * es una sugerencia de navegación y esto es el permiso: teclear la URL no sirve.
 *
 * La zona horaria se pasa a la pantalla y no se edita. Es un dato del evento que la plataforma
 * fija al darlo de alta, y cambiarla movería la hora de la boda sin que nadie tocara la hora.
 */
export default async function EventContentPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  /* La vuelta después del login: es la pantalla a la que apunta el correo que recibe el cliente,
     y sin esto acababa en el inicio del panel teniendo que buscar su evento. */
  const { scope } = await requireEventAccess(id, `/panel/eventos/${id}/contenido`);

  if (scope === null) notFound();

  /*
   * Las dos lecturas van en paralelo: no dependen entre sí y en serie cada carga de esta pantalla
   * pagaría dos viajes a la base uno detrás de otro.
   */
  const [draft, collections, progress] = await Promise.all([
    editEventContent.load(scope, id),
    editEventContent.loadCollections(scope, id),
    /* En qué punto está el evento y qué le falta. Se pide aquí, en el servidor y junto al resto,
       porque es lo primero que hay que enseñar: sin ello la pantalla es un formulario largo sin
       principio ni final. */
    submitEventContent.status(scope, id),
  ]);

  // Null significa que el evento no está en el alcance: mismo 404 que si no existiera.
  if (!draft) notFound();

  return (
    <EventContentScreen
      eventId={id}
      draft={draft}
      collections={collections}
      timeZone={TIME_ZONE_LABEL}
      action={saveEventContentAction}
      initialState={INITIAL_CONTENT_STATE}
      banner={
        progress && (
          <ContentSubmitPanel
            eventId={id}
            status={progress.status}
            missing={progress.completeness?.blocks ?? []}
            action={submitContentAction}
            initialState={INITIAL_SUBMIT_STATE}
          />
        )
      }
    />
  );
}

/**
 * La zona que se enseña junto a la hora.
 *
 * Escrita a mano y no leída del evento **por ahora**: `events.time_zone` existe y trae
 * `America/Merida` por defecto, pero traerla hasta aquí exige otra consulta y hoy todos los
 * eventos son de la misma. Cuando el producto venda fuera, esto sale de la fila del evento.
 */
const TIME_ZONE_LABEL = 'Mérida';
