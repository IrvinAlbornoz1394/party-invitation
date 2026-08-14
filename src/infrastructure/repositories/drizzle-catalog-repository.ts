import 'server-only';

import { asc, eq, sql } from 'drizzle-orm';
import type {
  BlockSummary,
  CatalogRepository,
  ComponentVariantSummary,
  EventTypeSummary,
  PlanCatalog,
  PlanFeatureLink,
  TemplateSummary,
  ThemeSummary,
} from '@/domain/catalog/catalog-repository';
import { db } from '../db/client';
import {
  blocks,
  componentVariants,
  eventTypes,
  features,
  planFeatures,
  plans,
  templateBlocks,
  templateEventTypes,
  templatePlans,
  templates,
  themes,
} from '../db/schema';

/**
 * El catálogo, leído directamente con Drizzle.
 *
 * No pasa por `withTenant()` ni por `withAuthorizedClientContext()`, y es correcto: estas
 * tablas no tienen `client_id`, no están bajo Row-Level Security y son el catálogo global de
 * la plataforma. Fijar un contexto de inquilino aquí no filtraría nada —no hay columna
 * contra la que comparar— y sugeriría un aislamiento que estas tablas no tienen.
 *
 * Lo que sí las protege es el permiso: el rol de la aplicación tiene `SELECT` y nada más
 * (`0001_security.sql`, sección 4). Un `insert` desde aquí no compilaría contra el permiso
 * aunque alguien lo escribiera.
 *
 * ## Sobre los conteos
 *
 * Van en consultas aparte y se cruzan en memoria, en vez de en un `LEFT JOIN` con `GROUP BY`
 * sobre la consulta principal. A esta escala —decenas de plantillas, no miles— la diferencia
 * de tiempo es despreciable y se gana algo concreto: un `join` con varias tablas hijas
 * multiplica las filas entre sí, y el conteo de una queda inflado por las filas de la otra.
 * Es el error clásico de «tengo 3 bloques y me dice 9».
 */
export class DrizzleCatalogRepository implements CatalogRepository {
  async loadPlans(): Promise<PlanCatalog> {
    /*
     * Las tres consultas van en paralelo porque no dependen entre sí. En serie, la pantalla
     * de planes pagaría tres viajes encadenados a la base de datos para pintar una rejilla.
     */
    const [planRows, featureRows, linkRows] = await Promise.all([
      db.select().from(plans).orderBy(asc(plans.rank)),
      db.select().from(features).orderBy(asc(features.category), asc(features.name)),
      db.select().from(planFeatures),
    ]);

    const linksByPlan = new Map<string, PlanFeatureLink[]>();

    for (const link of linkRows) {
      const list = linksByPlan.get(link.planKey) ?? [];

      list.push({
        featureKey: link.featureKey,
        isIncluded: link.isIncluded,
        limitValue: link.limitValue,
      });
      linksByPlan.set(link.planKey, list);
    }

    return {
      plans: planRows.map((plan) => ({
        key: plan.key,
        name: plan.name,
        description: plan.description,
        priceCents: plan.priceCents,
        currency: plan.currency,
        durationMonths: plan.durationMonths,
        rank: plan.rank,
        isActive: plan.isActive,
        features: linksByPlan.get(plan.key) ?? [],
      })),
      features: featureRows.map((feature) => ({
        key: feature.key,
        name: feature.name,
        description: feature.description,
        category: feature.category,
      })),
    };
  }

