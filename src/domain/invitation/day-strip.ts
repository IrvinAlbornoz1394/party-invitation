import { eventDateParts } from './event-date';

/**
 * La tira de días alrededor del día del evento: tres antes, el día, y tres después.
 *
 * Es la hermana pequeña de `month-grid.ts` y existe por lo mismo que aquella: la aritmética del
 * calendario no es asunto de un componente. Aquí se decide qué números se enseñan y cuál va
 * marcado; cómo se pintan —en una retícula de siete columnas o en una sola fila— es de la
 * variante.
 *
 * ## Por qué una tira y no el mes entero
 *
 * Un mes completo son cuarenta y dos casillas y responde a «qué día de la semana cae». Una tira
 * de siete responde a otra pregunta, que es la que de verdad se hace quien abre una invitación:
 * «¿cuándo es, más o menos?». El día en medio, con vecinos a los dos lados, se lee de un vistazo
 * y ocupa un renglón en lugar de media pantalla — que es lo que permite ponerla debajo del saludo
 * sin partir la lectura en dos secciones.
 *
 * ## La tira cruza de mes, y es a propósito
 *
 * Con el evento el día 2, los tres anteriores son 30, 31 y 1 del mes de antes. Se pintan, y no se
 * recorta la tira ni se desplaza la ventana:
 *
 *   · **Recortar** dejaría al día del evento descentrado justo en los casos del borde, y la tira
 *     entera se sostiene sobre que el marcado esté en el medio.
 *   · **Desplazar** la ventana para que quepan siete dentro del mes diría algo falso —que el
 *     evento es el cuarto de esos siete— cuando en realidad es el segundo del mes.
 *
 * Cruzar de mes es lo que hace cualquier calendario impreso, y el rótulo con el mes va justo
 * encima, así que nadie lee «30» pensando que es de junio.
 */

/** Una casilla de la tira: el número y si es el día del evento. */
export interface DayStripDay {
  readonly day: number;
  /** Cierto en una sola casilla: la del medio. */
  readonly isEvent: boolean;
}

export interface DayStrip {
  /** El nombre del mes del evento, capitalizado: «Junio». */
  readonly monthLabel: string;
  readonly year: string;
  /** El día del evento, sin ceros a la izquierda: «6». */
  readonly dayLabel: string;
  readonly days: readonly DayStripDay[];
}

/** El año y el mes tal como vienen escritos. El día lo resuelve `eventDateParts`. */
const ISO_MONTH = /^(\d{4})-(\d{2})/;

/**
 * La tira de un instante ISO, o `null` si la fecha no se deja leer.
 *
 * Devuelve `null` y no lanza, igual que `monthGrid` y por la misma razón: quien la use tiene la
 * frase de la fecha para caer de pie, que es lo que debe verse en una invitación repartida.
 *
 * `radius` es cuántos días se enseñan a cada lado. Tres es el valor de diseño —siete casillas
 * caben en el ancho de un móvil sin apretarse— y es un parámetro y no una constante porque es
 * decisión de la variante que la pinta, no del dominio.
 */
export function dayStrip(isoInstant: string, radius = 3): DayStrip | null {
  const parts = eventDateParts(isoInstant);
  const fields = ISO_MONTH.exec(isoInstant.trim());

  /* `eventDateParts` es además el validador: ya descartó los días que existen como texto pero no
     en el calendario, así que a partir de aquí las cuentas se hacen sobre una fecha real. */
  if (!parts || !fields) return null;

  const year = Number(fields[1]);
  const monthIndex = Number(fields[2]) - 1;
  const eventDay = Number(parts.day);

  /* El día cero de un mes es el último del anterior: la forma de contar los días de un mes sin
     una tabla de longitudes y sin acordarse de los años bisiestos. */
  const monthLength = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const previousMonthLength = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();

  const days = Array.from({ length: radius * 2 + 1 }, (_, index) => {
    const offset = index - radius;
    const number = eventDay + offset;

    return {
      day: wrapDay(number, monthLength, previousMonthLength),
      isEvent: offset === 0,
    };
  });

  return {
    monthLabel: parts.month,
    year: parts.year,
    dayLabel: parts.day,
    days,
  };
}

/**
 * El número que le toca a una casilla que se sale del mes.
 *
 * Solo puede salirse por un día o dos —el radio es de tres y ningún mes baja de veintiocho—, así
 * que basta con corregir una vez a cada lado: no hace falta recorrer meses hacia atrás.
 */
function wrapDay(day: number, monthLength: number, previousMonthLength: number): number {
  if (day < 1) return previousMonthLength + day;
  if (day > monthLength) return day - monthLength;

  return day;
}
