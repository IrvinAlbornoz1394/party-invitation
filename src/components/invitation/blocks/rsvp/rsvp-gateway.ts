'use client';

import { createContext } from 'react';

/**
 * El punto por donde el botón de confirmar habla con la plataforma.
 *
 * Es **una costura, no una implementación**. El registro de confirmaciones todavía no existe, y
 * este archivo es lo que permite que los tres componentes estén terminados de todos modos: piden
 * la confirmación aquí, sin saber quién la atiende ni cómo. El día que haya una acción de
 * servidor de verdad, se conecta en un sitio y ninguno de los tres se toca.
 *
 * ## Por qué por contexto y no por propiedades
 *
 * Porque una variante recibe **solo `content`** —esa es la regla del catálogo— y una función no
 * cabe en un jsonb. Además, quien sabe cómo confirmar no es el bloque sino quien lo está
 * renderizando: la invitación real la conectará a su acción de servidor y la previsualización
 * del panel a una simulación. El componente es el mismo en los dos sitios.
 *
 * ## Por qué el valor por defecto dice «no disponible» y no finge
 *
 * Podría devolver «listo» y quedaría bonito en la demo. Sería el peor fallo imaginable de este
 * bloque: alguien pulsa, lee «tu asistencia quedó confirmada», se queda tranquilo y no aparece
 * en ninguna lista. Un mensaje honesto de que la confirmación no está disponible manda a esa
 * persona a preguntar por WhatsApp; una confirmación falsa la manda al silencio.
 */

/**
 * Lo que la familia responde: cuántos van, o que no van y —si quieren— por qué.
 *
 * El tope de `attendees` es el cupo de la familia que abre el enlace (`useRsvpGuest`), no un campo
 * que el invitado rellene a su gusto; el servidor lo vuelve a comprobar. Es la misma forma que
 * `rsvpReplySchema` en el dominio, que es quien la valida al llegar.
 */
export type RsvpSubmission =
  | { readonly attending: true; readonly attendees: number }
  | { readonly attending: false; readonly message: string | null };

export type RsvpResult =
  | { readonly status: 'ok' }
  /** No hay quien atienda la confirmación: el bloque lo dice y ofrece la alternativa. */
  | { readonly status: 'unavailable' }
  | { readonly status: 'error'; readonly message: string };

export type RsvpGateway = (submission: RsvpSubmission) => Promise<RsvpResult>;

const unavailableGateway: RsvpGateway = async () => ({ status: 'unavailable' });

/**
 * El contexto vive aquí, sin el proveedor ni el hook, y los tres archivos existen por lo mismo:
 * un módulo que mezcla componentes con otras cosas rompe la recarga en caliente de Next, que
 * recarga la página entera en lugar de aplicar el cambio en el sitio.
 */
export const RsvpGatewayContext = createContext<RsvpGateway>(unavailableGateway);
