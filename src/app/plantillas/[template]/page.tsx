import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DEMO_TEMPLATES, findDemoTemplate } from '@/components/invitation/demo/templates';
import { registeredIds } from '@/components/invitation/registry/component-registry';
import { TemplateStudio, type StudioBlock } from '@/components/showcase/TemplateStudio';
import { browseShowcase } from '@/infrastructure/container';

interface PageProps {
  params: Promise<{ template: string }>;
}

/**
 * La demostración de una plantilla: la invitación completa, con sus mandos.
 *
 * Es pública y sin sesión — es el escaparate—. Lo único que se pide al servidor es el catálogo:
 * qué variantes y qué temas existen. El contenido de la invitación es local, así que esta página
 * no consulta ni una fila de datos de nadie.
 *
 * ## El cruce entre catálogo y código
 *
 * El catálogo tiene variantes que todavía no tienen componente —se sembró con las previstas—, y
 * ofrecerlas en el selector daría un bloque en blanco al elegirlas. Se cruzan aquí, con
 * `registeredIds()`, que es la lista de lo que el código sabe pintar hoy. El nombre bonito lo
 * pone la base de datos; lo que se puede enseñar, el registro.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { template } = await params;
  const found = findDemoTemplate(template);

  if (!found) return { title: 'Plantilla no encontrada · éclat' };

  return {
    title: `${found.eventTypeName} · ${found.name} — Plantilla de éclat`,
    description: found.tagline,
    openGraph: {
      type: 'website',
      locale: 'es_MX',
      title: `Plantilla ${found.name} para ${found.eventTypeName}`,
      description: found.tagline,
      images: [{ url: found.cover.url }],
    },
  };
}

/** Las tres demos se conocen en el build: se generan estáticas y se sirven sin esperar a nada. */
export function generateStaticParams() {
  return DEMO_TEMPLATES.map((template) => ({ template: template.key }));
}

export default async function TemplateDemoPage({ params }: PageProps) {
  const { template } = await params;
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
      template={found}
      templates={DEMO_TEMPLATES.map((option) => ({
        key: option.key,
        name: option.name,
        eventTypeName: option.eventTypeName,
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
