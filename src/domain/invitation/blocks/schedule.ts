import { z } from 'zod';
import { blockIconSchema, line } from './shared';

/**
 * El contenido del bloque **cronograma**, y con él el contrato de sus cuatro componentes.
 *
 * Es el orden del día: la misa a las doce, las fotos a la una, la piñata a las seis. El
 * invitado lo consulta dos veces —al recibir la invitación y la mañana del evento— y la
 * segunda casi siempre desde el móvil y con prisa.
 *
 * ## La hora es una etiqueta, no un instante
 *
 * `timeLabel` guarda «12:00», «8:00 PM» o «Al caer la tarde» tal como se escribe, igual que en
 * la columna `event_schedule_items.time_label` que ya existe. Derivarla de un `timestamptz`
 * parece más limpio y no lo es: obligaría a inventar un formato para «después de la misa» y a
 * dar una hora exacta a un momento que el organizador no quiere fijar. El instante real se
 * guarda aparte, en la tabla, y sirve para los recordatorios — que es otra cosa.
 *
 * ## Aquí no hay fotografías, y es una decisión
 *
 * Este bloque es el único de la invitación sin imágenes. La razón es que no funcionan: una
 * miniatura por hito compite con la hora —que es el dato— y en un cronograma de ocho momentos
 * la sección se convierte en una galería desordenada con horas encima. La galería ya es otro
 * bloque, y ahí las fotos se ven como se tienen que ver.
 *
 * Lo que sí lleva cada hito es un icono, y lo que decide el bloque es **si se enseñan**:
 * ver {@link scheduleMarkerSchema}.
 */

export const scheduleItemSchema = z.object({
  /** La hora tal como se lee: «12:00», «8:00 PM», «Al caer la tarde». */
  timeLabel: line(24),
  title: line(80),
  description: line(240).nullable().default(null),
  /**
   * El icono del hito, del vocabulario común de la invitación.
   *
   * Se guarda siempre, aunque el bloque esté en modo «solo puntos». Es a propósito: cambiar el
   * modo es entonces un interruptor y no volver a elegir doce iconos, y quien prueba las dos
   * formas para decidir no pierde el trabajo por el camino.
   */
  icon: blockIconSchema,
});

export type ScheduleItem = z.output<typeof scheduleItemSchema>;

/**
 * Cómo se marca cada hito: con su icono o con un punto.
 *
 * Es una elección de **contenido** —se guarda en el evento y la toma quien lo configura—, no de
 * componente ni de tema, y por eso vive aquí y no en ninguna de las dos partes. Los cuatro
 * componentes obedecen el mismo interruptor, así que cambiar de forma de cronograma no cambia
 * la decisión.
 *
 * Y hay decisión que tomar: los iconos ayudan cuando los momentos son de tipos distintos —misa,
 * comida, baile— y estorban cuando son todos de lo mismo, porque doce dibujos parecidos dejan
 * de significar nada y solo añaden ruido alrededor de la hora. En una invitación formal, además,
 * la fila de puntos se lee mucho más sobria.
 *
 * El enum admite un tercer valor el día que haga falta —números, por ejemplo—; un booleano
 * `showIcons` habría cerrado esa puerta y obligado a migrar el contenido guardado.
 */
export const scheduleMarkerSchema = z.enum(['icon', 'dot']).default('icon');

export type ScheduleMarkerMode = z.output<typeof scheduleMarkerSchema>;

export const scheduleContentSchema = z.object({
  /** El rótulo pequeño de arriba: «Cómo será el día». */
  eyebrow: line(60).nullable().default(null),
  title: line(120),
  subtitle: line(200).nullable().default(null),
  /**
   * Los hitos, en orden.
   *
   * Mínimo dos: un cronograma de un solo momento no es un cronograma, es un dato — y para eso
   * está el bloque de detalles. El tope de doce es el punto en el que deja de poder recorrerse
   * en un móvil sin perderse.
   *
   * El orden lo decide quien configura y se respeta tal cual; no se reordena por `timeLabel`
   * porque no siempre es una hora comparable y porque un evento puede querer enseñar el día
   * partido en tramos que no son cronológicos estrictos.
   */
  items: z.array(scheduleItemSchema).min(2).max(12),
  /** Si los hitos se marcan con su icono o con un punto. Ver {@link scheduleMarkerSchema}. */
  marker: scheduleMarkerSchema,
  /** La nota al pie: «Los horarios son aproximados; lo importante es que vengas». */
  note: line(240).nullable().default(null),
});

/** El contenido de un cronograma, ya validado y con los valores por defecto puestos. */
export type ScheduleContent = z.output<typeof scheduleContentSchema>;

/** Lo que se guarda en `event_blocks.config`, antes de aplicar los valores por defecto. */
export type ScheduleContentInput = z.input<typeof scheduleContentSchema>;
