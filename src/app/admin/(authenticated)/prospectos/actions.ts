'use server';

import { revalidatePath } from 'next/cache';
import { isProspectStatus, TOUCH_CHANNELS, type TouchChannel } from '@/domain/prospects/prospect';
import {
  convertProspectToClient,
  discardProspect,
  linkProspectToClient,
  recordProspectTouch,
  reopenProspect,
} from '@/infrastructure/container';
import { requirePlatformCredentials } from '@/lib/auth/current-session';
import { INITIAL_PROSPECT_STATE, type ProspectFormState } from './form-state';

/**
 * Anotar un contacto y, si se indica, mover el estado.
 *
 * Empieza por `requirePlatformCredentials()` y no es ceremonia heredada del layout: una Server
 * Action es un endpoint HTTP que se puede invocar sin pasar por ninguna pantalla. Además, las
 * funciones de prospectos exigen el hash del token, así que aquí no basta con saber quién es —hace
 * falta su sesión.
 *
 * Esta acción **no descarta**. Aunque el estado `lost` exista en el dominio, llegar a él por aquí
 * dejaría `lost_reason` vacío, que es justo la mitad interesante de la estadística; `descartar`
 * tiene su propia acción porque pide el motivo. Se responde diciéndolo en vez de ignorarlo en
 * silencio: un formulario que acepta y no hace lo que dice es peor que uno que se niega.
 */
export async function recordTouchAction(
  _previous: ProspectFormState,
  formData: FormData,
): Promise<ProspectFormState> {
  const credentials = await requirePlatformCredentials();

  const prospectId = read(formData, 'prospectId');
  const note = read(formData, 'note');

  if (note.length === 0) {
    return { status: 'error', message: 'Escribe qué pasó en la conversación.' };
  }

  const status = read(formData, 'status');

  if (status === 'lost') {
    return {
      status: 'error',
      message: 'Para cerrar una solicitud sin venta usa «Descartar»: ahí se pide el motivo.',
    };
  }

  const nextFollowUp = read(formData, 'nextFollowUp');

  const saved = await recordProspectTouch.execute({
    credentials,
    prospectId,
    channel: readChannel(formData),
    note,
    status: isProspectStatus(status) ? status : null,
    /*
     * La fecha llega como `YYYY-MM-DD` de un control nativo y se interpreta como el inicio de ese
     * día en la zona del servidor. Es suficiente aquí: «volver a escribirle el viernes» no
     * necesita hora, y el único uso del valor es compararlo con el ahora para decir si venció.
     */
    nextFollowUpAt: nextFollowUp.length > 0 ? new Date(`${nextFollowUp}T09:00:00`) : null,
    lostReason: null,
  });

  if (!saved) {
    return { status: 'error', message: 'No se pudo anotar. Vuelve a intentarlo.' };
  }

  return refreshed(prospectId, 'Anotado.');
}

/**
 * Crear el cliente a partir de la solicitud y vincularla, en un solo envío.
 *
 * Es el camino normal —cuando alguien compra, el cliente todavía no existe—, y por eso el
 * formulario llega con los datos del prospecto ya escritos. Prellenado no es «aceptado»: el
 * nombre del cliente es el que se factura y casi nunca es el que la persona tecleó en la web, así
 * que los campos se muestran abiertos y editables en vez de resolverse en silencio con lo que
 * había.
 */
export async function convertToClientAction(
  _previous: ProspectFormState,
  formData: FormData,
): Promise<ProspectFormState> {
  const credentials = await requirePlatformCredentials();

  const prospectId = read(formData, 'prospectId');

  const result = await convertProspectToClient.execute(credentials, {
    prospectId,
    name: read(formData, 'name'),
    slug: read(formData, 'slug'),
    contactEmail: read(formData, 'contactEmail'),
    contactPhone: read(formData, 'contactPhone'),
    ownerName: read(formData, 'ownerName'),
  });

  switch (result.outcome) {
    case 'converted':
      return refreshed(
        prospectId,
        'Cliente creado y solicitud vinculada. El siguiente paso es darle de alta su evento.',
      );

    /*
     * El alta y el vínculo son dos transacciones, así que este caso existe de verdad. Se cuenta
     * tal cual —el cliente está creado, lo que falta es el vínculo— porque el arreglo es un clic
     * en «ya es cliente», y un mensaje genérico de error llevaría a intentar crearlo otra vez y
     * chocar con el correo repetido.
     */
    case 'created-not-linked':
      revalidatePath('/admin/clientes');

      return refreshed(
        prospectId,
        'El cliente se creó, pero la solicitud no quedó vinculada. Vincúlala desde «Ya existe».',
      );

    case 'slug-taken':
      return { status: 'error', message: 'Ese identificador ya está en uso. Escribe otro.' };

    case 'email-taken':
      return {
        status: 'error',
        message:
          'Ese correo ya tiene cuenta en la plataforma. Si el cliente ya existe, vincúlalo desde «Ya existe».',
      };

    /* Una solicitud puede llegar sin correo —el formulario público solo exige WhatsApp— y el
       alta de un cliente no: hay que pedírselo antes de convertirla. */
    case 'invalid-email':
      return { status: 'error', message: 'El cliente necesita un correo de contacto.' };

    case 'invalid-name':
      return { status: 'error', message: 'Escribe el nombre del cliente.' };

    case 'invalid-slug':
      return {
        status: 'error',
        message: 'El identificador solo admite letras, números y guiones.',
      };

    case 'invalid-owner':
      return {
        status: 'error',
        message: 'Revisa el nombre y el correo de la persona responsable.',
      };

    case 'forbidden':
      return { status: 'error', message: 'No se pudo crear el cliente.' };
  }
}

