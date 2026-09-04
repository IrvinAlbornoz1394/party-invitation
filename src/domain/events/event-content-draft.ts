import { z } from 'zod';

/**
 * Lo que el cliente captura de su propio evento.
 *
 * ## Dónde está la frontera
 *
 * No entre plataforma y cliente, sino entre **contenido** y **diseño** (`docs/PROJECT.md`,
 * revisado el 2026-08-27). El contenido es de quien celebra: sus nombres, su fecha, su historia,
 * sus fotos, cómo lo contactan. El diseño es del servicio: la plantilla, el tema, qué variante
 * pinta cada bloque y en qué orden van.
 *
 * Antes esta lista no existía porque la plataforma capturaba el contenido a mano desde una
 * conversación de WhatsApp. Eso no escala, y —lo que importa más— nunca protegió la calidad
 * visual: el contenido no era lo que la ponía en riesgo.
 *
 * ## Qué NO está aquí, y por qué
 *
 * `slug` y `accessCode` son la dirección y la llave de la invitación: cambiarlos rompe los
 * enlaces ya repartidos por WhatsApp, que es un daño que el cliente no puede prever al escribir
 * en un formulario.
 *
 * `templateId`, `themeId`, `planKey` y las variantes de cada bloque son diseño y oferta.
 *
 * `status` es publicar, y publicar es la operación que se paga.
 *
 * ## La fecha viaja partida a propósito
 *
 * `date` y `time` van por separado y como texto, no como un `Date`. El evento guarda su instante
 * en `timestamptz` **y** su zona, y la conversión de «17 de octubre a las 19:00 en Mérida» al
 * instante correcto la hace Postgres con `AT TIME ZONE`, no JavaScript. Con un `Date` construido
 * en el navegador, quien capture desde otra zona —o desde un teléfono con la zona mal puesta—
 * guardaría la boda a otra hora sin que nada lo señalara.
 */
export interface EventContentDraft {
  readonly celebrantName: string;
  readonly celebrantFullName: string | null;
  readonly celebrantLastName: string | null;
  readonly eventTypeLabel: string | null;
  readonly tagline: string | null;
  readonly story: string | null;
  /** `YYYY-MM-DD` en la hora local del evento. */
  readonly date: string;
  /** `HH:MM` en la hora local del evento. */
  readonly time: string;
  readonly city: string | null;
  readonly heroImageUrl: string | null;
  readonly storyImageUrl: string | null;
  readonly closingImageUrl: string | null;
  readonly contactPhone: string | null;
  readonly contactWhatsapp: string | null;
  readonly contactInstagram: string | null;
  /** `YYYY-MM-DD`, o null si no se pide confirmar para una fecha. */
  readonly rsvpDeadline: string | null;
}

/**
 * Texto opcional: se recorta y el vacío se guarda como NULL, no como cadena vacía.
 *
 * Importa más de lo que parece. La invitación decide si pinta una sección con `tagline ?? null`
 * y compañía, así que una cadena vacía guardada sería «hay frase» con la frase en blanco: un
 * hueco compuesto en medio de la portada. Un solo sitio decide que borrar el campo es borrarlo.
 */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable();

/**
 * URL opcional de una imagen.
 *
 * Se valida como URL absoluta porque va directa a un `src`: una ruta relativa mal escrita se
 * vería como una imagen rota en la invitación de un cliente, y el sitio donde eso se descubre
 * no debería ser el teléfono de un invitado.
 *
 * Todavía no hay subida de archivos, así que esto recibe la URL de donde estén hoy alojadas las
 * fotos. Cuando exista el almacenamiento propio, este campo deja de escribirse a mano y el tipo
 * no cambia.
 */
const optionalImageUrl = z
  .union([z.literal(''), z.url({ protocol: /^https?$/ })])
  .transform((value) => (value === '' ? null : value))
  .nullable();

export const eventContentDraftSchema = z.object({
  /*
   * El único obligatorio, y con motivo: es lo que la invitación anuncia. Sin él, la portada no
   * tiene nada que decir y `assembleInvitation` descartaría el bloque `hero` entero — dejando una
   * invitación sin portada en lugar de un formulario con un error.
   */
  celebrantName: z.string().trim().min(1, 'Escribe el nombre de quien celebra.').max(120),
  celebrantFullName: optionalText(180),
  celebrantLastName: optionalText(120),
  eventTypeLabel: optionalText(60),
  tagline: optionalText(240),
  /* La historia se guarda tal cual, con sus saltos de línea: el bloque `story` los convierte en
     párrafos con `paragraphsFromText`. Recortar solo los extremos deja la forma que se escribió. */
  story: optionalText(4000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige la fecha del evento.'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Elige la hora del evento.'),
  city: optionalText(120),
  heroImageUrl: optionalImageUrl,
  storyImageUrl: optionalImageUrl,
  closingImageUrl: optionalImageUrl,
  contactPhone: optionalText(40),
  contactWhatsapp: optionalText(40),
  contactInstagram: optionalText(60),
  rsvpDeadline: z
    .union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Revisa la fecha límite.')])
    .transform((value) => (value === '' ? null : value))
    .nullable(),
});

export type EventContentDraftInput = z.input<typeof eventContentDraftSchema>;
