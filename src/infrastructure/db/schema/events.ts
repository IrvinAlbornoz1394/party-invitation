import {
  boolean,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { timestamps } from './_shared';
import { users } from './auth';
import { plans } from './plans';
import { blocks, componentVariants, eventTypes, templates, themes } from './registry';
import { clients } from './clients';

export const eventStatus = pgEnum('event_status', ['draft', 'published', 'archived']);
export const venueKind = pgEnum('venue_kind', ['church', 'reception', 'other']);

/**
 * Un evento: la unidad de trabajo de la plataforma.
 *
 * Criterio del reparto entre columnas y jsonb: lo que la plataforma consulta,
 * ordena o valida va en columna tipada (fecha, estado, slug, nombre). Lo que solo
 * el bloque sabe renderizar (papás, padrinos, tema de la fiesta, lineup) vive en
 * `event_blocks.config`. Así el panel puede listar y filtrar eventos sin abrir jsonb,
 * y añadir un tipo de evento con contenido distinto no cuesta una migración.
 */
export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),

    eventTypeKey: text('event_type_key')
      .notNull()
      .references(() => eventTypes.key, { onDelete: 'restrict', onUpdate: 'cascade' }),
    planKey: text('plan_key')
      .notNull()
      .references(() => plans.key, { onDelete: 'restrict', onUpdate: 'cascade' }),
    templateId: uuid('template_id')
      .notNull()
      .references(() => templates.id, { onDelete: 'restrict' }),
    themeId: uuid('theme_id')
      .notNull()
      .references(() => themes.id, { onDelete: 'restrict' }),

    /** Segmento público de la URL. Único globalmente porque la invitación se sirve en /<slug>/<code>. */
    slug: text('slug').notNull().unique(),

    /**
     * Código de acceso de la invitación: el `k7m2p4` de `/fatima/k7m2p4`.
     *
     * Se guarda EN CLARO y no hasheado, y es una decisión consciente: el organizador
     * tiene que poder recuperar su URL completa desde el panel para volver a
     * compartirla. Hashearlo lo haría irrecuperable sin aportar nada, porque un dump
     * de esta tabla ya expondría todo el contenido del evento de todos modos.
     *
     * La protección real no está en ocultarlo, sino en que sea impredecible (CSPRNG,
     * ver domain/events/access-code.ts) y en el límite de intentos por IP.
     */
    accessCode: text('access_code').notNull(),

    /** Título interno para el panel; no necesariamente lo que ve el invitado. */
    title: text('title').notNull(),

    /** El o la festejada. Se guarda partido porque el diseño lo compone distinto en cada plantilla. */
    celebrantName: text('celebrant_name').notNull(),
    celebrantFullName: text('celebrant_full_name'),
    celebrantLastName: text('celebrant_last_name'),

    eventTypeLabel: text('event_type_label'),
    tagline: text('tagline'),
    story: text('story'),

    /**
     * Instante del evento en UTC más su zona horaria.
     *
     * Las dos cosas son necesarias: timestamptz da el instante correcto para la cuenta
     * regresiva y los recordatorios, y `time_zone` permite mostrar y programar en la
     * hora local del evento aunque el servidor esté en otra región.
     */
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    timeZone: text('time_zone').notNull().default('America/Merida'),
    city: text('city'),

    status: eventStatus('status').notNull().default('draft'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    /** Vigencia de la invitación; se calcula al publicar con `plans.duration_months`. */
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    rsvpDeadline: date('rsvp_deadline'),

    musicUrl: text('music_url'),
    musicTitle: text('music_title'),

    heroImageUrl: text('hero_image_url'),
    storyImageUrl: text('story_image_url'),
    closingImageUrl: text('closing_image_url'),

    contactPhone: text('contact_phone'),
    /** Solo dígitos con lada de país, formato wa.me. Se valida en la capa de aplicación. */
    contactWhatsapp: text('contact_whatsapp'),
    contactInstagram: text('contact_instagram'),

    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [
    /**
     * Objetivo de las claves ajenas compuestas de las tablas hijas.
     *
     * Toda tabla que cuelga de un evento repite `client_id` para que las
     * políticas de RLS no tengan que hacer joins. Esta única garantiza que ese
     * valor repetido no pueda contradecir al del evento: la FK compuesta
     * (event_id, client_id) obliga a que apunten a la misma fila.
     */
    unique('events_id_client_id_key').on(t.id, t.clientId),
    index('events_client_id_starts_at_idx').on(t.clientId, t.startsAt),
    index('events_status_idx').on(t.status),
  ],
);

/**
 * Configuración de bloques del evento: el resultado de "Configurar las variantes de
 * cada bloque" y "Activar o desactivar las secciones permitidas por el plan".
 *
 * Se crea copiando `template_blocks` al crear el evento, y desde ahí el admin lo ajusta.
 */
