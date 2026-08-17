import { calendarContentSchema, type CalendarContent } from '@/domain/invitation/blocks/calendar';
import type { DemoSample } from './sample';

/**
 * Contenido de ejemplo para ver un calendario sin tener que crear un evento.
 *
 * Mismas claves que el resto de bloques —los mismos tres eventos imaginarios, con sus mismas
 * fechas que en `hero-samples.ts`— para poder saltar de la portada al calendario sin que cambie el
 * evento debajo. Que las fechas coincidan **no** es cosmético: si aquí hubiera otra, el escaparate
 * enseñaría una plantilla que se contradice a sí misma dos pantallas más abajo.
 *
 * Los tres cubren lo que de verdad rompe un calendario, que no es el texto:
 *
 *   · **Presentación**: abril de 2027 empieza en jueves, así que la primera semana lleva cuatro
 *     casillas en blanco. Es el caso que descuadra una retícula mal contada.
 *   · **XV Años**: noviembre de 2027 con la semana abriendo en **lunes**. Ese mes empieza en lunes,
 *     así que no lleva ninguna casilla en blanco: es el caso en el que el desplazamiento tiene que
 *     dar cero y no un número negativo, que es el fallo clásico de esta cuenta.
 *   · **Boda**: junio de 2027, treinta días, empieza en martes y el día señalado cae en sábado —la
 *     última columna—. Es donde se ve si la marca aguanta pegada al canto derecho de la retícula.
 */

export const CALENDAR_SAMPLES: readonly DemoSample<CalendarContent>[] = [
  {
    key: 'presentacion',
    name: 'Presentación',
    content: calendarContentSchema.parse({
      eyebrow: 'Aparta la fecha',
      /* Sin título propio: el componente pinta el nombre del mes, que es lo que hace un
         calendario de papel. Es también la comprobación de que ese respaldo funciona. */
      title: null,
      startsAt: '2027-04-17T12:00:00-06:00',
      dateLabel: 'Sábado 17 de abril, 2027',
      timeLabel: '12:00',
      weekStartsOn: 'sunday',
      dayMark: 'disc',
      note: 'Guárdala en tu calendario; te esperamos desde temprano.',
    }),
  },
  {
    key: 'xv-anios',
    name: 'XV Años',
    content: calendarContentSchema.parse({
      eyebrow: null,
      title: 'La noche',
      startsAt: '2027-11-06T20:00:00-06:00',
      dateLabel: 'Sábado 6 de noviembre, 2027',
      timeLabel: '8:00 PM',
      /* La semana empieza en lunes: el desplazamiento que ninguna otra muestra prueba. */
      weekStartsOn: 'monday',
      dayMark: 'ring',
      note: null,
    }),
  },
  {
    key: 'boda',
    name: 'Boda',
    content: calendarContentSchema.parse({
      eyebrow: 'Reserva el día',
      title: null,
      startsAt: '2027-06-12T17:00:00-06:00',
      dateLabel: 'Sábado 12 de junio, 2027',
      timeLabel: '5:00 PM',
      weekStartsOn: 'sunday',
      dayMark: 'heart',
      note: 'Nos casamos un sábado a propósito: queremos que te quedes hasta el final.',
    }),
  },
];
