/**
 * La fecha del evento, partida en las piezas que una portada quiere colocar por separado.
 *
 * `heroContentSchema` ya trae `dateLabel` —«Sábado 26 de diciembre, 2026»— y esa sigue siendo
 * la fecha que el organizador escribió y la que se lee en voz alta. Pero hay diseños de
 * papelería en los que la fecha **no es una frase**: es una retícula con el día en grande en
 * medio, el día de la semana y la hora a un lado y el mes y el año al otro, separados por
 * filetes. Para maquetar eso hace falta cada trozo por su cuenta, y partir la frase que el
 * organizador escribió a golpe de expresión regular es exactamente el tipo de adivinanza que
 * falla el día que alguien escribe «El día de nuestra boda».
 *
 * Así que las piezas salen de `startsAt`, que es el dato exacto y siempre está.
 *
 * ## Por qué se lee la cadena y no se construye un `Date`
 *
 * Porque `new Date('2026-12-26T09:00:00-06:00')` guarda un instante, y para sacar de él «26 de
 * diciembre a las 09:00» hay que volver a elegir una zona horaria — y ninguna es la correcta.
 * La del servidor pinta una hora y la del móvil del invitado otra, así que la misma invitación
 * anunciaría las nueve en Torreón y las once en Madrid; y en Next, servidor y cliente
 * discreparían en el HTML.
 *
 * Aquí se leen los campos **tal como están escritos** en la cadena, que es la hora local del
 * evento: la que el organizador tecleó y la única que le sirve a quien va a ir. El desfase
 * (`-06:00`) no se toca — es asunto de la cuenta regresiva, que sí necesita el instante.
 *
 * ## Por qué devuelve `null` y no lanza
 *
 * Porque `isoInstant` solo garantiza que `Date.parse` la entienda, y eso admite formas de las
 * que no salen estas piezas —«2026» a secas, o un formato que el navegador tolere—. Quien lo
 * use tiene entonces `dateLabel` para caer de pie, que es lo que debe verse en una invitación
 * repartida: la frase de siempre, no un hueco ni una excepción.
 */

export interface EventDateParts {
  /** El día de la semana, capitalizado: «Sábado». */
  readonly weekday: string;
  /** El día del mes, sin cero a la izquierda: «26», «5». */
  readonly day: string;
  /** El mes, capitalizado: «Diciembre». */
  readonly month: string;
  readonly year: string;
  /** La hora local del evento en 24 h —«09:00»—, o `null` si la fecha no la traía. */
  readonly time: string | null;
}

const WEEKDAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

/*
 * Los nombres están escritos aquí y no salen de `Intl.DateTimeFormat`.
 *
 * `Intl` necesita un `Date` y una zona para dar un nombre, que es justo lo que este archivo
 * evita; y en Node depende de qué datos de idioma se hayan compilado, así que el mismo
 * despliegue puede responder «Saturday» donde el móvil dice «sábado». Doce palabras y siete no
 * son una tabla que se quede desactualizada.
 */

/** La fecha y la hora, tal como vienen escritas: año, mes, día y —si la trae— hora y minuto. */
const ISO_FIELDS = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/;

/**
 * Las piezas de un instante ISO, o `null` si la cadena no las tiene todas.
 *
 * Rechaza además las fechas que existen como texto pero no en el calendario —un 31 de
 * febrero—, comprobando que el día sobrevive al viaje por `Date.UTC`. Se usa UTC a propósito:
 * es la única construcción que no le suma ni le resta horas a lo que se leyó, así que el día de
 * la semana que sale es el del día escrito y no el del anterior.
 */
export function eventDateParts(isoInstant: string): EventDateParts | null {
  const fields = ISO_FIELDS.exec(isoInstant.trim());

  if (!fields) return null;

  const [, year, month, day, hour, minute] = fields;
  const monthIndex = Number(month) - 1;
  const dayNumber = Number(day);
  const utc = new Date(Date.UTC(Number(year), monthIndex, dayNumber));

  const isRealDate =
    monthIndex >= 0 &&
    monthIndex <= 11 &&
    utc.getUTCMonth() === monthIndex &&
    utc.getUTCDate() === dayNumber;

  if (!isRealDate) return null;

  return {
    weekday: WEEKDAYS[utc.getUTCDay()],
    day: String(dayNumber),
    month: MONTHS[monthIndex],
    year,
    /* La hora se devuelve tal cual venía, sin reformatear: «09:00» y no «9:00». En una retícula
       de papelería las dos cifras son lo que mantiene alineada la columna. */
    time: hour && minute ? `${hour}:${minute}` : null,
  };
}
