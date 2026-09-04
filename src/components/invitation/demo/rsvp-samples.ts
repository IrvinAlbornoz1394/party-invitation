import { rsvpContentSchema, type RsvpContent } from '@/domain/invitation/blocks/rsvp';
import type { DemoSample } from './sample';

/**
 * Contenido de ejemplo para ver la confirmación sin tener que crear un evento.
 *
 * Mismas claves que el resto de bloques, y aquí los dos ejemplos sirven para algo muy concreto:
 * **enseñar los dos caminos del botón**, que es lo que distingue un plan del otro.
 *
 *   · **Boda** confirma por **WhatsApp**: el botón es un enlace que abre el chat del organizador
 *     con el mensaje ya escrito. Es el camino de Esencial y Plus, los planes sin panel.
 *   · **XV** confirma contra la **plataforma**: el botón llama a la pasarela y cambia de estado.
 *     Es el camino de Premium, y en el panel se ve funcionando porque la previsualización conecta
 *     una pasarela simulada.
 *
 * La boda lleva además la salida de «no podré asistir». Los dos cambian de fecha límite, de texto
 * del botón y de nota, que es lo que se configura en cada evento.
 *
 * Ninguno pide **cuántos van**, y es a propósito: el cupo de cada familia llegará con la lista de
 * invitados del panel, en Premium, y entonces el bloque lo sabrá sin preguntarlo. Pedir hoy «vamos
 * ___ adultos» en un mensaje de WhatsApp que nadie procesa es trabajo para el invitado y una cifra
 * que se queda en un chat.
 */

export const RSVP_SAMPLES: readonly DemoSample<RsvpContent>[] = [
  {
    key: 'boda',
    name: 'Boda',
    content: rsvpContentSchema.parse({
      eyebrow: 'Nos vemos el 12 de junio',
      title: 'Confirma tu asistencia',
      subtitle: 'El servicio es en mesa, así que cada lugar cuenta.',
      deadlineLabel: 'Antes del 12 de mayo',
      confirmLabel: 'Ahí estaré',
      destination: {
        kind: 'whatsapp',
        phone: '5219999876543',
        message: 'Hola, soy ___ y confirmo mi asistencia a la boda de Ana y Diego.',
      },
      declineAction: {
        label: 'No podré asistir',
        href: 'https://wa.me/5219999876543?text=Hola%2C%20soy%20___%20y%20lamento%20no%20poder%20acompa%C3%B1arlos.',
      },
      note: 'Esta invitación es para adultos. Gracias por entenderlo.',
      image: null,
    }),
  },
  {
    key: 'quince',
    name: 'XV Años',
    content: rsvpContentSchema.parse({
      eyebrow: 'Te espero',
      title: 'Confirma tu lugar',
      subtitle: 'La hacienda nos pide cerrar la lista con dos semanas de anticipación.',
      deadlineLabel: 'Antes del 20 de octubre',
      confirmLabel: 'Confirmar asistencia',
      /* El camino de Premium: el botón registra la confirmación en la plataforma. */
      destination: { kind: 'managed' },
      declineAction: null,
      note: 'Tu lugar queda apartado en cuanto confirmes.',
      image: null,
    }),
  },
];
