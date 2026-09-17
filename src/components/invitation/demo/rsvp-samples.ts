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
 * La boda lleva además la salida de «no podré asistir», y llega **pelada** —sin bajada y sin
 * nota—, que es el caso que hay que poder ver: el bloque tiene que sostenerse con el título, el
 * plazo y el botón. Los XV traen las dos, y entre los dos ejemplos se ven las dos maquetas.
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
      /* Sin bajada. La que había —«el servicio es en mesa, así que cada lugar cuenta»—
         justificaba la petición con un dato del banquete que ninguna de las nueve variantes
         necesita para leerse, y dejaba el título con una explicación pegada debajo. El de XV sí
         la lleva, así que las dos maquetas —con bajada y sin ella— se siguen viendo. */
      subtitle: null,
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
      /* Sin nota: lo que decía —que la invitación es para adultos— ya lo dice, y mejor, el
         bloque de detalles de esta misma demo («Solo adultos», en `details-samples.ts`).
         Repetido al pie de la confirmación se lee como una condición para poder confirmar. */
      note: null,
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
