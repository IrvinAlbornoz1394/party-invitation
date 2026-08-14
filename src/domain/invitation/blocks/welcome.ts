import { z } from 'zod';
import { blockImageSchema, isoInstant, line } from './shared';

/**
 * El contenido del bloque **bienvenida**: la pantalla que tapa la invitación hasta que el
 * invitado decide entrar.
 *
 * No es otra portada. La portada (`hero`) es la primera sección de un documento que se lee de
 * arriba abajo; esta es una **puerta**: ocupa el alto entero, no se desplaza, y desaparece con
 * un gesto para no volver. Esa diferencia justifica que sea un bloque aparte y no una variante
 * de portada — una variante de portada que además tapara la página estaría prometiendo una cosa
 * y haciendo otra, y el catálogo no podría venderla por separado.
 *
 * ## Por qué su contenido es más corto que el de la portada
 *
 * Porque tiene un solo trabajo: dar el nombre y dejar pasar. No hay `tagline`, ni cuenta
 * regresiva, ni acción configurable — todo eso está en la invitación que hay detrás, a un clic.
 * Repetirlo aquí obligaría al invitado a leer dos veces lo mismo antes de ver nada, que es
 * exactamente cómo una pantalla de bienvenida pasa de ser un detalle a ser un peaje.
 *
 * Los campos que sí están son los que hacen falta para que la puerta se sostenga sola: quién
 * celebra, qué se celebra y —opcional— cuándo. `startsAt` no aparece por lo mismo: sin cuenta
 * regresiva no hay nada aquí que necesite el instante.
 *
 * ## `openLabel` es contenido, no un rótulo de sistema
 *
 * Es lo que dice el botón —«Abrir invitación», «Entrar», «Ábreme»— y lo escribe quien invita,
 * en su voz. Con un texto fijo en el código, la misma frase saldría en una boda formal y en unos
 * XV, y sería el único texto de toda la invitación que el organizador no puede tocar.
 */

export const welcomeContentSchema = z.object({
  /** El rótulo pequeño: «Mis XV años», «Nuestra boda», «Están invitados». */
  eventTypeLabel: line(60).nullable().default(null),
  celebrantName: line(80),
  celebrantLastName: line(80).nullable().default(null),
  /** La fecha tal como se lee. Opcional: hay puertas que solo dan el nombre. */
  dateLabel: line(80).nullable().default(null),
  /** Una línea breve antes o después del nombre: «Te esperamos», «Con la bendición de Dios». */
  note: line(160).nullable().default(null),
  /**
   * El lugar, en una o dos líneas: «Hacienda Santa Rosa · Mérida, Yucatán».
   *
   * Opcional, y la mayoría de las puertas no lo pintan. Está porque hay un registro de
   * papelería —el de una participación grabada— en el que la portada lleva sitio y hora, y sin
   * este campo esas variantes tendrían que sacarlo de `note`, que es texto libre y acabaría con
   * la dirección escrita en medio de una frase.
   */
  venue: line(160).nullable().default(null),
  /**
   * El instante del evento, en ISO con zona. Opcional, y solo lo usan las variantes que lo
   * necesitan.
   *
   * Es lo que alimenta la cuenta regresiva de `welcome.countdown` y el día y el mes en grande de
   * las que maquetan la fecha como una retícula. No se deriva de `dateLabel` —que es una frase
   * que el organizador escribe— por lo mismo que en la portada: partir esa frase a golpe de
   * expresión regular falla el día que alguien escriba «El día de nuestra boda».
   *
   * Una puerta sin este campo sigue funcionando: las variantes que lo piden caen a `dateLabel`.
   */
  startsAt: isoInstant.nullable().default(null),
  image: blockImageSchema.nullable().default(null),
  /**
   * Lo que dice el botón que abre la invitación.
   *
   * Tiene valor por defecto y no es opcional en el render: una puerta sin salida visible es el
   * peor fallo posible de este bloque —la invitación entera queda detrás de un botón que nadie
   * encuentra—, así que el contenido puede omitirlo pero el componente siempre recibe algo.
   */
  openLabel: line(40).default('Abrir invitación'),
});

/** El contenido de una bienvenida, ya validado y con los valores por defecto puestos. */
export type WelcomeContent = z.output<typeof welcomeContentSchema>;

/** Lo que se guarda en `event_blocks.config`, antes de aplicar los valores por defecto. */
export type WelcomeContentInput = z.input<typeof welcomeContentSchema>;
