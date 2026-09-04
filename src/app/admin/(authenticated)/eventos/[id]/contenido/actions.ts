'use server';

import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';
import type { EventContentDraftInput } from '@/domain/events/event-content-draft';
import {
  editEventContent,
  findEventForPlatform,
  publishEvent,
  shareContentLink,
} from '@/infrastructure/container';
import { requirePlatformCredentials } from '@/lib/auth/current-session';
import {
  INITIAL_ADMIN_CONTENT_STATE,
  INITIAL_PUBLISH_STATE,
  type AdminContentState,
  type PublishState,
} from './form-state';

/**
 * Las tres cosas que la plataforma puede hacer con el contenido de un evento ajeno.
 *
 * Guardar, publicar y pasarle el enlace al cliente. Las tres empiezan igual —credenciales de
 * plataforma y resolver a qué cliente pertenece el evento— porque la dirección solo trae el
 * identificador del evento y abrir el contexto de un cliente exige saber cuál.
 *
 * Ninguna confía en lo que llega del formulario para eso: el `clientId` se resuelve **en el
 * servidor** a partir del evento. Mandarlo en un campo oculto habría sido más cómodo y sería el
 * agujero de manual — un `clientId` cualquiera en la petición y a ver qué contesta la base.
 */

export async function saveAdminContentAction(
  _previous: AdminContentState,
  formData: FormData,
): Promise<AdminContentState> {
  const credentials = await requirePlatformCredentials();
  const eventId = readText(formData, 'eventId');
  const event = await findEventForPlatform.execute(credentials, eventId);

  if (event === null) notFound();

  const draft: EventContentDraftInput = {
    celebrantName: readText(formData, 'celebrantName'),
    celebrantFullName: readText(formData, 'celebrantFullName'),
    celebrantLastName: readText(formData, 'celebrantLastName'),
    eventTypeLabel: readText(formData, 'eventTypeLabel'),
    tagline: readText(formData, 'tagline'),
    story: readText(formData, 'story'),
    date: readText(formData, 'date'),
    time: readText(formData, 'time'),
    city: readText(formData, 'city'),
    heroImageUrl: readText(formData, 'heroImageUrl'),
    storyImageUrl: readText(formData, 'storyImageUrl'),
    closingImageUrl: readText(formData, 'closingImageUrl'),
    contactPhone: readText(formData, 'contactPhone'),
    contactWhatsapp: readText(formData, 'contactWhatsapp'),
    contactInstagram: readText(formData, 'contactInstagram'),
    rsvpDeadline: readText(formData, 'rsvpDeadline'),
  };

  const result = await editEventContent.saveAsPlatform(
    credentials,
    event.clientId,
    eventId,
    draft,
    parseCollections(readText(formData, 'collections')),
  );

  switch (result.outcome) {
    case 'saved':
      revalidatePath(`/admin/eventos/${eventId}/contenido`);
      revalidatePath('/admin/eventos');

      return {
        ...INITIAL_ADMIN_CONTENT_STATE,
        status: 'success',
        message: 'Contenido guardado. El evento ya no espera al cliente.',
      };
    case 'invalid':
      return {
        ...INITIAL_ADMIN_CONTENT_STATE,
        status: 'error',
        message: 'Revisa los campos marcados.',
        errors: result.errors,
      };
    case 'not-found':
      return {
        ...INITIAL_ADMIN_CONTENT_STATE,
        status: 'error',
        message: 'Este evento ya no está disponible.',
      };
  }
}

export async function publishEventAction(
  _previous: PublishState,
  formData: FormData,
): Promise<PublishState> {
  const credentials = await requirePlatformCredentials();
  const eventId = readText(formData, 'eventId');
  const event = await findEventForPlatform.execute(credentials, eventId);

  if (event === null) notFound();

  const result = await publishEvent.execute(credentials, event.clientId, eventId);

  switch (result.outcome) {
    case 'published':
      revalidatePath(`/admin/eventos/${eventId}/contenido`);
      revalidatePath('/admin/eventos');
      revalidatePath(`/admin/clientes/${event.clientId}`);

      return {
        ...INITIAL_PUBLISH_STATE,
        status: 'success',
        message: 'Publicado. La invitación ya responde en su dirección.',
      };
    case 'incomplete':
      return {
        ...INITIAL_PUBLISH_STATE,
        status: 'error',
        message: 'Todavía falta información para publicar.',
        /* La lista viaja al cliente para poder enseñarla campo por campo: un «falta algo» sin
           decir qué obliga a recorrer cinco tarjetas buscando el hueco. */
        missing: result.completeness.blocks,
      };
    case 'wrong-status':
      return {
        ...INITIAL_PUBLISH_STATE,
        status: 'error',
        message:
          result.status === 'published'
            ? 'Este evento ya estaba publicado.'
            : 'Este evento ya no se puede publicar desde el estado en el que está.',
      };
    case 'forbidden':
    case 'not-found':
      return {
        ...INITIAL_PUBLISH_STATE,
        status: 'error',
        message: 'Este evento ya no está disponible.',
      };
  }
}

export async function shareContentLinkAction(
  _previous: PublishState,
  formData: FormData,
): Promise<PublishState> {
  const credentials = await requirePlatformCredentials();
  const eventId = readText(formData, 'eventId');
  const event = await findEventForPlatform.execute(credentials, eventId);

  if (event === null) notFound();

  const result = await shareContentLink.execute(credentials, event.clientId, eventId);

  if (result.outcome !== 'shared') {
    return {
      ...INITIAL_PUBLISH_STATE,
      status: 'error',
      message: 'No se pudo preparar el enlace para el cliente.',
    };
  }

  revalidatePath('/admin/eventos');
  revalidatePath(`/admin/eventos/${eventId}/contenido`);

  return {
    ...INITIAL_PUBLISH_STATE,
    status: 'success',
    message: result.emailed
      ? 'Enlace enviado por correo. También puedes copiarlo aquí.'
      : 'El evento ya espera al cliente. Cópiale el enlace: no pudimos enviarle el correo.',
    /* El enlace vuelve siempre, se haya mandado el correo o no. Es lo que permite pegárselo al
       cliente por WhatsApp, que es como se resuelve la mitad de estas conversaciones. */
    contentUrl: result.url,
  };
}

/** Lo que llega del campo oculto con las colecciones, tolerando basura. */
function parseCollections(raw: string): {
  readonly venues: readonly unknown[];
  readonly schedule: readonly unknown[];
  readonly gallery: readonly unknown[];
} {
  const empty = { venues: [], schedule: [], gallery: [] };

  if (raw.length === 0) return empty;

  try {
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== 'object' || parsed === null) return empty;

    const value = parsed as Record<string, unknown>;

    return {
      venues: Array.isArray(value.venues) ? value.venues : [],
      schedule: Array.isArray(value.schedule) ? value.schedule : [],
      gallery: Array.isArray(value.gallery) ? value.gallery : [],
    };
  } catch {
    return empty;
  }
}

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === 'string' ? value.trim() : '';
}
