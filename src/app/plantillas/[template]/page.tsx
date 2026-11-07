import type { Metadata } from 'next';
import { DEMO_TEMPLATES, findDemoTemplate } from '@/components/invitation/demo/templates';
import { DemoStudioPage } from '@/components/showcase/DemoStudioPage';

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

  if (!found) return { title: 'Plantilla no encontrada · MiEvento' };

  return {
    title: `${found.eventTypeName} · ${found.name} — Plantilla de MiEvento`,
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
  return <DemoStudioPage template={template} />;
}
