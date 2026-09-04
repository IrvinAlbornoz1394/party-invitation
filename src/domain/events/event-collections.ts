import { z } from 'zod';

/**
 * Las tres listas ordenadas de un evento: sedes, cronograma y galería.
 *
 * Van juntas en un módulo porque comparten la misma forma —una lista ordenada de filas que el
 * cliente añade, reordena y quita— y sobre todo la misma **regla de guardado**, que es lo que de
 * verdad las hace un solo problema. Ver `collectionRowSchema` para esa regla.
 *
 * Siguen la misma frontera que el resto del contenido: son lo que el evento **es** —dónde,
 * cuándo y qué se ve— y por eso viven en sus propias tablas y no en el `config` de un bloque. Un
 * evento que cambia de plantilla estrena secciones que ya saben dónde es la ceremonia, porque la
 * ceremonia nunca fue del bloque.
 */

/**
 * El identificador de una fila que ya existe.
 *
 * Es lo que permite guardar sin perder nada. La alternativa evidente —borrar las filas del evento
 * y volver a insertarlas— es más corta de escribir y tiene dos daños: pierde las columnas que
 * este formulario no toca (`storage_key`, `width`, `height` de una foto subida, que el día que
 * haya almacenamiento propio serán las que localicen el archivo) y cambia los identificadores en
 * cada guardado, de forma que cualquier cosa que apuntara a una fila —una asignación, una
 * bitácora— quedaría apuntando a nada.
 *
 * Una fila nueva llega sin `id`. Al guardar, las que no aparezcan en la lista se borran, las que
 * traigan `id` se actualizan y las que no lo traigan se insertan.
 */
const rowId = z
  /*
   * Las tres formas de «esta fila es nueva» que llegan de verdad: `null` cuando la crea el editor
   * en el navegador, cadena vacía cuando el valor viaja por un campo de formulario, y un UUID
   * cuando la fila ya existe. Aceptar solo las dos últimas dejaba fuera justo el caso más común
   * —añadir una fila— y el fallo no aparecía hasta intentar guardar.
   */
  .union([z.uuid(), z.literal(''), z.null()])
  .transform((value) => (value === '' ? null : value));

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .catch(null);

/** Hora suelta `HH:MM`, en la hora local del evento. Vacía es válida: no toda sede tiene hora. */
const optionalTime = z
  .union([z.literal(''), z.string().regex(/^\d{2}:\d{2}$/)])
  .transform((value) => (value === '' ? null : value))
  .nullable();

/** Enlace opcional. Se exige absoluto porque va directo a un `href` o a un `src`. */
const optionalUrl = z
  .union([z.literal(''), z.url({ protocol: /^https?$/ })])
  .transform((value) => (value === '' ? null : value))
  .nullable();

/* ── Sedes ────────────────────────────────────────────────────────────────── */

export const VENUE_KINDS = ['church', 'reception', 'other'] as const;
export type VenueKind = (typeof VENUE_KINDS)[number];

export const venueRowSchema = z.object({
  id: rowId,
  /**
   * Qué clase de sede es. No es decorativo: los bloques de ubicación deciden con esto qué icono
   * y qué rótulo por defecto usan, así que una ceremonia marcada como «otro» sale con la etiqueta
   * equivocada aunque el nombre esté bien.
   */
  kind: z.enum(VENUE_KINDS),
  /** Cómo se titula en la invitación: «Ceremonia religiosa», «Recepción». */
  label: z.string().trim().min(1, 'Ponle un título a la sede.').max(80),
  /** El nombre del sitio: «Parroquia de San Juan». */
  name: z.string().trim().min(1, 'Escribe el nombre del lugar.').max(160),
  address: optionalText(300),
  /** Una nota corta: «Estacionamiento por la calle 60». */
  detail: optionalText(300),
  mapUrl: optionalUrl,
  time: optionalTime,
  imageUrl: optionalUrl,
  imageAlt: optionalText(200),
});

/* ── Cronograma ───────────────────────────────────────────────────────────── */

export const scheduleRowSchema = z.object({
  id: rowId,
  /**
   * La hora **escrita**, no un instante: «7:00 pm», «Al caer la tarde».
   *
   * Es texto a propósito. Un cronograma de fiesta no siempre tiene horas exactas, y forzar un
   * selector de hora obligaría a inventarse una para «después de la cena». La columna
   * `starts_at` existe al lado para cuando haga falta ordenar por tiempo de verdad; esto es lo
   * que se lee.
   */
  timeLabel: z.string().trim().min(1, 'Escribe la hora.').max(40),
  title: z.string().trim().min(1, 'Escribe qué pasa a esa hora.').max(120),
  description: optionalText(400),
  /** Clave del icono que pinta el bloque, cuando su variante los usa. */
  icon: optionalText(40),
});

/* ── Galería ──────────────────────────────────────────────────────────────── */

export const galleryRowSchema = z.object({
  id: rowId,
  url: z.url({ protocol: /^https?$/, error: 'Pega el enlace directo a la imagen.' }),
  /**
   * El texto alternativo. Opcional en el formulario y no en la conciencia: sin él, quien use un
   * lector de pantalla no sabe qué hay en la foto. Se pide con una ayuda que lo explica en vez de
   * bloquear el guardado, porque una galería sin descripciones sigue siendo mejor que una
   * galería que nadie llegó a guardar.
   */
  altText: optionalText(200),
  caption: optionalText(200),
});

export type VenueRow = z.infer<typeof venueRowSchema>;
export type ScheduleRow = z.infer<typeof scheduleRowSchema>;
export type GalleryRow = z.infer<typeof galleryRowSchema>;

export const eventCollectionsSchema = z.object({
  venues: z.array(venueRowSchema).max(12),
  schedule: z.array(scheduleRowSchema).max(30),
  gallery: z.array(galleryRowSchema).max(60),
});

export type EventCollections = z.infer<typeof eventCollectionsSchema>;
export type EventCollectionsInput = z.input<typeof eventCollectionsSchema>;

/** Las tres listas vacías. Es lo que ve un evento recién dado de alta. */
export const EMPTY_COLLECTIONS: EventCollections = { venues: [], schedule: [], gallery: [] };
