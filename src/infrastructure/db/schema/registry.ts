import { sql } from 'drizzle-orm';
import { boolean, jsonb, pgTable, smallint, text, unique, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from './_shared';
import { features, plans } from './plans';

/** Tipos de evento soportados. Tabla y no enum para poder añadir uno sin migración de tipo. */
export const eventTypes = pgTable('event_types', {
  key: text('key').primaryKey(),
  name: text('name').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
});

/**
 * Bloques de una invitación: hero, historia, galería, cronograma, ubicación, rsvp…
 *
 * Un bloque es un hueco en la estructura, no un componente. El bloque se ata a una
 * funcionalidad de plan, y de ahí sale que un evento Esencial no pueda encender
 * un bloque que solo existe en Premium.
 */
export const blocks = pgTable('blocks', {
  key: text('key').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  /** Funcionalidad de plan que habilita este bloque. NULL = disponible en todos los planes. */
  featureKey: text('feature_key').references(() => features.key, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  ...timestamps,
});

/**
 * Component Registry.
 *
 * Esta tabla es la que materializa la regla central de la arquitectura: el sistema
 * nunca conoce los componentes, solo sus identificadores. `registry_id` ('hero.classic',
 * 'gallery.carousel') es una columna GENERADA a partir de sus partes, así que es
 * imposible que el identificador se desincronice del bloque y la variante que nombra.
 *
 * El Template Renderer resuelve `registry_id` contra un mapa en el frontend. Agregar
 * una variante nueva es insertar una fila aquí y registrar el componente; el motor de
 * renderizado no se toca.
 */
export const componentVariants = pgTable(
  'component_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    blockKey: text('block_key')
      .notNull()
      .references(() => blocks.key, { onDelete: 'cascade', onUpdate: 'cascade' }),
    variantKey: text('variant_key').notNull(),
    /** 'hero.classic', 'gallery.masonry'. Generada: no se puede escribir a mano. */
    registryId: text('registry_id')
      .notNull()
      .generatedAlwaysAs(sql`block_key || '.' || variant_key`),
    name: text('name').notNull(),
    description: text('description'),
    /**
     * Rango mínimo de plan que puede usar la variante. Se compara contra `plans.rank`.
     * Permite vender variantes premium sin tocar código.
     */
    minPlanRank: smallint('min_plan_rank').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (t) => [
    unique('component_variants_block_variant_key').on(t.blockKey, t.variantKey),
    unique('component_variants_registry_id_key').on(t.registryId),
  ],
);

/**
 * Plantilla: define la estructura visual general. Una plantilla puede usar cualquier tema.
 *
 * ## Por qué ya no tiene tipo de evento
 *
 * Lo tuvo, y era `NOT NULL`. La consecuencia salió a la luz al construir las plantillas
 * estructurales del catálogo: `editorial` o `cinematic` **no son de boda ni de XV** — son formas
 * de componer una invitación, y la misma sirve para varios tipos. Con una columna, las cuatro
 * estructuras por los nueve tipos habrían sido treinta y seis filas que hay que mantener a mano.
 *
 * Ahora la relación vive en {@link templateEventTypes}, igual que la de planes vive en
 * `template_plans`. Una plantilla declara para qué tipos encaja y el panel puede sugerirla al
 * crear un evento.
 */
export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  previewImageUrl: text('preview_image_url'),
  /**
   * El tema con el que se diseñó la plantilla. **Preselecciona, no impone.**
   *
   * La tipografía, el color y la densidad son del tema —`docs/PROJECT.md` lo dice y
   * `domain/invitation/theme.ts` lo garantiza—, así que una plantilla no puede traer fuentes
   * propias sin que dos capas se peleen por el mismo token. Lo que sí puede es decir con cuál se
   * ve como se pensó, y eso es esto: al crear un evento se ofrece este tema ya elegido, y quien
   * lo configure puede cambiarlo por cualquier otro. Ninguna combinación queda prohibida.
   *
   * `set null` al borrar el tema: una plantilla sin sugerencia sigue siendo perfectamente usable.
   */
  defaultThemeKey: text('default_theme_key').references(() => themes.key, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
});

/**
 * Para qué tipos de evento encaja una plantilla.
 *
 * Sin filas, la plantilla no se sugiere para ninguno — que es distinto de «sirve para todos».
 * Es deliberado: una estructura que encaja en cualquier celebración no existe, y dejar que el
 * vacío signifique «todos» convertiría un olvido al darla de alta en una plantilla que aparece
 * donde no debe.
 *
 * `onUpdate: 'cascade'` en la clave del tipo porque esas claves se renombran (pasó al pasarlas
 * a inglés): sin ello, renombrar un tipo dejaría estas filas apuntando a la nada.
 */
export const templateEventTypes = pgTable(
  'template_event_types',
  {
    templateId: uuid('template_id')
      .notNull()
      .references(() => templates.id, { onDelete: 'cascade' }),
    eventTypeKey: text('event_type_key')
      .notNull()
      .references(() => eventTypes.key, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (t) => [unique('template_event_types_pkey').on(t.templateId, t.eventTypeKey)],
);

/**
 * Tema: solo apariencia, nunca lógica.
 *
 * `tokens` es jsonb porque el conjunto de tokens de diseño va a crecer (colores,
 * tipografía, espaciados, sombras, bordes, animaciones, iconografía) y normalizar eso
 * en columnas obligaría a una migración por cada token nuevo. Un tema nunca decide qué
 * componente se renderiza, así que su contenido no necesita ser consultable.
 */
export const themes = pgTable('themes', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  tokens: jsonb('tokens').notNull().default({}).$type<Record<string, unknown>>(),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
});

/** Composición por defecto de una plantilla: qué bloques trae, en qué orden y con qué variante. */
export const templateBlocks = pgTable(
  'template_blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    templateId: uuid('template_id')
      .notNull()
      .references(() => templates.id, { onDelete: 'cascade' }),
    blockKey: text('block_key')
      .notNull()
      .references(() => blocks.key, { onDelete: 'cascade', onUpdate: 'cascade' }),
    defaultVariantId: uuid('default_variant_id')
      .notNull()
      .references(() => componentVariants.id, { onDelete: 'restrict' }),
    position: smallint('position').notNull(),
    /** Un bloque requerido no se puede desactivar (el hero de una invitación, por ejemplo). */
    isRequired: boolean('is_required').notNull().default(false),
    /**
     * Con qué nace el `config` de este bloque al crear un evento con esta plantilla.
     *
     * Es lo que hace que una plantilla esté de verdad **preconstruida** y no sea una lista de
     * huecos: el rótulo de la sección, la introducción, el modo del cronograma. Todo eso no se
     * puede derivar del evento —no es un dato del evento, es cómo esta plantilla lo cuenta— y sin
     * esto un evento recién creado tendría los bloques sin título, que es exactamente la
     * condición por la que el ensamblador los omite.
     *
     * El contenido real —nombres, fecha, sedes— no va aquí: eso vive en el evento y lo proyecta
     * `domain/invitation/event-content.ts`.
     */
    defaultConfig: jsonb('default_config').notNull().default({}).$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (t) => [
    unique('template_blocks_template_block_key').on(t.templateId, t.blockKey),
    unique('template_blocks_template_position_key').on(t.templateId, t.position),
  ],
);

/** Planes disponibles para una plantilla. Sin fila, la plantilla no se ofrece en ese plan. */
export const templatePlans = pgTable(
  'template_plans',
  {
    templateId: uuid('template_id')
      .notNull()
      .references(() => templates.id, { onDelete: 'cascade' }),
    planKey: text('plan_key')
      .notNull()
      .references(() => plans.key, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
  (t) => [unique('template_plans_pkey').on(t.templateId, t.planKey)],
);
