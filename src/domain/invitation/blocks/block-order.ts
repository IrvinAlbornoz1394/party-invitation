/**
 * El orden en que se leen los bloques de una invitación.
 *
 * Es un hecho del producto y no una preferencia de pantalla: una invitación empieza por la
 * portada y termina por el pie, y quien la configura la piensa en ese orden. Por eso vive en
 * el dominio y no dentro del panel — el día que haya un editor de bloques, un correo de
 * resumen o una exportación, todos tendrán que enumerarlos igual, y una lista por consumidor
 * acabaría dando tres órdenes distintas para lo mismo.
 *
 * ## No es el orden de un evento concreto
 *
 * El orden real de una invitación publicada lo manda `event_blocks.position`, que el admin
 * puede cambiar. Esta lista es la secuencia **por defecto** —la que sigue la composición de
 * la plantilla en el seed— y sirve para presentar el catálogo, donde no hay ningún evento del
 * que leer posiciones.
 *
 * ## Los bloques que no están aquí
 *
 * Van al final, conservando el orden en que llegaron. Es deliberado: dar de alta un bloque
 * nuevo no debe obligar a tocar este archivo para que la pantalla no se rompa. Aparecerá el
 * último hasta que alguien decida dónde va de verdad, que es una decisión de producto y no un
 * descuido que haya que resolver a las tres de la mañana.
 */

/** La secuencia por defecto, de la portada al pie. */
export const BLOCK_READING_ORDER: readonly string[] = [
  /* Antes que la portada, porque se ve antes que ella: la bienvenida tapa la invitación hasta
     que el invitado la abre. Es lo primero aunque no sea una sección que se desplaza. */
  'welcome',
  'hero',
  'story',
  /* Justo detrás de la portada y antes de los datos: la fecha es lo primero que se busca al abrir
     una invitación, y el calendario es la fecha en grande. */
  'calendar',
  'details',
  'party',
  'schedule',
  'gallery',
  'messages',
  'location',
  /* Después de la ubicación, que es el orden en que uno se pregunta las cosas: cuándo, dónde, y
     entonces de qué me visto. */
  'dresscode',
  'rsvp',
  'closing',
  'footer',
];

const POSITION = new Map(BLOCK_READING_ORDER.map((key, index) => [key, index]));

/** La posición de un bloque sin sitio asignado: justo detrás del último conocido. */
const UNPLACED = BLOCK_READING_ORDER.length;

/**
 * Compara dos bloques por su orden de lectura, para pasarlo a `sort`.
 *
 * Los desconocidos comparten posición y por eso empatan entre sí, devolviendo cero:
 * `Array.sort` es estable desde ES2019, así que un empate conserva el orden de entrada. En la
 * práctica eso significa que los bloques sin sitio asignado quedan al final ordenados como los
 * devolvió la base de datos —alfabéticamente— y no en un orden distinto en cada carga.
 *
 * El valor de reserva es finito y no `Infinity` justamente por ese empate: `Infinity - Infinity`
 * es `NaN`, y un comparador que devuelve `NaN` deja el orden en manos de la implementación.
 */
export function compareBlockKeys(a: string, b: string): number {
  return (POSITION.get(a) ?? UNPLACED) - (POSITION.get(b) ?? UNPLACED);
}
