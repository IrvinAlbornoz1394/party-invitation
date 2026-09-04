import { calendarContentSchema, type CalendarContent } from '@/domain/invitation/blocks/calendar';
import type { DemoSample } from './sample';

/**
 * Contenido de ejemplo para ver un calendario sin tener que crear un evento.
 *
 * Mismas claves que el resto de bloques —los dos eventos imaginarios, con las mismas fechas que en
 * `hero-samples.ts`— para poder saltar de la portada al calendario sin que cambie el evento debajo.
 * Que las fechas coincidan **no** es cosmético: si aquí hubiera otra, el escaparate enseñaría una
 * plantilla que se contradice a sí misma dos pantallas más abajo.
 *
 * Los dos cubren lo que de verdad rompe un calendario, que no es el texto:
 *
 *   · **Boda**: junio de 2027, treinta días, empieza en martes y el día señalado cae en sábado —la
 *     última columna—. Es donde se ve si la marca aguanta pegada al canto derecho de la retícula.
 *   · **XV**: noviembre de 2027 con la semana abriendo en **lunes**. Ese mes empieza en lunes, así
 *     que no lleva ninguna casilla en blanco: es el caso en el que el desplazamiento tiene que dar
 *     cero y no un número negativo, que es el fallo clásico de esta cuenta.
 *
 * El `dayMark` es lo que distingue el registro de los dos sin una sola línea de código: el corazón
 * es de la papelería nupcial y el aro, sobrio, es el que sirve para unos XV.
 */

export const CALENDAR_SAMPLES: readonly DemoSample<CalendarContent>[] = [
  {
    key: 'boda',
    name: 'Boda',
    content: calendarContentSchema.parse({
      eyebrow: 'Reserva el día',
      /* Sin título propio: el componente pinta el nombre del mes, que es lo que hace un
         calendario de papel. Es también la comprobación de que ese respaldo funciona. */
      title: null,
      startsAt: '2027-06-12T17:00:00-06:00',
      dateLabel: 'Sábado 12 de junio, 2027',
      timeLabel: '5:00 PM',
      weekStartsOn: 'sunday',
      dayMark: 'heart',
      /* Sin nota, como el ejemplo de XV. La llevaba —«nos casamos un sábado a propósito…»— y en
         el escaparate dejaba la franja del calendario terminando en un párrafo que no aporta
         ningún dato: el mes, el día señalado y la hora ya lo dicen todo. El campo sigue
         existiendo para un evento real que quiera explicar algo. */
      note: null,
    }),
  },
  {
    key: 'quince',
    name: 'XV Años',
    content: calendarContentSchema.parse({
      eyebrow: 'Aparta la fecha',
      title: 'La noche',
      startsAt: '2027-11-06T19:00:00-06:00',
      dateLabel: 'Sábado 6 de noviembre, 2027',
      timeLabel: '7:00 PM',
      /* La semana empieza en lunes: el desplazamiento que el otro ejemplo no prueba. */
      weekStartsOn: 'monday',
      dayMark: 'ring',
      note: null,
    }),
  },
];
