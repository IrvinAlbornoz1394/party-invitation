import type { BlockContent, ContentBlockKey } from './blocks/block-content';
import { calendarContentSchema } from './blocks/calendar';
import { closingContentSchema } from './blocks/closing';
import { detailsContentSchema } from './blocks/details';
import { dresscodeContentSchema } from './blocks/dresscode';
import { footerContentSchema } from './blocks/footer';
import { galleryContentSchema } from './blocks/gallery';
import { heroContentSchema } from './blocks/hero';
import { locationContentSchema } from './blocks/location';
import { rsvpContentSchema } from './blocks/rsvp';
import { scheduleContentSchema } from './blocks/schedule';
import { paragraphsFromText, storyContentSchema } from './blocks/story';
import { welcomeContentSchema } from './blocks/welcome';
import { eventDateParts } from './event-date';

/**
 * De dónde saca su contenido cada bloque de una invitación.
 *
 * ## La regla
 *
 * **El evento guarda lo que es verdad del evento. El bloque guarda solo cómo lo cuenta.**
 *
 * El nombre del festejado, la fecha, las sedes, el cronograma y las fotos viven **una sola vez**,
 * en `events` y en sus tres tablas ordenadas. Lo que hay en `event_blocks.config` es únicamente
 * lo propio de ese bloque: el rótulo de la sección, la frase de introducción, la paleta de la
 * vestimenta, si el cronograma va con iconos o con puntos.
 *
 * Lo que se gana con eso es exactamente lo que el producto promete: **cambiar de plantilla o
 * añadir una sección no obliga a recapturar nada**. Un evento que se pasa de `classic` a
 * `botanical` estrena un calendario que ya sabe qué día es, porque el día nunca fue del bloque.
 * Con el contenido completo dentro de cada `config`, el nombre y la fecha estarían copiados en
 * cinco sitios y corregir una errata sería corregirla cinco veces — hasta que alguien se dejara
 * uno y la invitación se contradijera a sí misma.
 *
 * ## Cómo se compone
 *
 * Una sola regla para los doce bloques, sin excepciones por bloque:
 *
 * ```ts
 * schema.safeParse({ ...projectFromEvent(source, blockKey), ...block.config })
 * ```
 *
 * El `config` **gana** sobre la proyección. Eso es lo que deja escribir «Octubre 2026» donde la
 * proyección diría «Sábado 17 de octubre, 2026» sin que el ensamblador necesite una condición:
 * lo derivado es un buen punto de partida, no una imposición.
 *
 * ## Por qué devuelve `null` y no lanza
 *
 * Un bloque cuyo contenido no valida es un bloque a medio configurar —falta el rótulo, la lista
 * está vacía—, y eso pasa mientras alguien está montando la invitación. Se omite esa sección y
 * la invitación sale entera; una excepción la dejaría en blanco para todos sus invitados. Es el
 * mismo criterio que `parseInvitationTheme` y que `resolveComponent`.
 */

export interface EventVenueRecord {
  readonly kind: 'church' | 'reception' | 'other';
  readonly label: string;
  readonly name: string;
  readonly address: string | null;
  readonly detail: string | null;
  readonly mapUrl: string | null;
  /** Instante de esta sede, en ISO. De aquí sale su hora; puede diferir de la del evento. */
  readonly startsAt: string | null;
  readonly imageUrl: string | null;
  readonly imageAlt: string | null;
}

export interface EventScheduleRecord {
  readonly timeLabel: string;
  readonly title: string;
  readonly description: string | null;
  readonly icon: string | null;
}

export interface EventGalleryRecord {
  readonly url: string;
  readonly altText: string | null;
  readonly caption: string | null;
  readonly width: number | null;
  readonly height: number | null;
}

/**
 * El evento tal como lo necesita el render: ni la fila entera de `events` ni una copia suya.
 *
 * No menciona Drizzle ni columnas: es lo que permite que el ensamblador se pruebe con un objeto
 * escrito a mano y que el repositorio decida cómo llenarlo.
 */
