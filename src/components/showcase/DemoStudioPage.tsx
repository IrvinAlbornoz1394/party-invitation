import { notFound } from 'next/navigation';
import {
  DEMO_TEMPLATES,
  demoEventTypes,
  findDemoTemplate,
  findSiblingTemplate,
} from '@/components/invitation/demo/templates';
import { registeredIds } from '@/components/invitation/registry/component-registry';
import { browseShowcase } from '@/infrastructure/container';
import { TemplateStudio, type StudioBlock } from './TemplateStudio';

/**
 * Una demo armada: el cruce del catálogo con el registro y el estudio que la pinta.
 *
 * La comparten `/plantillas/[template]` —la demo con sus mandos— y `/plantillas/[template]/telefono`
 * —la misma invitación sin mandos ni música (`bare`), para meterla en el teléfono de la página de
 * inicio—. Son dos rutas y no un parámetro de búsqueda para que las dos sigan siendo estáticas.
 *
 * El catálogo tiene variantes que todavía no tienen componente; se cruzan con `registeredIds()`,
 * la lista de lo que el código sabe pintar hoy, para no ofrecer un bloque en blanco.
 */
export async function DemoStudioPage({ template, bare = false }: { readonly template: string; readonly bare?: boolean }) {
  const found = findDemoTemplate(template);

  if (!found) notFound();

  const showcase = await browseShowcase.execute();
  const renderable = new Set(registeredIds());
  /* Solo los bloques que esta plantilla usa: ofrecer un selector de «mensajes» en una demo que
     no tiene ese bloque sería un mando que no mueve nada. */
  const usedBlocks = new Set(found.blocks.map((block) => block.blockKey));
  /* Qué bloques deja apagar esta demo. Lo decide la plantilla, no el catálogo: ver
     `DemoTemplateBlock.removable`. */
  const removableBlocks = new Set(
    found.blocks.filter((block) => block.removable).map((block) => block.blockKey),
  );

  const blocks: readonly StudioBlock[] = showcase.blocks
    .filter((block) => usedBlocks.has(block.key as never))
    .map((block) => ({
      key: block.key,
      name: block.name,
      removable: removableBlocks.has(block.key as never),
      variants: block.variants
        .filter((variant) => renderable.has(variant.registryId))
        .map((variant) => ({ registryId: variant.registryId, name: variant.name })),
    }))
    .filter((block) => block.variants.length > 0);

  return (
    /*
     * `key` fuerza a remontar el estudio al cambiar de plantilla. Sin él, React reutilizaría la
     * instancia entre rutas y la nueva plantilla se abriría con el tema y las variantes que el
     * visitante había elegido en la anterior — que no son las suyas.
     */
    <TemplateStudio
      key={found.key}
      bare={bare}
      template={found}
      templates={DEMO_TEMPLATES.map((option) => ({
        key: option.key,
        name: option.name,
        eventTypeKey: option.eventTypeKey,
        eventTypeName: option.eventTypeName,
      }))}
      /*
       * A qué demo lleva cada tipo de evento, resuelto aquí. Es la misma estructura contada para
       * el otro tipo cuando existe, y la primera de ese tipo cuando no: cambiar a XV siempre lleva
       * a unos XV, aunque esa estructura no esté hecha para ellos.
       */
      eventTypes={demoEventTypes().map((eventType) => ({
        ...eventType,
        templateKey: findSiblingTemplate(found, eventType.key)?.key ?? found.key,
      }))}
      blocks={blocks}
      themes={showcase.themes.map((theme) => ({
        key: theme.key,
        name: theme.name,
        tokens: theme.tokens,
      }))}
    />
  );
}
