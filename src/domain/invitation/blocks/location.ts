import { z } from 'zod';
import { blockActionSchema, blockImageSchema, line } from './shared';

/**
 * El contenido del bloque **ubicación**, y con él el contrato de sus seis componentes.
 *
 * Es el bloque que se abre el día del evento, en el coche, con prisa y a veces sin datos. Todo
 * lo que hay aquí está pensado para eso: el nombre del sitio primero, la dirección en texto
 * —copiable y legible sin conexión— y el mapa como un enlace, no como un mapa.
 *
 * ## Por qué no se incrusta un mapa
 *
 * Un iframe de Google Maps pesa cientos de kilobytes, tarda en pintar y carga rastreadores de
 * un tercero en una invitación privada; además exige clave de API y facturación. Un enlace
 * abre la aplicación de mapas **que el invitado ya tiene**, con su cuenta, su tráfico y su
 * navegación por voz. Es más barato, más rápido y más útil. Si algún día se quiere ver el mapa
 * dentro, lo correcto es una imagen estática, y para eso está `image`.
 *
 * ## Una lista de sedes, no «templo» y «salón»
 *
 * La tentación es tener dos campos con nombre —`church` y `reception`— y se descarta por lo
 * mismo que en los detalles: hay eventos con una sola sede, otros con dos y alguno con tres
 * (ceremonia, sesión de fotos y fiesta). Con una lista, añadir la tercera no toca ni un
 * componente. `kind` conserva el tipo de cada una porque de él salen el icono y el orden con el
 * que se lee, y coincide con la columna `event_venues.kind` que ya existe.
 *
 * ## Seis componentes y un solo contrato
 *
 * Tres están pensados para **una sede** y tres para **dos**, y esa es su intención de diseño,
 * no una restricción: los seis pintan todas las sedes que haya. Es la regla de la biblioteca
 * —cambiar de componente nunca pierde contenido—, y significa que asignar `location.single` a
 * un evento con dos sedes las enseña las dos, apiladas, en lugar de esconder una. El nombre
 * dice para qué está pensado; el componente no se rompe fuera de eso.
 */

/**
 * Qué es cada sede.
 *
 * Los tres valores son los de `event_venues.kind` en la base de datos, y de aquí salen el icono
 * y nada más: ningún componente decide su maquetación a partir del tipo. Si lo hiciera, un
 * evento civil sin templo se vería distinto por accidente.
 */
export const venueKindSchema = z.enum(['church', 'reception', 'other']).default('other');

export type VenueKind = z.output<typeof venueKindSchema>;

export const locationVenueSchema = z.object({
  kind: venueKindSchema,
  /** Para qué es esta sede: «Misa de acción de gracias», «La fiesta». */
  label: line(60).nullable().default(null),
  /** El nombre del lugar: «Templo de Nuestra Señora de Guadalupe». */
  name: line(120),
  /**
   * La dirección, en texto.
   *
   * Escrita y no solo enlazada, a propósito: se puede leer en voz alta al taxista, copiar y
   * pegar, y sigue ahí cuando el móvil se queda sin datos a mitad de camino.
   */
  address: line(240).nullable().default(null),
  /** La precisión que no cabe en la dirección: «Estacionamiento por la calle 45». */
  detail: line(240).nullable().default(null),
  /** La hora tal como se lee, igual que en el cronograma: «12:00», «8:00 PM». */
  timeLabel: line(24).nullable().default(null),
  /** El enlace al mapa, con su etiqueta: «Cómo llegar», «Abrir en Waze». */
  mapAction: blockActionSchema.nullable().default(null),
  /** Una foto del lugar. Opcional, y los seis componentes se adaptan a que falte. */
  image: blockImageSchema.nullable().default(null),
});

export type LocationVenue = z.output<typeof locationVenueSchema>;

export const locationContentSchema = z.object({
  /** El rótulo pequeño de arriba: «Dónde nos vemos». */
  eyebrow: line(60).nullable().default(null),
  title: line(120),
  subtitle: line(200).nullable().default(null),
  /**
   * Las sedes, en el orden en que se visitan.
   *
   * El orden es el del día —primero la ceremonia, después la fiesta— y se respeta tal cual: es
   * información, no una lista ordenable. El tope de tres no es técnico: con cuatro sitios, lo
   * que el invitado necesita ya no es un bloque de ubicaciones sino el cronograma.
   */
  venues: z.array(locationVenueSchema).min(1).max(3),
  /** La nota al pie: «Habrá transporte desde el templo hasta el salón». */
  note: line(240).nullable().default(null),
});

/** El contenido de la ubicación, ya validado y con los valores por defecto puestos. */
export type LocationContent = z.output<typeof locationContentSchema>;

/** Lo que se guarda en `event_blocks.config`, antes de aplicar los valores por defecto. */
export type LocationContentInput = z.input<typeof locationContentSchema>;