export interface EventContentSource {
  readonly celebrantName: string;
  readonly celebrantFullName: string | null;
  readonly celebrantLastName: string | null;
  readonly eventTypeLabel: string | null;
  readonly tagline: string | null;
  readonly story: string | null;
  /** El instante del evento en ISO con desfase. De aquí salen fecha y hora escritas. */
  readonly startsAt: string;
  readonly city: string | null;
  readonly heroImageUrl: string | null;
  readonly storyImageUrl: string | null;
  readonly closingImageUrl: string | null;
  readonly contactPhone: string | null;
  readonly contactWhatsapp: string | null;
  readonly contactInstagram: string | null;
  /** Fecha límite de confirmación, en «YYYY-MM-DD». */
  readonly rsvpDeadline: string | null;
  readonly venues: readonly EventVenueRecord[];
  readonly schedule: readonly EventScheduleRecord[];
  readonly gallery: readonly EventGalleryRecord[];
}

/** Un bloque configurado del evento: qué es, con qué se pinta, dónde va y qué guarda. */
export interface EventBlockRecord {
  readonly blockKey: string;
  /** El identificador del catálogo: 'hero.framed'. Lo resuelve el Component Registry. */
  readonly registryId: string;
  readonly position: number;
  readonly config: Record<string, unknown>;
}

/** Un bloque listo para pintar: su contenido ya validado y con qué variante se pinta. */
export type AssembledBlock = BlockContent & {
  readonly registryId: string;
  readonly position: number;
};

/* ── Piezas derivadas ─────────────────────────────────────────────────────── */

/** El nombre completo tal como se anuncia: el que se guardó, o el nombre más el apellido. */
function fullNameOf(source: EventContentSource): string {
  if (source.celebrantFullName) return source.celebrantFullName;

  return [source.celebrantName, source.celebrantLastName].filter(Boolean).join(' ');
}

/**
 * La fecha escrita en español: «Sábado 17 de octubre, 2026».
 *
 * Sale de `startsAt` leyendo la cadena, no formateando un `Date` con la zona del servidor: ver
 * `event-date.ts` para por qué eso último daría un día distinto en el móvil del invitado.
 */
function dateLabelOf(source: EventContentSource): string | null {
  const parts = eventDateParts(source.startsAt);

  if (!parts) return null;

  return `${parts.weekday} ${parts.day} de ${parts.month.toLowerCase()}, ${parts.year}`;
}

/** La hora local escrita, «19:00», o `null` si el instante no la traía. */
function timeLabelOf(isoInstant: string | null): string | null {
  return isoInstant ? (eventDateParts(isoInstant)?.time ?? null) : null;
}

/** Una imagen de bloque, o `null`. El texto alternativo nunca queda vacío: ver `shared.ts`. */
function imageOf(url: string | null, alt: string): { url: string; alt: string } | null {
  return url ? { url, alt } : null;
}

/** «Antes del 1 de octubre», a partir de la fecha límite guardada. */
function deadlineLabelOf(deadline: string | null): string | null {
  const parts = deadline ? eventDateParts(deadline) : null;

  return parts ? `Antes del ${parts.day} de ${parts.month.toLowerCase()}` : null;
}

/**
 * El mensaje que llega ya escrito al WhatsApp del organizador.
 *
 * Se deriva y no se escribe a mano porque es el texto que manda **el invitado**: si se quedara
 * en el `config` de un bloque, el día que el evento cambia de nombre habría invitados mandando
 * un mensaje que habla de otra celebración.
 *
 * No usa `eventTypeLabel` aunque lo tenga a mano, y esto se descubrió leyendo el mensaje ya
 * generado: ese rótulo está escrito **en primera persona** —«Mis XV años», «Nuestra boda»—
 * porque su sitio es la portada, y en boca del invitado sale «confirmo mi asistencia a Nuestra
 * boda de Ana y Luis». El nombre solo, en cambio, funciona en los nueve tipos de evento.
 *
 * Quien quiera otra cosa la escribe en `destination.message` del bloque, que gana sobre esto.
 */
function rsvpMessageOf(source: EventContentSource): string {
  return `¡Hola! Confirmo mi asistencia a la celebración de ${fullNameOf(source)}.`;
}

