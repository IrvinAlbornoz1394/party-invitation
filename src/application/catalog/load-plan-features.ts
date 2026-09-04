import type { CatalogRepository } from '@/domain/catalog/catalog-repository';

/**
 * Qué funcionalidades incluye el plan de un evento.
 *
 * Existe para que el menú del panel no tenga la oferta escrita a mano. La regla del producto es
 * que un plan «nunca podrá activar funcionalidades de un plan superior», y esa regla solo se
 * puede verificar en consulta si los planes y sus funcionalidades son **datos** — que es
 * exactamente por lo que viven en `plans` y `plan_features` y no en un objeto de TypeScript. Ver
 * «Planes en base de datos y no en código» en `docs/BACKEND.md`.
 *
 * La consecuencia práctica: mover `mesa_regalos` de Plus a Esencial en el seed cambia lo que ve
 * un cliente en su menú sin desplegar código. Con la lista en código habría dos fuentes de verdad
 * y la de la interfaz se quedaría vieja sin que nada lo señalara.
 *
 * ## No pide credenciales
 *
 * El catálogo no es dato de tenant: los mismos planes existen para todos y el rol de la
 * aplicación solo tiene SELECT sobre esas tablas. Pedir un actor aquí sugeriría que la respuesta
 * depende de quién pregunta, y no depende — lo que depende de quién pregunta es qué plan tiene su
 * evento, y eso lo resuelve la membresía antes de llegar aquí.
 */
export class LoadPlanFeatures {
  constructor(private readonly catalog: CatalogRepository) {}

  /**
   * Devuelve las claves incluidas, como conjunto.
   *
   * Un `Set` y no un array porque quien lo recibe pregunta «¿incluye esto?» una vez por sección
   * del menú, y con un array eso sería un recorrido por pregunta. Con seis secciones no importa;
   * lo que importa es que la forma del tipo diga que esto es para consultar pertenencia y no para
   * recorrer y pintar.
   *
   * Un plan desconocido —una clave que ya no está en el catálogo— devuelve el conjunto vacío, no
   * un error. Eso deja el menú en su mínimo en lugar de tumbar la pantalla, y es la lectura
   * segura: ante la duda, ninguna funcionalidad, nunca todas.
   */
  async execute(planKey: string | null): Promise<ReadonlySet<string>> {
    if (planKey === null) return new Set();

    const catalog = await this.catalog.loadPlans();
    const plan = catalog.plans.find((candidate) => candidate.key === planKey);

    if (!plan) return new Set();

    return new Set(
      plan.features.filter((link) => link.isIncluded).map((link) => link.featureKey),
    );
  }
}
