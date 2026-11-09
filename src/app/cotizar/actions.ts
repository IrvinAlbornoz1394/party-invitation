'use server';

import { headers } from 'next/headers';
import { findPalette } from '@/domain/invitation/palettes';
import { submitProspect } from '@/infrastructure/container';
import { clientIpFromHeaders } from '@/lib/request-ip';
import { INITIAL_QUOTE_STATE, type QuoteFormState } from './form-state';

/**
 * Recibir una solicitud del formulario público.
 *
 * Es la única Server Action del proyecto que **no empieza comprobando quién llama**, y es
 * correcto: quien escribe aquí no tiene cuenta. Lo que la protege es otra cosa —el límite por IP y
 * el campo trampa— y vive en el caso de uso y en `app.submit_prospect()`, no aquí.
 *
 * Next comprueba la cabecera `Origin` de cada Server Action contra el host, así que estos POST no
 * se pueden disparar desde otro sitio. Eso cubre el CSRF sin token propio.
 */
export async function submitQuoteAction(
  _previous: QuoteFormState,
  formData: FormData,
): Promise<QuoteFormState> {
  const result = await submitProspect.execute(
    {
      contactName: read(formData, 'contactName'),
      contactPhone: read(formData, 'contactPhone'),
      contactEmail: read(formData, 'contactEmail'),
      eventTypeKey: read(formData, 'eventTypeKey'),
      eventDate: read(formData, 'eventDate'),
      guestRange: read(formData, 'guestRange'),
      templateKey: read(formData, 'templateKey'),
      planKey: read(formData, 'planKey'),
      message: withPaletteLine(
        read(formData, 'paletteKey'),
        withCelebrants(read(formData, 'celebrantNames'), read(formData, 'message')),
      ),
      website: read(formData, 'website'),
    },
    clientIpFromHeaders(await headers()),
  );

  switch (result.outcome) {
    case 'received':
      return {
        ...INITIAL_QUOTE_STATE,
        status: 'sent',
        message: 'Recibimos tu solicitud. Te escribimos por WhatsApp en menos de 24 horas.',
      };

    case 'rate-limited':
      /*
       * No dice cuántas van ni cuánto falta. Que exista un límite no es secreto, pero detallarlo
       * le daría a quien lo esté probando el dato exacto para esquivarlo — y a una persona normal,
       * que llegue aquí por pulsar dos veces, no le sirve de nada.
       */
      return {
        status: 'error',
        message: 'Ya recibimos varias solicitudes desde tu conexión. Espera un rato y vuelve a intentarlo.',
      };

    case 'invalid':
      return {
        status: 'error',
        message: 'Revisa tu nombre y tu teléfono: son los dos datos que necesitamos.',
      };
  }
}

/**
 * Los nombres de los festejados, delante del mensaje.
 *
 * Llegan casi siempre rellenos desde la invitación de prueba de la portada, y son lo primero que
 * quien atiende quiere saber. La tabla no tiene columna para ellos: en lugar de una migración para
 * un dato que solo se lee, viajan como primera línea del mensaje —«Festejados: Ana & Luis»—, que
 * es justo donde la bandeja y el correo de aviso ya lo enseñan. El total se corta en 1000, el
 * límite del mensaje en el dominio, para que los nombres no hagan rechazar una solicitud válida.
 */
function withCelebrants(names: string, message: string): string {
  const celebrants = names.slice(0, 80).trim();
  if (!celebrants) return message;

  return `Festejados: ${celebrants}${message ? `\n\n${message}` : ''}`.slice(0, 1000);
}

/**
 * La paleta con la que miraba la plantilla, como primera línea del mensaje — «Paleta: Talavera».
 *
 * Mismo razonamiento que los festejados: es un dato que solo se lee y no merece columna. Solo se
 * escribe si la clave existe en el banco (`domain/invitation/palettes.ts`), así que por aquí no
 * entra texto libre aunque alguien edite el campo oculto.
 */
function withPaletteLine(paletteKey: string, message: string): string {
  const palette = findPalette(paletteKey);
  if (!palette) return message;

  return `Paleta: ${palette.name}${message ? `\n${message}` : ''}`.slice(0, 1000);
}

function read(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === 'string' ? value.trim() : '';
}
