import { eventDateParts } from './event-date';

/**
 * El mes del evento, repartido en la retícula de siete columnas de un calendario de papel.
 *
 * Es el hermano de `event-date.ts` y comparte su decisión de fondo: las piezas salen de la
 * cadena ISO **leída tal como está escrita**, sin construir un instante ni elegir una zona
 * horaria. Aquí importa más que allí — si el mes se calculara en la zona del navegador, la
 * invitación de un evento del 1 de agosto a las 00:30 marcaría el 31 de julio en el móvil de
 * quien la abra desde otro país, y el día señalado con un corazón estaría en la casilla de al
 * lado. Un calendario que señala el día equivocado es peor que no tener calendario.
 *
 * ## Por qué esto es dominio y no una función dentro del componente
 *
 * Porque no tiene nada de presentación: contar cuántos días trae agosto de 2027 y en qué
 * columna cae el día 1 es aritmética del calendario, igual de válida para un componente, para
 * un correo de recordatorio o para una exportación. Y porque así se puede razonar sobre ella
 * sin montar React: los casos que rompen un calendario —un mes que empieza en domingo, un
 * febrero de veintiocho días, una semana que empieza en lunes— son datos, no píxeles.
 *
 * ## `Date.UTC` otra vez, y por lo mismo
 *
 * Se usa solo para dos preguntas —qué día de la semana es el 1 y cuántos días tiene el mes— y
 * siempre en UTC, que es la única construcción que no suma ni resta horas a lo que se leyó. Con
 * la zona local, un evento del día 1 en un servidor al este del meridiano contestaría «el mes
 * empieza el domingo» donde el calendario impreso dice lunes.
 */

/** Con qué día abre la semana. Es contenido: en México el calendario empieza en domingo. */
export type WeekStart = 'sunday' | 'monday';

/** Una casilla con día: el número y si es el día del evento. */
export interface MonthGridDay {
  readonly day: number;
  /** Cierto en una sola casilla del mes: la que el calendario viene a señalar. */
  readonly isEvent: boolean;
}

export interface MonthGrid {
  /** El nombre del mes, capitalizado: «Agosto». */
  readonly monthLabel: string;
  readonly year: string;
  /**
   * Las iniciales de los siete días, empezando por el que abre la semana.
   *
   * Iniciales y no abreviaturas de tres letras porque en una retícula de siete columnas dentro
   * de un móvil de 360px no cabe «mié» sin apretar las casillas. Que martes y miércoles
   * compartan la «M» es lo normal en un calendario impreso en español: la posición desambigua.
   */
  readonly weekdayInitials: readonly string[];
  /** Casillas vacías antes del día 1, para que caiga en su columna. */
  readonly leadingBlanks: number;
  readonly days: readonly MonthGridDay[];
}

const SUNDAY_FIRST = ['D', 'L', 'M', 'M', 'J', 'V', 'S'] as const;
const MONDAY_FIRST = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const;

/** El año y el mes tal como vienen escritos. El día ya lo resuelve `eventDateParts`. */
const ISO_MONTH = /^(\d{4})-(\d{2})/;

/**
 * La retícula del mes de un instante ISO, o `null` si la fecha no se deja leer.
 *
 * Devuelve `null` y no lanza por la misma razón que `eventDateParts`: `isoInstant` solo
 * garantiza que `Date.parse` entienda la cadena, y hay formas que no dan estas piezas. Quien lo
 * use tiene entonces la frase de la fecha para caer de pie, que es lo que debe verse en una
 * invitación repartida — no un hueco ni una excepción.
 */
