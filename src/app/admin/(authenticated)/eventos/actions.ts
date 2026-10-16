'use server';

import { revalidatePath } from 'next/cache';
import type { EditableEventDetails } from '@/domain/events/event-details';
import { createEvent, editEventDetails } from '@/infrastructure/container';
import { requirePlatformCredentials } from '@/lib/auth/current-session';
import {
  INITIAL_NEW_EVENT_STATE,
  type EditEventState,
  type NewEventState,
} from './form-state';

/**
 * Alta de un evento.
 *
 * Vive bajo `/admin/eventos` aunque la usen dos pantallas —la lista de eventos y la ficha de un
 * cliente—. La acción es sobre eventos, así que este es su sitio; la ficha del cliente la importa
 * de aquí en lugar de tener una copia propia, que acabaría revalidando otras rutas y validando
 * otra cosa.
 *
 * Empieza por `requirePlatformCredentials()`, y no es ceremonia heredada del layout: una Server
 * Action es un endpoint HTTP que se puede invocar directamente, sin pasar por ninguna pantalla.
 * Un layout no protege una acción — solo protege lo que se renderiza.
 *
 * Y esa comprobación tampoco es la última: `app.authorize_client_context()` vuelve a resolver el
 * privilegio contra el hash del token antes de dejar abrir el contexto del cliente, y Row-Level
 * Security acota la escritura a ese cliente. Son tres capas y ninguna sobra.
 *
 * ## El cliente llega por el formulario, y da igual de dónde venga
 *
 * Desde la ficha de un cliente el identificador viaja en un campo oculto y desde la lista de
 * eventos en un desplegable, pero para esta acción son lo mismo: dos campos del formulario que
 * escribe el navegador y que, por lo tanto, cualquiera puede cambiar. Que uno no se vea en la
 * pantalla no lo hace más de fiar, y por eso la autorización no depende de por dónde entró.
 */
export async function createEventAction(
  _previous: NewEventState,
  formData: FormData,
): Promise<NewEventState> {
  const credentials = await requirePlatformCredentials();

  const result = await createEvent.execute(credentials, {
    clientId: readText(formData, 'clientId'),
    eventTypeKey: readText(formData, 'eventTypeKey'),
    planKey: readText(formData, 'planKey'),
    templateId: readText(formData, 'templateId'),
    themeId: readText(formData, 'themeId'),
    title: readText(formData, 'title'),
    celebrantName: readText(formData, 'celebrantName'),
    date: readText(formData, 'date'),
    time: readText(formData, 'time'),
    timeZone: readText(formData, 'timeZone'),
    slug: readText(formData, 'slug'),
    clientFillsContent: readText(formData, 'clientFillsContent'),
  });

  switch (result.outcome) {
    case 'created':
      /*
       * Se revalidan las tres pantallas donde el evento nuevo tiene que aparecer, y no solo
       * aquella desde la que se dio de alta: la ficha del cliente lista sus eventos, y el resumen
       * de plataforma los cuenta. Sin esto, dar de alta desde la lista dejaría la ficha del
       * cliente enseñando el conteo anterior hasta la siguiente recarga completa.
       */
      revalidatePath('/admin/eventos');
      revalidatePath(`/admin/clientes/${readText(formData, 'clientId')}`);
      revalidatePath('/admin/clientes');
      revalidatePath('/admin');

      return {
        status: 'success',
        message: 'Evento creado. Ya tiene su invitación y su enlace.',
        errors: {},
        created: {
          eventId: result.eventId,
          title: readText(formData, 'title'),
          slug: result.slug,
          accessCode: result.accessCode,
        },
      };

    case 'invalid':
      return {
        ...INITIAL_NEW_EVENT_STATE,
        status: 'error',
        message: 'Revisa los campos marcados.',
        errors: result.errors,
      };

    case 'slug-taken':
      /*
       * El motivo se pinta en el campo de la dirección aunque quien la escribió pueda no haberla
       * escrito: cuando se deriva del nombre, el aviso aparece en el control donde se corrige.
       * Y puede estar ocupada por el evento de OTRO cliente —el único de `slug` es global—, así
       * que no se dice de quién es.
       */
      return {
        ...INITIAL_NEW_EVENT_STATE,
        status: 'error',
        message: 'Esa dirección ya está ocupada.',
        errors: { slug: 'Ya hay una invitación en esa dirección. Escribe otra.' },
      };

    case 'unknown-catalog':
      return {
        ...INITIAL_NEW_EVENT_STATE,
        status: 'error',
        message: 'El plan, la plantilla o el tema que llegaron no existen. Vuelve a elegirlos.',
      };

    case 'forbidden':
      /*
       * No se detalla. Sesión que ya no vale, cuenta sin rol de plataforma o cliente suspendido
       * acaban en el mismo mensaje: distinguirlos solo serviría para explicarle a quien no
       * debería estar intentándolo por qué exactamente no puede.
       */
      return {
        ...INITIAL_NEW_EVENT_STATE,
        status: 'error',
        message: 'No se pudo crear el evento.',
      };
  }
}

/**
 * Los datos actuales de un evento, para arrancar el formulario «Editar evento».
 *
 * Es una acción y no una prop porque el diálogo se abre desde tablas —la lista de eventos y la
 * ficha de un cliente— cuyas filas no traen plantilla, tema ni hora local. Traerlos para todas
 * las filas por si alguien pulsa el lápiz en una sería pagar por adelantado lo que casi nunca se
 * usa.
 */
export async function loadEventDetailsAction(
  eventId: string,
): Promise<EditableEventDetails | null> {
  const credentials = await requirePlatformCredentials();

  return editEventDetails.load(credentials, eventId);
}

/** Guarda «Editar evento». Las mismas tres capas que el alta; ver la cabecera del archivo. */
export async function updateEventDetailsAction(
  _previous: EditEventState,
  formData: FormData,
): Promise<EditEventState> {
  const credentials = await requirePlatformCredentials();
  const eventId = readText(formData, 'eventId');

  const result = await editEventDetails.save(credentials, eventId, {
    title: readText(formData, 'title'),
    date: readText(formData, 'date'),
    time: readText(formData, 'time'),
    timeZone: readText(formData, 'timeZone'),
    planKey: readText(formData, 'planKey'),
    templateId: readText(formData, 'templateId'),
    themeId: readText(formData, 'themeId'),
  });

  switch (result.outcome) {
    case 'updated':
      /* El cliente no viaja en el formulario, así que se revalida su rama entera: la ficha del
         cliente que abrió el diálogo cuelga de ahí. */
      revalidatePath('/admin/eventos', 'layout');
      revalidatePath('/admin/clientes', 'layout');
      revalidatePath('/admin');

      return {
        status: 'success',
        message: result.unpublished
          ? 'Evento actualizado. Volvió a borrador: publícalo de nuevo cuando esté listo.'
          : 'Evento actualizado.',
        errors: {},
      };

    case 'invalid':
      return { status: 'error', message: 'Revisa los campos marcados.', errors: result.errors };

    case 'incompatible-template':
      return {
        status: 'error',
        message: 'Esa plantilla no se ofrece para este tipo de evento o para el plan elegido.',
        errors: { templateId: 'Elige una plantilla que encaje con el plan.' },
      };

    case 'unknown-catalog':
      return {
        status: 'error',
        message: 'El plan, la plantilla o el tema ya no existen. Recarga la página.',
        errors: {},
      };

    case 'forbidden':
      return { status: 'error', message: 'No se pudo actualizar el evento.', errors: {} };
  }
}

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === 'string' ? value.trim() : '';
}