  async listTemplates(): Promise<readonly TemplateSummary[]> {
    const [rows, typeLinks, blockCounts, planLinks] = await Promise.all([
      db
        .select({
          id: templates.id,
          key: templates.key,
          name: templates.name,
          description: templates.description,
          previewImageUrl: templates.previewImageUrl,
          isActive: templates.isActive,
        })
        .from(templates)
        .orderBy(asc(templates.name)),
      /*
       * Los tipos van en su propia consulta y no en un `join` con la de arriba: con el join, una
       * plantilla que encaja en tres tipos devolvería tres filas y habría que volver a plegarlas
       * en memoria de todos modos. Dos consultas planas y un `Map` se leen mejor y no multiplican
       * nada.
       */
      db
        .select({
          templateId: templateEventTypes.templateId,
          key: templateEventTypes.eventTypeKey,
          name: eventTypes.name,
        })
        .from(templateEventTypes)
        .innerJoin(eventTypes, eq(templateEventTypes.eventTypeKey, eventTypes.key))
        .orderBy(asc(eventTypes.name)),
      db
        .select({
          templateId: templateBlocks.templateId,
          total: sql<number>`count(*)::int`,
        })
        .from(templateBlocks)
        .groupBy(templateBlocks.templateId),
      db.select().from(templatePlans),
    ]);

    const countByTemplate = new Map(blockCounts.map((row) => [row.templateId, row.total]));

    const typesByTemplate = new Map<string, { key: string; name: string }[]>();

    for (const link of typeLinks) {
      const list = typesByTemplate.get(link.templateId) ?? [];

      list.push({ key: link.key, name: link.name });
      typesByTemplate.set(link.templateId, list);
    }
    const plansByTemplate = new Map<string, string[]>();

    for (const link of planLinks) {
      const list = plansByTemplate.get(link.templateId) ?? [];

      list.push(link.planKey);
      plansByTemplate.set(link.templateId, list);
    }

    return rows.map((row) => ({
      ...row,
      eventTypes: typesByTemplate.get(row.id) ?? [],
      blockCount: countByTemplate.get(row.id) ?? 0,
      planKeys: plansByTemplate.get(row.id) ?? [],
    }));
  }

  async listThemes(): Promise<readonly ThemeSummary[]> {
    const rows = await db
      .select({
        id: themes.id,
        key: themes.key,
        name: themes.name,
        description: themes.description,
        isActive: themes.isActive,
        tokens: themes.tokens,
      })
      .from(themes)
      .orderBy(asc(themes.name));

    return rows;
  }

  async listRegistry(): Promise<readonly BlockSummary[]> {
    const [blockRows, variantRows] = await Promise.all([
      db
        .select({
          key: blocks.key,
          name: blocks.name,
          description: blocks.description,
          featureKey: blocks.featureKey,
          featureName: features.name,
        })
        .from(blocks)
        /*
         * `leftJoin` aquí sí: `feature_key` es nullable a propósito —un bloque sin
         * funcionalidad asociada está disponible en todos los planes— y ese NULL significa
         * algo, así que no puede descartar la fila.
         */
        .leftJoin(features, eq(blocks.featureKey, features.key))
        .orderBy(asc(blocks.name)),
      db
        .select()
        .from(componentVariants)
        // Por bloque y luego por rango: dentro de cada bloque, las variantes de plan básico
        // salen antes que las premium, que es el orden en el que se eligen.
        .orderBy(asc(componentVariants.blockKey), asc(componentVariants.minPlanRank)),
    ]);

    const variantsByBlock = new Map<string, ComponentVariantSummary[]>();

    for (const variant of variantRows) {
      const list = variantsByBlock.get(variant.blockKey) ?? [];

      list.push({
        id: variant.id,
        registryId: variant.registryId,
        variantKey: variant.variantKey,
        name: variant.name,
        description: variant.description,
        minPlanRank: variant.minPlanRank,
        isActive: variant.isActive,
      });
      variantsByBlock.set(variant.blockKey, list);
    }

    return blockRows.map((block) => ({
      ...block,
      variants: variantsByBlock.get(block.key) ?? [],
    }));
  }

  async listEventTypes(): Promise<readonly EventTypeSummary[]> {
    const [rows, templateCounts] = await Promise.all([
      db.select().from(eventTypes).orderBy(asc(eventTypes.name)),
      db
        .select({
          eventTypeKey: templateEventTypes.eventTypeKey,
          total: sql<number>`count(*)::int`,
        })
        .from(templateEventTypes)
        .groupBy(templateEventTypes.eventTypeKey),
    ]);

    const countByType = new Map(templateCounts.map((row) => [row.eventTypeKey, row.total]));

    return rows.map((row) => ({
      key: row.key,
      name: row.name,
      isActive: row.isActive,
      templateCount: countByType.get(row.key) ?? 0,
    }));
  }
}
