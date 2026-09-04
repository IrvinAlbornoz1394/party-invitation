'use client';

import { Check, Minus } from 'lucide-react';
import type { PlanCatalog, PlanSummary } from '@/domain/catalog/catalog-repository';
import { formatMoney, pluralize } from '../format';
import { CodeCell } from '../primitives/Cell';
import { EmptyState } from '../primitives/EmptyState';
import { PageHeader } from '../primitives/PageHeader';
import { SectionCard } from '../primitives/SectionCard';
import { StatusPill } from '../primitives/StatusPill';
import { activeStatus } from '../primitives/status-display';

/**
 * Los planes y qué incluye cada uno.
 *
 * El plan se vende **por evento**, no por cliente: un mismo cliente puede tener una boda
 * Premium y unos XV Esencial. Se dice en la pantalla porque es la confusión más fácil de
 * cometer al mirar una lista de planes junto a una de clientes.
 *
 * ## Por qué una rejilla y no una tabla por plan
 *
 * La pregunta que se trae aquí es comparativa —«¿qué me da Premium que no me dé Esencial?»—
 * y una tabla por plan obliga a recordar la columna anterior mientras se lee la siguiente.
 * Con las funcionalidades en filas y los planes en columnas, la diferencia se ve recorriendo
 * una línea.
 *
 * Las marcas nunca son solo un icono de color: cada celda lleva su texto para lector de
 * pantalla, y el límite —«hasta 200»— se escribe cuando existe. Un tic verde y un tic verde
 * con un número al lado se distinguen; dos tics verdes de distinto tono, no.
 */
export function PlansScreen({ catalog }: { readonly catalog: PlanCatalog }) {
  const { plans, features } = catalog;

  if (plans.length === 0) {
    return (
      <>
        <PageHeader title="Planes" description="Qué incluye cada plan de la plataforma." />
        <SectionCard>
          <EmptyState
            title="No hay planes registrados"
            description="Los planes se cargan con el seed o se dan de alta con el rol dueño de la base de datos."
          />
        </SectionCard>
      </>
    );
  }

  // Las funcionalidades se agrupan por categoría, que es el agrupador que la propia tabla
  // `features` define para la interfaz.
  const categories = [...new Set(features.map((feature) => feature.category))];

  return (
    <>
      <PageHeader
        title="Planes"
        description="El plan se contrata por evento, no por cliente: la misma familia puede tener una boda Premium y unos XV Esencial al mismo tiempo."
      />

      <div className="dash-grid dash-grid--wide">
        {plans.map((plan) => (
          <PlanCard key={plan.key} plan={plan} />
        ))}
      </div>

      <SectionCard
        title="Qué incluye cada plan"
        subtitle={pluralize(features.length, 'funcionalidad', 'funcionalidades')}
        flush
      >
        {features.length === 0 ? (
          <EmptyState
            title="No hay funcionalidades registradas"
            description="Sin funcionalidades no hay nada que asignar a los planes."
          />
        ) : (
          /*
           * El desbordamiento lo gestiona este contenedor y no la página. Con cinco planes
           * la rejilla no cabe en un teléfono, y sin este envoltorio sería el `body` el
           * que se desplazaría en horizontal — el fallo que hace que toda la interfaz se
           * mueva al arrastrar, no solo la tabla.
           */
          <div className="dash-matrix__scroll">
            <table className="dash-matrix">
              <caption className="dash-sr-only">
                Funcionalidades incluidas en cada plan, agrupadas por categoría
              </caption>
              <thead>
                <tr>
                  <th scope="col">Funcionalidad</th>
                  {plans.map((plan) => (
                    <th scope="col" key={plan.key}>
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              {categories.map((category) => (
                <tbody key={category}>
                  <tr className="dash-matrix__group">
                    {/* `colSpan` sobre todas las columnas: es un rótulo de sección dentro
                        de la tabla, no una fila de datos. */}
                    <th scope="colgroup" colSpan={plans.length + 1}>
                      {categoryLabel(category)}
                    </th>
                  </tr>
                  {features
                    .filter((feature) => feature.category === category)
                    .map((feature) => (
                      <tr key={feature.key}>
                        <th scope="row">
                          <span className="dash-cell__primary">{feature.name}</span>
                          {feature.description && (
                            <span className="dash-cell__secondary">{feature.description}</span>
                          )}
                        </th>
                        {plans.map((plan) => {
                          const link = plan.features.find(
                            (candidate) => candidate.featureKey === feature.key,
                          );
                          const included = link?.isIncluded ?? false;

                          return (
                            <td key={plan.key}>
                              {included ? (
                                <span className="dash-matrix__yes">
                                  <Check size={15} strokeWidth={2.5} aria-hidden="true" />
                                  {link?.limitValue !== null && link?.limitValue !== undefined && (
                                    <span className="dash-matrix__limit">
                                      hasta {link.limitValue}
                                    </span>
                                  )}
                                  <span className="dash-sr-only">
                                    {feature.name} incluido en {plan.name}
                                    {link?.limitValue !== null && link?.limitValue !== undefined
                                      ? `, hasta ${link.limitValue}`
                                      : ''}
                                  </span>
                                </span>
                              ) : (
                                <span className="dash-matrix__no">
                                  <Minus size={15} strokeWidth={2.5} aria-hidden="true" />
                                  <span className="dash-sr-only">
                                    {feature.name} no incluido en {plan.name}
                                  </span>
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </tbody>
              ))}
            </table>
          </div>
        )}
      </SectionCard>
    </>
  );
}

function PlanCard({ plan }: { readonly plan: PlanSummary }) {
  const included = plan.features.filter((feature) => feature.isIncluded).length;

  return (
    <article className="dash-card dash-plan">
      <div className="dash-plan__head">
        <div>
          <h2 className="dash-card__title">{plan.name}</h2>
          <CodeCell>{plan.key}</CodeCell>
        </div>
        <StatusPill appearance={activeStatus(plan.isActive)} />
      </div>

      <p className="dash-plan__price">
        {formatMoney(plan.priceCents, plan.currency)}
        <span className="dash-plan__period">
          {plan.durationMonths === 12
            ? '/ año'
            : `/ ${pluralize(plan.durationMonths, 'mes', 'meses')}`}
        </span>
      </p>

      {plan.description && <p className="dash-card__subtitle">{plan.description}</p>}

      <p className="dash-plan__meta">
        {pluralize(included, 'funcionalidad incluida', 'funcionalidades incluidas')} · rango{' '}
        {plan.rank}
      </p>
    </article>
  );
}

/**
 * Las categorías vienen de la base de datos como claves en minúscula. Se traducen aquí y no
 * en la consulta porque son una etiqueta de interfaz, no un dato: si mañana el panel fuera
 * bilingüe, este es el único sitio que cambiaría.
 */
const CATEGORY_LABEL: Record<string, string> = {
  invitacion: 'Invitación',
  gestion: 'Gestión',
  automatizacion: 'Automatización',
  extras: 'Extras',
};

function categoryLabel(category: string): string {
  return CATEGORY_LABEL[category] ?? category;
}