export function monthGrid(isoInstant: string, weekStartsOn: WeekStart = 'sunday'): MonthGrid | null {
  const parts = eventDateParts(isoInstant);
  const fields = ISO_MONTH.exec(isoInstant.trim());

  /* `eventDateParts` es además el validador: ya descartó los días que existen como texto pero no
     en el calendario, así que a partir de aquí las cuentas se hacen sobre una fecha real. */
  if (!parts || !fields) return null;

  const year = Number(fields[1]);
  const monthIndex = Number(fields[2]) - 1;
  const eventDay = Number(parts.day);

  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  /* El día cero del mes siguiente es el último del actual: la forma de contar los días de un mes
     sin una tabla de longitudes y sin acordarse de los años bisiestos. */
  const monthLength = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  const weekStartIndex = weekStartsOn === 'monday' ? 1 : 0;

  return {
    monthLabel: parts.month,
    year: parts.year,
    weekdayInitials: weekStartsOn === 'monday' ? MONDAY_FIRST : SUNDAY_FIRST,
    /* El «+ 7» antes del resto no es decorativo: sin él, un mes que empieza en domingo con la
       semana abriendo en lunes daría -1 casillas en blanco. */
    leadingBlanks: (firstWeekday - weekStartIndex + 7) % 7,
    days: Array.from({ length: monthLength }, (_, index) => ({
      day: index + 1,
      isEvent: index + 1 === eventDay,
    })),
  };
}

/** Una casilla de la semana: el número, la inicial de su día y si es el del evento. */
export interface EventWeekDay {
  readonly day: number;
  readonly initial: string;
  readonly isEvent: boolean;
}

export interface EventWeek {
  /** El nombre del mes del evento, capitalizado: «Julio». */
  readonly monthLabel: string;
  readonly year: string;
  readonly days: readonly EventWeekDay[];
}

/**
 * La **semana** en la que cae el evento: siete casillas con su inicial, de lunes a domingo o de
 * domingo a sábado según lo que diga el contenido.
 *
 * Es la tercera forma de contar la misma fecha, y las tres responden a preguntas distintas —por
 * eso conviven en vez de sobrar dos—:
 *
 *   `monthGrid`  el mes entero. «¿Qué día de la semana cae y cómo se reparte el mes?»
 *   `dayStrip`   tres días antes y tres después. «¿Cuándo es, más o menos?»
 *   `eventWeek`  la semana real, con las iniciales. «¿Es entre semana o fin de semana?»
 *
 * La diferencia con `dayStrip` no es cosmética aunque las dos pinten siete casillas: aquella
 * centra el día del evento y no dice de qué día de la semana se trata; esta lo coloca **donde de
 * verdad cae** —puede quedar el primero o el último— y por eso puede rotular las columnas. Para
 * quien tiene que pedir el día libre, esa es la información.
 *
 * Como en `dayStrip`, la semana **cruza de mes** cuando toca: una boda en jueves 1 enseña el
 * lunes 29, el martes 30 y el miércoles 31 del mes anterior. Recortar la semana para que quepa
 * en el mes sería enseñar una semana que no existe.
 */
export function eventWeek(isoInstant: string, weekStartsOn: WeekStart = 'sunday'): EventWeek | null {
  const parts = eventDateParts(isoInstant);
  const fields = ISO_MONTH.exec(isoInstant.trim());

  if (!parts || !fields) return null;

  const year = Number(fields[1]);
  const monthIndex = Number(fields[2]) - 1;
  const eventDay = Number(parts.day);

  const initials = weekStartsOn === 'monday' ? MONDAY_FIRST : SUNDAY_FIRST;
  const weekStartIndex = weekStartsOn === 'monday' ? 1 : 0;

  const eventWeekday = new Date(Date.UTC(year, monthIndex, eventDay)).getUTCDay();
  /* Cuántos días hay que retroceder desde el evento hasta el día que abre la semana. El «+ 7»
     antes del resto evita el negativo cuando el evento cae en domingo y la semana abre en lunes,
     que es el mismo caso que `leadingBlanks` resuelve en la retícula del mes. */
  const backwards = (eventWeekday - weekStartIndex + 7) % 7;

  const monthLength = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const previousMonthLength = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();

  return {
    monthLabel: parts.month,
    year: parts.year,
    days: initials.map((initial, index) => {
      const number = eventDay - backwards + index;

      return {
        day: number < 1 ? previousMonthLength + number : number > monthLength ? number - monthLength : number,
        initial,
        isEvent: number === eventDay,
      };
    }),
  };
}
