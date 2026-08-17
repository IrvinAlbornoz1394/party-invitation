import { z } from 'zod';
import { isoInstant, line } from './shared';

/**
 * El contenido del bloque **calendario**, y con él el contrato de sus componentes.
 *
 * Es el mes del evento con un día señalado. Suena decorativo y no lo es: es el gesto que hace
 * que una fecha se recuerde. «Sábado 12 de junio» es un dato que se lee y se olvida; el mes
 * entero con un corazón en el 12 se ve, y quien lo ve calcula solo cuántos días quedan, si cae
 * en puente y si tiene que pedir el viernes. Está en casi toda la papelería de boda impresa y
 * en casi ninguna invitación digital.
 *
 * ## Por qué es un bloque y no una variante de los detalles
 *
 * Porque su contenido no se parece en nada. El bloque de detalles es una **lista de detalles**
 * con icono y texto; esto es una fecha y una retícula que se calcula a partir de ella. Meterlo
 * ahí habría obligado a que `DetailsContent` llevara un instante que las otras cuatro variantes
 * no usan —y a que quien configura entendiera que un «detalle» a veces pinta un mes—. La
 * frontera entre bloques es el contrato de contenido, no el tamaño de la sección.
 *
 * ## Por qué el mes NO se guarda escrito
 *
 * `startsAt` es la única fuente. Un campo `monthLabel` que se escribiera a mano se
 * desincronizaría el primer día que un evento se mueva de fecha: el cronograma diría junio y el
 * calendario seguiría marcando el 12 de mayo, y nadie se enteraría hasta que un invitado
 * llegara un mes tarde. El nombre del mes y la retícula salen de `domain/invitation/month-grid.ts`.
 *
 * `dateLabel`, en cambio, **sí** se escribe, igual que en la portada: es la frase que se lee en
 * voz alta —la que anuncia un lector de pantalla y la que se pinta si la fecha no se deja
 * partir—. Una retícula de treinta y un números leída en voz alta no es información, es ruido.
 */

/**
 * Con qué forma se señala el día del evento.
 *
 * Son **formas rellenas**, no iconos del vocabulario común de la invitación, y la distinción es
 * la que explica por qué este campo existe. Los iconos de `blockIconSchema` son dibujos de
 * trazo pensados para ir dentro de un medallón, junto a un texto; aquí la marca va **debajo de
 * una cifra** y tiene que ser una silueta maciza para que el número se lea encima. Un corazón de
 * trazo con un «17» dentro no se ve como un día señalado, se ve como dos cosas superpuestas.
 *
 * Tres y no más: un corazón para la papelería romántica, un disco para la sobria y un aro para
 * cuando el número tiene que seguir leyéndose sobre el papel. El enum admite una cuarta el día
 * que haga falta; un booleano `useHeart` habría cerrado esa puerta.
 */
export const dayMarkSchema = z.enum(['heart', 'disc', 'ring']).default('heart');

export type DayMark = z.output<typeof dayMarkSchema>;

/** Con qué día abre la semana. En México el calendario impreso empieza en domingo. */
export const weekStartSchema = z.enum(['sunday', 'monday']).default('sunday');

export type WeekStartInput = z.output<typeof weekStartSchema>;

export const calendarContentSchema = z.object({
  /** El rótulo pequeño de arriba: «Reserva la fecha». */
  eyebrow: line(60).nullable().default(null),
  /**
   * El título de la sección, si se quiere uno propio.
   *
   * Es **anulable a propósito**, y es el único bloque donde el título lo es: cuando no está, el
   * componente pinta el nombre del mes, que es lo que hace un calendario de papel. Obligar a
   * escribir «Agosto» a mano sería pedir un dato que el sistema ya tiene y arriesgarse a que
   * diga julio cuando el evento se mueva.
   */
  title: line(120).nullable().default(null),
  /** El instante del evento. De aquí salen el mes, la retícula y el día señalado. */
  startsAt: isoInstant,
  /** La fecha **tal como se lee**: «Sábado 12 de junio, 2027». Ver la nota de arriba. */
  dateLabel: line(80),
  /** La hora, si se quiere repetir aquí: «5:00 PM». */
  timeLabel: line(24).nullable().default(null),
  weekStartsOn: weekStartSchema,
  /** Con qué forma se marca el día. Ver {@link dayMarkSchema}. */
  dayMark: dayMarkSchema,
  /** La nota al pie: «Guárdala en tu calendario, te esperamos». */
  note: line(240).nullable().default(null),
});

/** El contenido del calendario, ya validado y con los valores por defecto puestos. */
export type CalendarContent = z.output<typeof calendarContentSchema>;

/** Lo que se guarda en `event_blocks.config`, antes de aplicar los valores por defecto. */
export type CalendarContentInput = z.input<typeof calendarContentSchema>;
