'use server';

import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';
import type { EventContentDraftInput } from '@/domain/events/event-content-draft';
import { editEventContent, submitEventContent } from '@/infrastructure/container';
import { requireEventAccess } from '@/lib/auth/current-session';
import {
  INITIAL_CONTENT_STATE,
  INITIAL_SUBMIT_STATE,
  type ContentFormState,
  type SubmitState,
} from './form-state';

/**
 * Guardar el contenido de un evento.
 *
 * Empieza por `requireEventAccess()`, y no es ceremonia heredada del layout: una Server Action es
 * un endpoint HTTP que se puede invocar directamente, sin pasar por ninguna pantalla. Un layout
 * no protege una acción — solo protege lo que se renderiza.
 *
 * Y esa comprobación tampoco es la última. El alcance limita el UPDATE a lo que RLS permite, y la
 * política de la base de datos sigue en pie aunque las dos capas anteriores se escriban mal.
 *
 * ## El visor se queda fuera por los tipos
 *
 * `requireEventAccess` devuelve `scope: null` cuando el rol es `viewer`, porque no existe ningún
 * actor de escritura que representarlo. Sin actor no hay llamada que hacer, así que este camino se
 * corta con un 404 antes de tocar nada — y no por un `if (role === 'viewer')` que algún día
 * alguien pudiera olvidar en la acción siguiente.
 */
export async function saveEventContentAction(
  _previous: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  const eventId = readText(formData, 'eventId');
  const { scope } = await requireEventAccess(eventId);

  if (scope === null) notFound();

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

  /*
   * Las tres listas viajan como JSON en un campo oculto, y no como `venues[0][name]` repetido.
   * `FormData` no tiene forma nativa de expresar una lista de objetos ordenada: los nombres con
   * corchetes son una convención que hay que parsear a mano, y el orden dependería de que el
   * navegador conservara el de los campos. Con JSON, el orden ES el del array y quien lo valida
   * es el mismo esquema del dominio que valida todo lo demás.
   *
   * Un JSON mal formado —solo puede venir de una llamada hecha a mano— se trata como listas
   * vacías. Nunca revienta la acción: es el mismo criterio de fallar cerrado que el resto.
   */
  const collections = parseCollections(readText(formData, 'collections'));

  const result = await editEventContent.save(scope, eventId, draft, collections);

  switch (result.outcome) {
    case 'saved':
      /*
       * Se revalida la vista previa además de la propia pantalla. Sin eso el marco seguiría
       * enseñando el contenido anterior después de guardar, y quien captura leería «guardado» al
       * lado de una invitación que no ha cambiado — el peor mensaje posible, porque invita a
       * guardar otra vez.
       */
      revalidatePath(`/panel/eventos/${eventId}/vista`);
      revalidatePath(`/panel/eventos/${eventId}/contenido`);
      revalidatePath(`/panel/eventos/${eventId}`);

      return { ...INITIAL_CONTENT_STATE, status: 'success', message: 'Contenido guardado.' };

    case 'invalid':
      return {
        status: 'error',
        message: 'Revisa los campos marcados.',
        errors: result.errors,
      };

    case 'not-found':
      /*
       * El evento dejó de estar en el alcance entre cargar la pantalla y guardar: le retiraron el
       * acceso, o el evento se archivó. No se detalla cuál — es el mismo criterio que el resto del
       * producto y aquí además da igual, porque en los dos casos lo que toca es volver a entrar.
       */
      return {
        status: 'error',
        message: 'Este evento ya no está disponible para tu cuenta.',
        errors: {},
      };
  }
}

/** Lee las colecciones del campo oculto. Ante cualquier duda, tres listas vacías. */
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

/**
 * El cliente da por terminada su información.
 *
 * Comprueba, mueve el estado y avisa al equipo — el orden y el porqué están en
 * `SubmitEventContent`. Aquí solo se traduce el resultado a lo que la pantalla enseña.
 *
 * El acceso se vuelve a comprobar aunque el botón solo salga en la pantalla del evento: una
 * acción de servidor es una dirección pública, y el botón es una comodidad, no una barrera.
 */
export async function submitContentAction(
  _previous: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const eventId = readText(formData, 'eventId');
  const { scope } = await requireEventAccess(eventId);

  /* `scope` es nulo cuando la membresía es de solo lectura: un visor puede mirar la invitación
     de su evento y no puede mandarla a revisión, que es una escritura. */
  if (scope === null) notFound();

  const result = await submitEventContent.execute(scope, eventId);

  switch (result.outcome) {
    case 'submitted':
      revalidatePath(`/panel/eventos/${eventId}/contenido`);
      revalidatePath(`/panel/eventos/${eventId}`);

      return {
        status: 'success',
        message: result.notified
          ? 'Listo. Avisamos al equipo y lo revisamos en breve.'
          : 'Listo, ya lo tenemos. Lo revisamos en breve.',
      };
    case 'incomplete':
      return {
        ...INITIAL_SUBMIT_STATE,
        status: 'error',
        message: 'Todavía falta información. Revisa lo que aparece arriba.',
      };
    case 'wrong-status':
      return {
        ...INITIAL_SUBMIT_STATE,
        status: 'error',
        message: 'Este evento ya no está en borrador: puede que ya lo hayas mandado.',
      };
    case 'not-found':
      return {
        ...INITIAL_SUBMIT_STATE,
        status: 'error',
        message: 'Este evento ya no está disponible para tu cuenta.',
      };
  }
}
