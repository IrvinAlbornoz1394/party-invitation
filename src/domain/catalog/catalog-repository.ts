/**
 * El catálogo de la plataforma: planes, plantillas, temas y el Component Registry.
 *
 * Es la biblioteca con la que se construyen las invitaciones, y `docs/PROJECT.md` la
 * describe como el núcleo del producto: «el sistema nunca conocerá directamente los
 * componentes, únicamente sus identificadores». Estas pantallas son la ventana a ese
 * registro — lo que hay disponible para configurar un evento, sin tener que abrir la base de
 * datos para saberlo.
 *
 * ## Por qué este puerto no recibe credenciales
 *
 * El resto de puertos de plataforma —`ClientRepository`, `EventRepository`— reciben
 * `PlatformCredentials` porque sus consultas pasan por funciones `SECURITY DEFINER` que
 * resuelven el privilegio contra el hash del token. Aquí no, y la diferencia es real y no un
 * descuido: **el catálogo no es de nadie**. No tiene `client_id`, no está bajo Row-Level
 * Security y el rol de la aplicación solo tiene `SELECT` sobre él (ver la sección 4 de
 * `0001_security.sql`), así que no hay aislamiento entre inquilinos que imponer ni escritura
 * que autorizar.
 *
 * La autorización sigue existiendo, en las dos capas que corresponden: el layout de
 * `(authenticated)/` bajo `/admin` exige cuenta de plataforma, y cada caso de uso vuelve a
 * comprobar `canAdministerPlatform`. Lo que no hay es una tercera comprobación en la base de
 * datos, porque no habría nada que comprobar: un `SELECT` sobre `plans` devuelve lo mismo a
 * cualquiera que llegue hasta él.
 */

/** Una funcionalidad vendible. `features`. */
export interface FeatureSummary {
  readonly key: string;
  readonly name: string;
  readonly description: string | null;
  /** Agrupador para la interfaz: 'invitacion' | 'gestion' | 'automatizacion' | 'extras'. */
  readonly category: string;
}

/** Qué hace un plan con una funcionalidad concreta. */
export interface PlanFeatureLink {
  readonly featureKey: string;
  readonly isIncluded: boolean;
  /** Tope numérico cuando lo hay (nº de fotos, de recordatorios). NULL = sin límite. */
  readonly limitValue: number | null;
}

export interface PlanSummary {
  readonly key: string;
  readonly name: string;
  readonly description: string | null;
  /** En centavos. El dinero nunca se representa en punto flotante. */
  readonly priceCents: number;
  readonly currency: string;
  readonly durationMonths: number;
  /** Orden jerárquico. Se compara contra `componentVariants.minPlanRank`. */
  readonly rank: number;
  readonly isActive: boolean;
  readonly features: readonly PlanFeatureLink[];
}

/**
 * Planes y funcionalidades se devuelven juntos porque la pantalla los cruza.
 *
 * La rejilla de «qué incluye cada plan» necesita las dos listas a la vez, y pedirlas por
 * separado abriría la puerta a pintarla con un catálogo de funcionalidades más nuevo que el
 * de planes: aparecerían columnas sin ninguna marca, indistinguibles de una funcionalidad
 * que de verdad no incluye nadie.
 */
export interface PlanCatalog {
  readonly plans: readonly PlanSummary[];
  readonly features: readonly FeatureSummary[];
}

export interface TemplateSummary {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly description: string | null;
  /**
   * Para qué tipos de evento encaja la plantilla.
   *
   * Es una lista y no un campo porque una estructura —«editorial», «cinematográfica»— sirve para
   * varias celebraciones: la misma composición vale para una boda y para una graduación. Vacía
   * significa «no se sugiere para ninguno», que es distinto de «sirve para todos»: ver
   * `templateEventTypes` en el esquema.
   */
  readonly eventTypes: readonly { readonly key: string; readonly name: string }[];
  readonly previewImageUrl: string | null;
  /**
   * El tema con el que se diseñó la plantilla. **Preselecciona, no impone.**
   *
   * Lo usa el alta de un evento para llegar con el tema ya elegido, que es lo que la columna
   * `templates.default_theme_key` existe para hacer. `null` cuando la plantilla no sugiere
   * ninguno; entonces hay que elegirlo a mano, y cualquiera vale.
   */
  readonly defaultThemeKey: string | null;
  readonly isActive: boolean;
  /** Cuántos bloques trae su composición por defecto. */
  readonly blockCount: number;
  /** Planes en los que se ofrece. Vacío = no se ofrece en ninguno. */
  readonly planKeys: readonly string[];
}

export interface ThemeSummary {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly description: string | null;
  readonly isActive: boolean;
  /**
   * Los tokens de diseño, tal cual. Se devuelven sin interpretar porque un tema solo cambia
   * apariencia y su contenido no necesita ser consultable; la pantalla extrae de aquí los
   * colores para enseñar la paleta.
   */
  readonly tokens: Record<string, unknown>;
}

/** Una variante registrada: 'hero.classic', 'gallery.masonry'. */
export interface ComponentVariantSummary {
  readonly id: string;
  /** Generada en la base de datos como `block_key || '.' || variant_key`. */
  readonly registryId: string;
  readonly variantKey: string;
  readonly name: string;
  readonly description: string | null;
  /** Rango mínimo de plan que puede usarla. Permite vender variantes premium. */
  readonly minPlanRank: number;
  readonly isActive: boolean;
}

/** Un bloque de la invitación con todas sus variantes. */
export interface BlockSummary {
  readonly key: string;
  readonly name: string;
  readonly description: string | null;
  /** Funcionalidad de plan que lo habilita. NULL = disponible en todos los planes. */
  readonly featureKey: string | null;
  readonly featureName: string | null;
  readonly variants: readonly ComponentVariantSummary[];
}

export interface EventTypeSummary {
  readonly key: string;
  readonly name: string;
  readonly isActive: boolean;
  readonly templateCount: number;
}

export interface CatalogRepository {
  loadPlans(): Promise<PlanCatalog>;
  listTemplates(): Promise<readonly TemplateSummary[]>;
  listThemes(): Promise<readonly ThemeSummary[]>;
  /** El Component Registry, agrupado por bloque. */
  listRegistry(): Promise<readonly BlockSummary[]>;
  listEventTypes(): Promise<readonly EventTypeSummary[]>;
}
