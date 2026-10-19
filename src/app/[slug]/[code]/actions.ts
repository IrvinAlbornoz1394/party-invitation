'use server';

import { headers } from 'next/headers';
import type { RsvpResult } from '@/components/invitation/blocks/rsvp/rsvp-gateway';
import { submitRsvp } from '@/infrastructure/container';
import { clientIpFromHeaders } from '@/lib/request-ip';

/**
 * La respuesta de una familia desde su enlace.
 *
 * Es pública y sin sesión: la autorización es el slug y el código, que el caso de uso vuelve a
 * resolver contra la base de datos con el mismo límite por IP que abre la invitación. Lo que
 * llega del navegador —incluida la respuesta— se trata como desconocido y se valida allí.
 *
 * Los mensajes hablan al invitado y no al organizador: ninguno dice por qué falló por dentro,
 * y todos le dejan un camino.
 */
export async function submitRsvpAction(
  slug: string,
  code: string,
  reply: unknown,
): Promise<RsvpResult> {
  const requestHeaders = await headers();

  const result = await submitRsvp.execute({
    slug,
    code,
    reply,
    clientIp: clientIpFromHeaders(requestHeaders),
    userAgent: requestHeaders.get('user-agent'),
  });

  switch (result.outcome) {
    case 'saved':
      return { status: 'ok' };
    case 'invalid':
      return { status: 'error', message: result.reason };
    case 'closed':
      return {
        status: 'error',
        message:
          'Esta invitación ya no recibe respuestas en línea. Escríbenos y con gusto lo anotamos.',
      };
    case 'rate-limited':
      return {
        status: 'error',
        message: 'Recibimos muchas respuestas seguidas. Espera unos minutos y vuelve a intentarlo.',
      };
    case 'denied':
      return {
        status: 'error',
        message: 'No pudimos guardar tu respuesta. Recarga la página y vuelve a intentarlo.',
      };
  }
}