/* ── La proyección ────────────────────────────────────────────────────────── */

/**
 * Lo que cada bloque hereda del evento, antes de mezclarlo con su `config`.
 *
 * Los rótulos de sección —«Nuestra historia», «Detalles»— **no** están aquí a propósito: no son
 * datos del evento, son cómo lo cuenta cada plantilla, y por eso viajan en el `config` que el
 * evento copia de `template_blocks.default_config` al crearse.
 */
function projectFromEvent(
  source: EventContentSource,
  blockKey: ContentBlockKey,
): Record<string, unknown> {
  const names = {
    celebrantName: source.celebrantName,
    celebrantLastName: source.celebrantLastName,
    eventTypeLabel: source.eventTypeLabel,
  };

  switch (blockKey) {
    case 'welcome':
      return {
        ...names,
        dateLabel: dateLabelOf(source),
        startsAt: source.startsAt,
        image: imageOf(source.heroImageUrl, `Fotografía de ${fullNameOf(source)}`),
      };

    case 'hero':
      return {
        ...names,
        tagline: source.tagline,
        dateLabel: dateLabelOf(source),
        city: source.city,
        startsAt: source.startsAt,
        image: imageOf(source.heroImageUrl, `Fotografía de ${fullNameOf(source)}`),
      };

    case 'story':
      return {
        body: source.story ? paragraphsFromText(source.story) : [],
        image: imageOf(source.storyImageUrl, `Fotografía de ${fullNameOf(source)}`),
        signature: source.celebrantName,
      };

    case 'calendar':
      return {
        startsAt: source.startsAt,
        dateLabel: dateLabelOf(source),
        timeLabel: timeLabelOf(source.startsAt),
      };

    case 'schedule':
      return {
        items: source.schedule.map((item) => ({
          timeLabel: item.timeLabel,
          title: item.title,
          description: item.description,
          ...(item.icon ? { icon: item.icon } : {}),
        })),
      };

    case 'gallery':
      return {
        items: source.gallery.map((photo, index) => ({
          url: photo.url,
          alt: photo.altText ?? `Fotografía ${index + 1} de ${fullNameOf(source)}`,
          caption: photo.caption,
          width: photo.width,
          height: photo.height,
        })),
      };

    case 'location':
      return {
        venues: source.venues.map((venue) => ({
          kind: venue.kind,
          label: venue.label,
          name: venue.name,
          address: venue.address,
          detail: venue.detail,
          timeLabel: timeLabelOf(venue.startsAt),
          mapAction: venue.mapUrl ? { label: 'Cómo llegar', href: venue.mapUrl } : null,
          image: imageOf(venue.imageUrl, venue.imageAlt ?? `Fotografía de ${venue.name}`),
        })),
      };

    case 'rsvp':
      return {
        deadlineLabel: deadlineLabelOf(source.rsvpDeadline),
        /* El destino por defecto es el WhatsApp del organizador, que es lo que tienen los planes
           sin panel. Un evento con panel lo sobreescribe con `{ kind: 'managed' }` en su config,
           y quién puede hacerlo lo decide el plan al guardarlo — nunca aquí. */
        destination: source.contactWhatsapp
          ? { kind: 'whatsapp', phone: source.contactWhatsapp, message: rsvpMessageOf(source) }
          : undefined,
      };

    case 'closing':
      return {
        image: imageOf(source.closingImageUrl, `Fotografía de ${fullNameOf(source)}`),
        signature: source.celebrantName,
      };

    case 'footer':
      return {
        names: fullNameOf(source),
        dateLabel: dateLabelOf(source),
        city: source.city,
        links: [
          ...(source.contactPhone
            ? [
                {
                  icon: 'phone',
                  label: source.contactPhone,
                  href: `tel:${source.contactPhone.replace(/\s/g, '')}`,
                },
              ]
            : []),
          ...(source.contactInstagram
            ? [
                {
                  icon: 'camera',
                  label: source.contactInstagram,
                  href: `https://instagram.com/${source.contactInstagram.replace(/^@/, '')}`,
                },
              ]
            : []),
        ],
      };

    /* Detalles y vestimenta no heredan nada: una lista de detalles con sus iconos y una paleta de
       colores no existen en ninguna columna del evento, y derivarlas sería inventárselas. */
    case 'details':
    case 'dresscode':
      return {};

    default: {
      const unhandled: never = blockKey;

      return unhandled;
    }
  }
}

