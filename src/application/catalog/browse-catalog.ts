import { canAdministerPlatform } from '@/domain/auth/actor';
import type { PlatformCredentials } from '@/domain/auth/platform-credentials';
import type {
  BlockSummary,
  CatalogRepository,
  EventTypeSummary,
  PlanCatalog,
  TemplateSummary,
  ThemeSummary,
} from '@/domain/catalog/catalog-repository';

/**
 * Consultar el catálogo de la plataforma.
 *
 * Los cinco casos de uso viven en el mismo archivo porque son la misma operación sobre
 * distintas partes de la biblioteca, y separarlos daría cinco archivos de nueve líneas cuya
 * única diferencia sería el método que llaman. Leerlos juntos hace evidente que comparten la
 * misma regla de acceso.
 *
 * Todos son de **solo lectura**, y eso no es una fase intermedia: el catálogo lo administra
 * el rol dueño de Postgres, no la aplicación. El rol `mievento_app` tiene únicamente
 * `SELECT` sobre estas tablas, así que una pantalla que intentara dar de alta una plantilla
 * fallaría en la base de datos aunque alguien escribiera el formulario. Es deliberado: un
 * evento no puede inventar planes, variantes ni temas, y `docs/PROJECT.md` reserva ampliar la
 * biblioteca a una decisión de producto, no a un formulario del panel.
 *
 * Devolver vacío —y no lanzar— cuando falta el privilegio es el mismo criterio que en
 * `ListClients`: el fallo cerrado se manifiesta como «no hay datos», nunca como datos que no
 * tocan.
 */

export class LoadPlanCatalog {
  constructor(private readonly catalog: CatalogRepository) {}

  async execute(credentials: PlatformCredentials): Promise<PlanCatalog> {
    if (!canAdministerPlatform(credentials.actor)) return { plans: [], features: [] };

    return this.catalog.loadPlans();
  }
}

export class ListTemplates {
  constructor(private readonly catalog: CatalogRepository) {}

  async execute(credentials: PlatformCredentials): Promise<readonly TemplateSummary[]> {
    if (!canAdministerPlatform(credentials.actor)) return [];

    return this.catalog.listTemplates();
  }
}

export class ListThemes {
  constructor(private readonly catalog: CatalogRepository) {}

  async execute(credentials: PlatformCredentials): Promise<readonly ThemeSummary[]> {
    if (!canAdministerPlatform(credentials.actor)) return [];

    return this.catalog.listThemes();
  }
}

/** El Component Registry: qué bloques hay y qué variantes tiene cada uno. */
export class ListComponentRegistry {
  constructor(private readonly catalog: CatalogRepository) {}

  async execute(credentials: PlatformCredentials): Promise<readonly BlockSummary[]> {
    if (!canAdministerPlatform(credentials.actor)) return [];

    return this.catalog.listRegistry();
  }
}

export class ListEventTypes {
  constructor(private readonly catalog: CatalogRepository) {}

  async execute(credentials: PlatformCredentials): Promise<readonly EventTypeSummary[]> {
    if (!canAdministerPlatform(credentials.actor)) return [];

    return this.catalog.listEventTypes();
  }
}