export const eventBlocks = pgTable(
  'event_blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull(),
    clientId: uuid('client_id').notNull(),
    blockKey: text('block_key')
      .notNull()
      .references(() => blocks.key, { onDelete: 'cascade', onUpdate: 'cascade' }),
    /** Variante elegida del Component Registry. El renderer resuelve por `registry_id`. */
    variantId: uuid('variant_id')
      .notNull()
      .references(() => componentVariants.id, { onDelete: 'restrict' }),
    position: smallint('position').notNull(),
    isEnabled: boolean('is_enabled').notNull().default(true),
    /** Contenido específico del bloque. Su forma la valida un esquema Zod por bloque. */
    config: jsonb('config').notNull().default({}).$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (t) => [
    foreignKey({
      columns: [t.eventId, t.clientId],
      foreignColumns: [events.id, events.clientId],
      name: 'event_blocks_event_fk',
    }).onDelete('cascade'),
    unique('event_blocks_event_block_key').on(t.eventId, t.blockKey),
    index('event_blocks_client_id_idx').on(t.clientId),
  ],
);

/** Sedes del evento: templo y salón son dos lugares distintos con dos horas distintas. */
export const eventVenues = pgTable(
  'event_venues',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull(),
    clientId: uuid('client_id').notNull(),
    kind: venueKind('kind').notNull(),
    label: text('label').notNull(),
    name: text('name').notNull(),
    address: text('address'),
    detail: text('detail'),
    mapUrl: text('map_url'),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    position: smallint('position').notNull().default(0),
    ...timestamps,
  },
  (t) => [
    foreignKey({
      columns: [t.eventId, t.clientId],
      foreignColumns: [events.id, events.clientId],
      name: 'event_venues_event_fk',
    }).onDelete('cascade'),
    index('event_venues_event_id_idx').on(t.eventId),
    index('event_venues_client_id_idx').on(t.clientId),
  ],
);

/** Cronograma. Normalizado y no jsonb porque se ordena y porque alimentará recordatorios. */
export const eventScheduleItems = pgTable(
  'event_schedule_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull(),
    clientId: uuid('client_id').notNull(),
    position: smallint('position').notNull(),
    /** Etiqueta tal como se muestra ('12:00'). Se guarda aparte del instante real. */
    timeLabel: text('time_label').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    title: text('title').notNull(),
    description: text('description'),
    ...timestamps,
  },
  (t) => [
    foreignKey({
      columns: [t.eventId, t.clientId],
      foreignColumns: [events.id, events.clientId],
      name: 'event_schedule_items_event_fk',
    }).onDelete('cascade'),
    unique('event_schedule_items_event_position_key').on(t.eventId, t.position),
    index('event_schedule_items_client_id_idx').on(t.clientId),
  ],
);

/**
 * Galería.
 *
 * Se guarda `storage_key` además de `url` para el día que las fotos dejen de ser
 * enlaces de Unsplash y pasen a un bucket propio: el key es la identidad estable y
 * la url es solo la forma de servirla. `width`/`height` evitan el salto de layout
 * al cargar, que es crítico en móvil.
 */
export const eventGalleryItems = pgTable(
  'event_gallery_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull(),
    clientId: uuid('client_id').notNull(),
    position: smallint('position').notNull(),
    url: text('url').notNull(),
    storageKey: text('storage_key'),
    altText: text('alt_text'),
    width: integer('width'),
    height: integer('height'),
    byteSize: integer('byte_size'),
    contentType: text('content_type'),
    ...timestamps,
  },
  (t) => [
    foreignKey({
      columns: [t.eventId, t.clientId],
      foreignColumns: [events.id, events.clientId],
      name: 'event_gallery_items_event_fk',
    }).onDelete('cascade'),
    unique('event_gallery_items_event_position_key').on(t.eventId, t.position),
    index('event_gallery_items_client_id_idx').on(t.clientId),
  ],
);

/** Mensajes/dedicatorias que muestra la invitación (distintos del libro de firmas público). */
export const eventMessages = pgTable(
  'event_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull(),
    clientId: uuid('client_id').notNull(),
    position: smallint('position').notNull(),
    quote: text('quote').notNull(),
    author: text('author').notNull(),
    authorRole: text('author_role'),
    groupLabel: text('group_label'),
    ...timestamps,
  },
  (t) => [
    foreignKey({
      columns: [t.eventId, t.clientId],
      foreignColumns: [events.id, events.clientId],
      name: 'event_messages_event_fk',
    }).onDelete('cascade'),
    unique('event_messages_event_position_key').on(t.eventId, t.position),
    index('event_messages_client_id_idx').on(t.clientId),
  ],
);

/** Mesa de regalos. Varias filas porque suele haber más de una tienda. */
export const eventGiftRegistries = pgTable(
  'event_gift_registries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: uuid('event_id').notNull(),
    clientId: uuid('client_id').notNull(),
    position: smallint('position').notNull().default(0),
    name: text('name').notNull(),
    detail: text('detail'),
    url: text('url'),
    ...timestamps,
  },
  (t) => [
    foreignKey({
      columns: [t.eventId, t.clientId],
      foreignColumns: [events.id, events.clientId],
      name: 'event_gift_registries_event_fk',
    }).onDelete('cascade'),
    index('event_gift_registries_event_id_idx').on(t.eventId),
    index('event_gift_registries_client_id_idx').on(t.clientId),
  ],
);