/* ── El ensamblado ────────────────────────────────────────────────────────── */

/**
 * El esquema de cada bloque, para poder validar sin un `switch` de doce ramas.
 *
 * El molde de la salida es lo que cuesta esta forma: `safeParse` devuelve el tipo del esquema
 * concreto y aquí se ven todos como uno. Se paga una vez, en `assembleBlockContent`, donde la
 * pareja (clave, esquema) es correcta por construcción — y no en cada uso.
 */
const SCHEMAS = {
  welcome: welcomeContentSchema,
  hero: heroContentSchema,
  story: storyContentSchema,
  calendar: calendarContentSchema,
  details: detailsContentSchema,
  dresscode: dresscodeContentSchema,
  schedule: scheduleContentSchema,
  gallery: galleryContentSchema,
  location: locationContentSchema,
  rsvp: rsvpContentSchema,
  closing: closingContentSchema,
  footer: footerContentSchema,
} as const;

/** Si el código sabe qué contenido lleva ese bloque. Un bloque sin contrato no se pinta. */
export function isContentBlockKey(blockKey: string): blockKey is ContentBlockKey {
  return blockKey in SCHEMAS;
}

/**
 * Compone el contenido de un bloque a partir del evento y de lo que el bloque guarda.
 *
 * Devuelve `null` si el bloque no tiene contrato o si lo que sale no valida — nunca lanza.
 */
export function assembleBlockContent(
  source: EventContentSource,
  block: EventBlockRecord,
): AssembledBlock | null {
  if (!isContentBlockKey(block.blockKey)) return null;

  const parsed = SCHEMAS[block.blockKey].safeParse({
    ...projectFromEvent(source, block.blockKey),
    ...block.config,
  });

  if (!parsed.success) return null;

  return {
    blockKey: block.blockKey,
    content: parsed.data,
    registryId: block.registryId,
    position: block.position,
  } as AssembledBlock;
}

/**
 * Por qué un bloque no valida, campo a campo.
 *
 * Es la hermana de {@link assembleBlockContent}: aquella devuelve `null` sin decir el motivo
 * —para pintar, el motivo no sirve de nada— y esta devuelve los motivos sin armar nada. Las dos
 * usan la misma proyección y el mismo esquema, que es lo que garantiza que lo que se le pide a
 * quien llena el formulario sea exactamente lo que hace falta para que la sección se pinte.
 *
 * Devuelve una lista vacía cuando el bloque está bien, y también cuando su clave no es de las
 * que el dominio sabe componer: eso último no es un hueco del contenido de nadie.
 */
export function blockContentIssues(
  source: EventContentSource,
  block: EventBlockRecord,
): readonly { readonly path: readonly PropertyKey[] }[] {
  if (!isContentBlockKey(block.blockKey)) return [];

  const parsed = SCHEMAS[block.blockKey].safeParse({
    ...projectFromEvent(source, block.blockKey),
    ...block.config,
  });

  return parsed.success ? [] : parsed.error.issues;
}

/**
 * Los bloques de una invitación, ya compuestos y en el orden en que se leen.
 *
 * El orden lo manda `event_blocks.position` y no `BLOCK_READING_ORDER`: aquel es el que el admin
 * puede cambiar —y cambiarlo es justo lo que se vende en el plan Plus—, y este solo es la
 * secuencia por defecto del catálogo, donde no hay ningún evento del que leer posiciones.
 */
export function assembleInvitation(
  source: EventContentSource,
  blocks: readonly EventBlockRecord[],
): readonly AssembledBlock[] {
  return blocks
    .map((block) => assembleBlockContent(source, block))
    .filter((block): block is AssembledBlock => block !== null)
    .sort((a, b) => a.position - b.position);
}