/**
 * Vincular la solicitud con un cliente que ya existe.
 *
 * Es el otro camino de la conversión y no sobra con el de arriba: pasa a menudo que el cliente se
 * dio de alta antes de que alguien se acordara del prospecto —la misma familia que ya contrató la
 * boda—, y un flujo que solo supiera crear obligaría a inventar un cliente duplicado.
 */
export async function linkClientAction(
  _previous: ProspectFormState,
  formData: FormData,
): Promise<ProspectFormState> {
  const credentials = await requirePlatformCredentials();

  const prospectId = read(formData, 'prospectId');
  const clientId = read(formData, 'clientId');

  if (clientId.length === 0) {
    return { status: 'error', message: 'Elige con qué cliente se vincula.' };
  }

  const linked = await linkProspectToClient.execute({ credentials, prospectId, clientId });

  if (!linked) {
    return { status: 'error', message: 'No se pudo vincular. Revisa que el cliente exista.' };
  }

  return refreshed(prospectId, 'Vinculado. El siguiente paso es darle de alta su evento.');
}

/**
 * Descartar: cerrar la solicitud que no va a comprar.
 *
 * Pide el motivo y se niega sin él. Es la única salida cerrada además de la venta, y sin ella la
 * bandeja solo crecería —lo que la vuelve un archivo que nadie abre.
 */
export async function discardProspectAction(
  _previous: ProspectFormState,
  formData: FormData,
): Promise<ProspectFormState> {
  const credentials = await requirePlatformCredentials();

  const prospectId = read(formData, 'prospectId');
  const reason = read(formData, 'reason');

  if (reason.length === 0) {
    return { status: 'error', message: 'Escribe por qué se descarta.' };
  }

  const discarded = await discardProspect.execute({ credentials, prospectId, reason });

  if (!discarded) {
    return { status: 'error', message: 'No se pudo descartar. Vuelve a intentarlo.' };
  }

  return refreshed(prospectId, 'Descartada. Sale de la bandeja y sigue contando en las cifras.');
}

/** Reabrir una descartada, porque volvió a escribir. */
export async function reopenProspectAction(
  _previous: ProspectFormState,
  formData: FormData,
): Promise<ProspectFormState> {
  const credentials = await requirePlatformCredentials();

  const prospectId = read(formData, 'prospectId');
  const reopened = await reopenProspect.execute({ credentials, prospectId });

  if (!reopened) {
    return { status: 'error', message: 'No se pudo reabrir. Vuelve a intentarlo.' };
  }

  return refreshed(prospectId, 'Vuelve a la bandeja como contactada.');
}

/**
 * El final común de toda acción que salió bien: refrescar las dos pantallas y devolver el aviso.
 *
 * Se revalidan las dos siempre y no solo la que se estaba mirando, porque cualquiera de estas
 * escrituras cambia el estado del prospecto y con él la bandeja, sus cifras y el contador del
 * menú. Devolver el estado inicial con el mensaje encima es lo que deja el formulario limpio
 * después de un envío correcto.
 */
function refreshed(prospectId: string, message: string): ProspectFormState {
  revalidatePath(`/admin/prospectos/${prospectId}`);
  revalidatePath('/admin/prospectos');

  return { ...INITIAL_PROSPECT_STATE, status: 'success', message };
}

/** El canal, validado contra el dominio. Un valor desconocido cae en «otro», nunca revienta. */
function readChannel(formData: FormData): TouchChannel {
  const value = read(formData, 'channel');

  return (TOUCH_CHANNELS as readonly string[]).includes(value) ? (value as TouchChannel) : 'other';
}

function read(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === 'string' ? value.trim() : '';
}
