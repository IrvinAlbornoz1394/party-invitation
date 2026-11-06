import type { Metadata } from 'next';
import { demoStructures } from '@/components/invitation/demo/templates';
import { ClosingCta } from '@/components/landing/ClosingCta';
import { type Faq, FaqIndex } from '@/components/landing/FaqIndex';
import { stackHeadline, stackText } from '@/components/landing/fonts';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingHero } from '@/components/landing/LandingHero';
import { PanelPlate } from '@/components/landing/PanelPlate';
import { PlansTable } from '@/components/landing/PlansTable';
import { RevealController } from '@/components/landing/RevealController';
import { TemplateRow } from '@/components/landing/TemplateRow';
import '@/components/landing/landing.css';
import { browseShowcase } from '@/infrastructure/container';

export const metadata: Metadata = {
  title: 'MiEvento · Invitaciones digitales que además organizan tu fiesta',
  description:
    'Invitaciones digitales para bodas y XV años. Cada familia confirma desde su propio enlace y tú ves la cuenta en tu panel.',
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    title: 'MiEvento · Invitaciones digitales',
    description: 'Tu invitación sabe quién va: diseño de invitación y panel de confirmaciones.',
  },
};

/**
 * Las preguntas. Cada respuesta dice solo lo que el producto hace hoy: la diferencia entre
 * WhatsApp y confirmación en línea sale de cómo están armados los planes en el catálogo.
 */
const FAQS: readonly Faq[] = [
  {
    question: '¿Mis invitados tienen que descargar algo?',
    answer: 'No. La invitación se abre en el navegador de su teléfono, desde el enlace que les mandas.',
  },
  {
    question: '¿Cómo confirman su asistencia?',
    answer:
      'En Esencial y Plus, el botón de confirmar les abre WhatsApp con el mensaje ya escrito para ti. En Premium confirman en la misma invitación y la respuesta llega a tu panel.',
  },
  {
    question: '¿Cómo sé cuántos lugares tiene cada familia?',
    answer:
      'En Premium, al dar de alta a cada familia le apartas sus lugares. Al confirmar eligen cuántos van, de uno hasta ese número.',
  },
  {
    question: '¿Puedo ver las plantillas antes de contratar?',
    answer:
      'Sí. Cada una se abre completa y puedes cambiar en vivo el tipo de celebración, los colores y el diseño de cada sección.',
  },
  {
    question: '¿Para qué celebraciones es?',
    answer: 'Hoy hacemos invitaciones para bodas y para XV años.',
  },
  {
    question: '¿Cuánto cuesta?',
    answer:
      'Depende del plan y de tu celebración. Cuéntanos de tu evento y te mandamos la cotización.',
  },
];

interface PageProps {
  searchParams: Promise<{ acceso?: string }>;
}

/**
 * La portada del producto.
 *
 * ## El orden es el argumento
 *
 * Portada → plantillas → cómo funciona → el panel → planes → preguntas → cierre. Quien busca una
 * invitación decide primero por los ojos, así que las plantillas van justo después de la portada.
 * Solo después de eso alguien está dispuesto a ver por qué esto no es otra página bonita, y ahí
 * el producto se demuestra funcionando: una confirmación que puedes hacer tú y un panel que cuenta.
 *
 * ## Qué se lee de la base de datos y qué no
 *
 * Las plantillas son contenido local: la sección más importante de la página no puede depender
 * de que Postgres responda. Los planes sí vienen del catálogo, porque una página de precios que
 * promete lo que el producto ya no hace es peor que una que tarda un poco más en cargar.
 *
 * ## Es también el destino de los rebotes
 *
 * Un código de invitación incorrecto acaba aquí en silencio. Solo el exceso de intentos deja
 * rastro, con un aviso discreto: distinguir «código incorrecto» de «evento inexistente» convertiría
 * esta página en un oráculo para averiguar qué invitaciones existen.
 */
export default async function LandingPage({ searchParams }: PageProps) {
  const { acceso } = await searchParams;
  const showcase = await browseShowcase.execute();
  const structures = demoStructures();

  const toImage = (cover: { url: string; alt?: string | null }) => ({
    url: cover.url,
    alt: cover.alt ?? '',
  });

  const rowTemplates = structures.map((structure) => ({
    key: structure.structureKey,
    name: structure.name,
    tagline: structure.tagline,
    eventTypes: structure.eventTypeNames,
    href: `/plantillas/${structure.entryKey}`,
    image: toImage(structure.cover),
  }));

  const weddingCovers = structures
    .filter((structure) => structure.eventTypeNames.includes('Boda'))
    .map((structure) => toImage(structure.cover));

  return (
    <div className={`landing min-h-svh ${stackHeadline.variable} ${stackText.variable}`}>
      <RevealController />

      {acceso === 'limite' && (
        <div role="status" className="bg-(--l-accent) px-5 py-3 text-center text-[15px] text-white">
          Demasiados intentos desde tu conexión. Espera unos minutos y vuelve a abrir el enlace
          que te compartieron.
        </div>
      )}

      <main>
        <LandingHero
          frames={rowTemplates.slice(0, 5).map((template) => ({
            key: template.key,
            name: template.name,
            eventTypes: template.eventTypes.join(' · '),
            href: template.href,
            image: template.image,
          }))}
        />
        <TemplateRow templates={rowTemplates} />
        <HowItWorks covers={weddingCovers.slice(0, 4)} />
        <PanelPlate photos={rowTemplates.slice(5, 8).map((template) => template.image)} />
        <PlansTable plans={showcase.plans} />
        <FaqIndex items={FAQS} />
        <ClosingCta templates={structures.map(({ entryKey, name }) => ({ key: entryKey, name }))} />
      </main>

      <LandingFooter />
    </div>
  );
}
