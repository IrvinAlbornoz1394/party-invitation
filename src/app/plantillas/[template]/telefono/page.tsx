import type { Metadata } from 'next';
import { DEMO_TEMPLATES } from '@/components/invitation/demo/templates';
import { DemoStudioPage } from '@/components/showcase/DemoStudioPage';

interface PageProps {
  params: Promise<{ template: string }>;
}

/**
 * La demo sin mandos ni música, para el teléfono 3D de la página de inicio, que la mete en un
 * `<iframe>`. No se indexa: es una pieza de la portada, no una página.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export function generateStaticParams() {
  return DEMO_TEMPLATES.map((template) => ({ template: template.key }));
}

export default async function TemplatePhonePage({ params }: PageProps) {
  const { template } = await params;
  return <DemoStudioPage template={template} bare />;
}
