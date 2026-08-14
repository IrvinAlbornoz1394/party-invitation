import { z } from 'zod';
import { blockActionSchema, blockImageSchema, line } from './shared';

/**
 * El contenido del bloque **confirmación de asistencia**, y con él el contrato de sus tres
 * componentes.
 *
 * Es el único bloque de la invitación que **pide algo**. Todo lo demás informa; esto convierte
 * a un invitado en un número en una lista, y de ese número dependen la comida, las sillas y el
 * salón. Por eso el botón es lo único que importa aquí y el resto de la sección existe para
 * llevar hasta él.
 *
 * ## Los dos caminos, y por qué no son dos variantes
 *
 * Una invitación puede confirmar de dos maneras:
 *
 *   · **`whatsapp`** — el botón abre una conversación con el número del organizador y el
 *     mensaje ya escrito. No se guarda nada: la respuesta llega a un teléfono y alguien la
 *     marca después en el panel.
 *   · **`managed`** — el botón lo registra la plataforma y el panel se entera solo.
 *
 * Eso **no** son dos componentes distintos, y la diferencia importa. `docs/PROJECT.md` prohíbe
 * que un componente ramifique por plan —`if (plan === "Premium")`—, y si el camino fuera una
 * variante del registro sería exactamente eso disfrazado: el catálogo tendría el doble de
 * entradas y elegir diseño y elegir mecanismo serían la misma decisión, cuando son dos.
 *
 * Aquí el destino es **contenido**: se guarda en el evento, los tres componentes lo obedecen y
 * cambiar de plan es cambiar un campo, no reasignar el bloque ni volver a maquetar nada. Quién
 * puede elegir `managed` lo decide el plan, y eso se comprueba donde se guarda —en el panel—,
 * no donde se pinta.
 *
 * ## El estado de `managed` hoy
 *
 * El registro en la plataforma todavía no existe. Los componentes ya están preparados: piden la
 * confirmación a la pasarela de `rsvp-gateway.ts`, que es un único punto de conexión. Mientras
 * no haya una de verdad, responde «no disponible» y el bloque lo dice en lugar de fingir que
 * guardó algo — que es el peor fallo posible en el único sitio donde alguien confía en que su
 * respuesta llegó.
 *
 * ## La personalización por familia: qué falta y dónde NO va
 *
 * Más adelante, en el plan superior, la invitación se repartirá personalizada: cada familia
 * recibirá su enlace y el bloque podrá saludarla por su nombre —«Familia Robles Cámara»— y
 * decirle cuántos lugares tiene apartados. Eso lo gestionará el organizador desde la lista de
 * invitados de su panel, que es donde `guest_groups` y `guests` ya están modelados.
 *
 * Hoy no está, y los componentes se han dejado **sin hueco reservado** a propósito. La razón es
 * de arquitectura y conviene fijarla ahora para no equivocarse después: el nombre de la familia
 * y su cupo **no son contenido de este bloque**. `event_blocks.config` guarda lo que es igual
 * para todos los invitados de un evento; el nombre de quien está mirando cambia con cada enlace.
 * Meterlo aquí obligaría a guardar una configuración por familia, que es exactamente lo que la
 * tabla de invitados existe para evitar.
 *
 * Cuando llegue, entrará como **contexto de quien visita** —igual que la pasarela de
 * confirmación—, resuelto en el servidor a partir del código del enlace. Los componentes lo
 * leerán con un hook y lo pintarán donde hoy no hay nada; el contrato de contenido no cambia.
 */

/** Solo dígitos, con lada de país y sin signos: el formato que exige `wa.me`. */
const whatsappPhone = z
  .string()
  .trim()
  .regex(/^\d{8,15}$/, 'El teléfono debe llevar lada de país y solo dígitos: 5219991234567');

/**
 * A dónde va el botón de confirmar.
 *
 * Unión discriminada y no un booleano con campos sueltos: con `kind: 'whatsapp'` el teléfono y
 * el mensaje son **obligatorios**, y con `managed` no existen. Un `isWhatsapp: true` con el
 * teléfono opcional dejaría guardar una invitación cuyo botón no lleva a ninguna parte, y eso
 * solo se descubre cuando un invitado lo pulsa.
 */
export const rsvpDestinationSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('whatsapp'),
    /** El número del organizador, con lada de país. */
    phone: whatsappPhone,
    /**
     * El mensaje que aparece ya escrito en el chat.
     *
     * Se redacta en el evento y no se compone aquí con el nombre del festejado. Es a propósito:
     * quien lo escribe sabe cómo quiere que le llegue —«Hola, soy … y confirmo para la boda de
     * Ana y Diego»— y ese texto también le dice al invitado qué datos hacen falta.
     */
    message: line(400),
  }),
  z.object({
    kind: z.literal('managed'),
  }),
]);

export type RsvpDestination = z.output<typeof rsvpDestinationSchema>;

export const rsvpContentSchema = z.object({
  /** El rótulo pequeño de arriba: «Nos ayudas mucho». */
  eyebrow: line(60).nullable().default(null),
  title: line(120),
  subtitle: line(240).nullable().default(null),
  /** La fecha límite, tal como se lee: «Antes del 1 de junio». */
  deadlineLabel: line(80).nullable().default(null),
  /** El texto del botón. Se puede cambiar, pero por defecto dice lo que hace. */
  confirmLabel: line(40).default('Confirmar asistencia'),
  destination: rsvpDestinationSchema,
  /**
   * La salida para quien no puede ir.
   *
   * Opcional y por ahora un enlace suelto —normalmente a otro chat de WhatsApp—. Está en el
   * contrato desde el principio porque no es un extra: una invitación que solo ofrece confirmar
   * deja «no puedo» sin camino, y entonces esa persona no responde nada y se queda contada como
   * pendiente hasta el día del evento.
   */
  declineAction: blockActionSchema.nullable().default(null),
  /** La nota al pie: «Si no confirmas antes del viernes, no podremos apartarte lugar». */
  note: line(240).nullable().default(null),
  image: blockImageSchema.nullable().default(null),
});

/** El contenido de la confirmación, ya validado y con los valores por defecto puestos. */
export type RsvpContent = z.output<typeof rsvpContentSchema>;

/** Lo que se guarda en `event_blocks.config`, antes de aplicar los valores por defecto. */
export type RsvpContentInput = z.input<typeof rsvpContentSchema>;

/**
 * La dirección que abre WhatsApp con el mensaje ya escrito.
 *
 * Vive en el dominio y no en el componente porque es una regla del producto: `wa.me` con el
 * número en dígitos y el texto codificado. Los componentes no la componen; la piden.
 *
 * `encodeURIComponent` no es opcional: el mensaje lleva acentos, comas y saltos de línea, y sin
 * codificar el enlace se corta en el primer carácter raro — el invitado abre WhatsApp con media
 * frase o con el chat vacío.
 */
export function whatsappUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
