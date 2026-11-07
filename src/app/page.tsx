import type { Metadata } from 'next';
import { demoImage, QUINCE_PHOTOS, WEDDING_PHOTOS } from '@/components/invitation/demo/photos';
import { demoStructures } from '@/components/invitation/demo/templates';
import { homeDisplay } from '@/components/home/fonts';
import { HeroLive } from '@/components/home/HeroLive';
import { HomeCoupleProvider } from '@/components/home/HomeCouple';
import { HomeCta } from '@/components/home/HomeCta';
import { HomeFaq, type Faq } from '@/components/home/HomeFaq';
import { HomeFooter } from '@/components/home/HomeFooter';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HomeMotion } from '@/components/home/HomeMotion';
import { HomePhone } from '@/components/home/HomePhone';
import { HomePlans } from '@/components/home/HomePlans';
import { LiveRsvp } from '@/components/home/LiveRsvp';
import { MobileDock } from '@/components/home/MobileDock';
import { StepsStack } from '@/components/home/StepsStack';
import { TemplatesShowcase } from '@/components/home/TemplatesShowcase';
import type { ShowcaseTemplate } from '@/components/home/types';
import '@/components/home/home.css';
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
 * ## El orden
 *
 * Portada en vivo (la visitante escribe sus nombres y ve su invitación) → plantillas (mazo en el
 * teléfono, muro 3D en escritorio) → el teléfono 3D del invitado → confirmaciones llegando →
 * así funciona → planes → preguntas → cierre. Los nombres que escribe viajan por toda la página
 * (`HomeCouple`). En el teléfono, una barra fija lleva al cierre. Ver `components/home`.
 *
 * Todo lo que se afirma es del producto de hoy: las cifras salen de las plantillas y los planes
 * reales, y no hay testimonios ni artículos que no existan.
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

  const toImage = (cover: { url: string; alt?: string | null }) => ({ url: cover.url, alt: cover.alt ?? '' });

  const templates: ShowcaseTemplate[] = structures.map((structure) => ({
    key: structure.structureKey,
    name: structure.name,
    tagline: structure.tagline,
    eventTypes: structure.eventTypeNames,
    href: `/plantillas/${structure.entryKey}`,
    image: toImage(structure.cover),
  }));

  return (
    <HomeCoupleProvider>
      <div className={`home min-h-svh ${homeDisplay.variable}`}>
        <HomeMotion />
        <HomeHeader />

        {acceso === 'limite' && (
          <div role="status" className="relative z-40 bg-(--h-wine) px-5 pt-24 pb-3 text-center text-[15px] text-white">
            Demasiados intentos desde tu conexión. Espera unos minutos y vuelve a abrir el enlace
            que te compartieron.
          </div>
        )}

        <main>
          <HeroLive
            photos={{
              boda: toImage(demoImage(WEDDING_PHOTOS.exit, 2200, 1400)),
              xv: toImage(demoImage(QUINCE_PHOTOS.night, 2200, 1400)),
            }}
          />
          <TemplatesShowcase templates={templates} />
          <HomePhone />
          <LiveRsvp />
          <StepsStack
            photos={[
              toImage(demoImage(WEDDING_PHOTOS.rings, 1200, 900)),
              toImage(demoImage(QUINCE_PHOTOS.dress, 1200, 900)),
              toImage(demoImage(WEDDING_PHOTOS.guests, 1200, 900)),
            ]}
          />
          <HomePlans plans={showcase.plans} images={templates.slice(2, 5).map((template) => template.image)} />
          <HomeFaq items={FAQS} />
          <HomeCta />
        </main>

        <HomeFooter templates={templates.slice(0, 6).map(({ name, href }) => ({ name, href }))} />
        <MobileDock />
      </div>
    </HomeCoupleProvider>
  );
}
