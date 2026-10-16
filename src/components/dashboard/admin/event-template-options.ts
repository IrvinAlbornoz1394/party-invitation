import type { NewEventOptions } from '@/application/events/create-event';
import type { TemplateSummary } from '@/domain/catalog/catalog-repository';

/*
 * Cómo se acotan las plantillas por tipo y plan, compartido por «Dar de alta evento» y «Editar
 * evento». Fuera de los componentes porque un módulo que exporta componentes y funciones sueltas
 * pierde el fast refresh (ver `format.ts`).
 */

export function templateOf(
  options: NewEventOptions,
  templateId: string,
): TemplateSummary | undefined {
  return options.templates.find((template) => template.id === templateId);
}

/** Una plantilla encaja si el catálogo la declara para ese tipo y para ese plan. */
export function matchesTemplate(
  template: TemplateSummary | undefined,
  eventTypeKey: string,
  planKey: string,
): boolean {
  if (!template) return false;
  if (eventTypeKey !== '' && !template.eventTypes.some((type) => type.key === eventTypeKey)) {
    return false;
  }

  return planKey === '' || template.planKeys.includes(planKey);
}
