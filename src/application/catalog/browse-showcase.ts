import type {
  BlockSummary,
  CatalogRepository,
  EventTypeSummary,
  ThemeSummary,
} from '@/domain/catalog/catalog-repository';

/**
 * El catálogo tal como lo ve un visitante de la página pública.
 *
 * Es el mismo catálogo que consulta `/admin`, pedido por otra puerta y con dos diferencias que
 * conviene tener a la vista:
 *
 * **No pide credenciales.** No es un descuido ni una excepción: el catálogo no es de nadie —no
 * tiene `client_id`, no está bajo Row-Level Security y el rol de la aplicación solo tiene
 * `SELECT` sobre él (ver `browse-catalog.ts`)—. Enseñar qué diseños y qué temas existen es
 * justamente el trabajo de una página de demostración; esconderlos detrás de una sesión sería
 * como pedir el carnet para ver el escaparate.
 *
 * **Solo lo activo.** El panel de plataforma ve también lo desactivado, porque necesita
 * administrarlo; aquí una variante retirada no debe aparecer. Ese filtro es la única lógica de
 * este caso de uso, y por eso existe en lugar de dejar que la página llame al repositorio: si
 * estuviera en la página, la siguiente pantalla pública que se escriba se olvidaría de él.
 */
/**
 * Un plan, contado como lo cuenta una página de venta: qué incluye, con nombres.
 *
 * El precio **no** viaja. Hoy está a cero en el catálogo porque todavía no se fijó, y una página
 * pública que enseñara «$0» haría más daño que no decir nada. Cuando exista, se añade aquí y la
 * sección de planes lo pinta sin tocar nada más.
 */
export interface PublicPlan {
  readonly key: string;
  readonly name: string;
  readonly description: string | null;
  /** Orden jerárquico: el plan superior tiene el rango mayor. */
  readonly rank: number;
  /** Los nombres de lo que incluye, en el orden del catálogo. */
  readonly features: readonly string[];
}

export interface Showcase {
  readonly blocks: readonly BlockSummary[];
  readonly themes: readonly ThemeSummary[];
  readonly plans: readonly PublicPlan[];
  readonly eventTypes: readonly EventTypeSummary[];
}

export class BrowseShowcase {
  constructor(private readonly catalog: CatalogRepository) {}

  async execute(): Promise<Showcase> {
    const [blocks, themes, catalog, eventTypes] = await Promise.all([
      this.catalog.listRegistry(),
      this.catalog.listThemes(),
      this.catalog.loadPlans(),
      this.catalog.listEventTypes(),
    ]);

    const featureName = new Map(catalog.features.map((feature) => [feature.key, feature.name]));

    return {
      blocks: blocks
        .map((block) => ({
          ...block,
          variants: block.variants.filter((variant) => variant.isActive),
        }))
        // Un bloque sin variantes activas no es una opción, es una fila vacía en el selector.
        .filter((block) => block.variants.length > 0),
      themes: themes.filter((theme) => theme.isActive),
      /*
       * Solo lo incluido y con su nombre. La página de venta no enseña la matriz completa de
       * funcionalidades con sus cruces: enseña qué te llevas, que es la pregunta que se hace
       * quien está decidiendo.
       */
      plans: catalog.plans
        .filter((plan) => plan.isActive)
        .sort((a, b) => a.rank - b.rank)
        .map((plan) => ({
          key: plan.key,
          name: plan.name,
          description: plan.description,
          rank: plan.rank,
          features: plan.features
            .filter((link) => link.isIncluded)
            .map((link) => featureName.get(link.featureKey))
            .filter((name): name is string => Boolean(name)),
        })),
      eventTypes: eventTypes.filter((type) => type.isActive),
    };
  }
}
