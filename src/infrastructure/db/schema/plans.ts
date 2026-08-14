import { boolean, char, integer, pgTable, primaryKey, smallint, text } from 'drizzle-orm/pg-core';
import { timestamps } from './_shared';

/**
 * Catálogo de funcionalidades de la plataforma.
 *
 * Es una tabla y no un enum de TypeScript a propósito: la regla del negocio dice
 * que el admin "nunca podrá activar funcionalidades pertenecientes a un plan
 * superior", y eso solo se puede verificar en consulta si los planes y sus
 * funcionalidades viven en la base de datos.
 */
export const features = pgTable('features', {
  key: text('key').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  /** Agrupador para la UI: 'invitacion' | 'gestion' | 'automatizacion' | 'extras'. */
  category: text('category').notNull(),
  ...timestamps,
});

export const plans = pgTable('plans', {
  key: text('key').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  /** Precio en centavos. Nunca float: el dinero no se representa en punto flotante. */
  priceCents: integer('price_cents').notNull().default(0),
  currency: char('currency', { length: 3 }).notNull().default('MXN'),
  /** "Disponible durante 1 año" del Plan Esencial. */
  durationMonths: smallint('duration_months').notNull().default(12),
  /**
   * Orden jerárquico. Un plan solo puede habilitar variantes cuyo `min_plan_rank`
   * sea menor o igual a este valor. Esto es lo que impide vender Premium por accidente.
   */
  rank: smallint('rank').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  ...timestamps,
});

/**
 * Configuración base de cada plan. Al crear un evento el sistema copia estas filas
 * a `event_blocks`, que es lo que describe "el sistema cargará automáticamente
 * dicha configuración".
 */
export const planFeatures = pgTable(
  'plan_features',
  {
    planKey: text('plan_key')
      .notNull()
      .references(() => plans.key, { onDelete: 'cascade', onUpdate: 'cascade' }),
    featureKey: text('feature_key')
      .notNull()
      .references(() => features.key, { onDelete: 'cascade', onUpdate: 'cascade' }),
    /** Incluido en el plan. Se guarda explícito para poder listar lo NO incluido en la UI de venta. */
    isIncluded: boolean('is_included').notNull().default(true),
    /**
     * Tope numérico cuando la funcionalidad lo tiene (nº de recordatorios, de fotos,
     * de invitados). NULL significa sin límite.
     */
    limitValue: integer('limit_value'),
  },
  (t) => [primaryKey({ columns: [t.planKey, t.featureKey] })],
);
