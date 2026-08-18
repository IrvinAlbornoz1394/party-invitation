import type { Metadata } from 'next';
import { LandingAbout } from '@/components/marketing/LandingAbout';
import { LandingHero } from '@/components/marketing/LandingHero';
import { ManagementStory } from '@/components/marketing/ManagementStory';
import { PlansSection } from '@/components/marketing/PlansSection';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { TemplateShowcase } from '@/components/marketing/TemplateShowcase';
import { browseShowcase } from '@/infrastructure/container';

export const metadata: Metadata = {
  title: 'éclat · Invitaciones digitales que además organizan tu fiesta',
  description:
    'No solo hacemos invitaciones digitales: te damos la herramienta para administrar tu evento — confirmaciones, invitados, mesas y recordatorios automáticos.',
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    title: 'éclat · Invitaciones digitales',
    description:
      'La invitación es la parte fácil. Lo demás —confirmaciones, invitados, mesas y recordatorios— lo hacemos nosotros.',
  },
};

interface PageProps {
  searchParams: Promise<{ acceso?: string }>;
}

/**
 * La portada del producto.
 *
 * ## El orden es el argumento
 *
 * Portada → quiénes somos → plantillas → lo que pasa después → planes → cierre. No es el orden
 * habitual de una página de producto, que suele poner las funcionalidades antes que el diseño;
 * aquí va al revés a propósito.
 *
 * La sección del estudio es corta y va segunda por una razón concreta: responde en cinco líneas
 * a «¿esto qué es?» antes de pedirle a nadie que abra una plantilla. Lo que **no** hace es
 * retrasar el escaparate — de ahí que sean cinco líneas y tres cifras, y no una historia.
 *
 * Quien busca una invitación digital decide primero **por los ojos**. Si lo que ve no le gusta,
 * ninguna lista de funcionalidades lo va a convencer, así que las plantillas van segundas y se
 * pueden abrir de verdad. Solo después de eso alguien está dispuesto a leer por qué esto no es
 * otra página bonita — y ahí es donde vive el argumento real del producto, que es la gestión.
 *
 * ## Qué se lee de la base de datos y qué no
 *
 * Las plantillas son contenido local: la sección más importante de la página no puede depender
 * de que Postgres responda. Los planes y los tipos de evento sí vienen del catálogo, porque una
 * página de precios que promete lo que el producto ya no hace es peor que una que tarda un poco
 * más en cargar.
 *
 * ## Es también el destino de los rebotes
 *
 * Un código de invitación incorrecto acaba aquí en silencio. Solo el exceso de intentos deja
 * rastro, y con un aviso discreto: que exista un límite no es secreto, pero distinguir «código
 * incorrecto» de «evento inexistente» convertiría esta página en un oráculo para averiguar qué
 * invitaciones existen.
 */
export default async function LandingPage({ searchParams }: PageProps) {
  const { acceso } = await searchParams;
  const showcase = await browseShowcase.execute();

  return (
    <div className="marketing min-h-svh bg-ivory">
      {acceso === 'limite' && (
        <div role="status" className="bg-plum px-5 py-3 text-center text-sm text-white/90">
          Demasiados intentos desde tu conexión. Espera unos minutos y vuelve a abrir el enlace
          que te compartieron.
        </div>
      )}

      {/* El ancla del enlace de salto es la portada y no este `main`: la cabecera ahora vive
          dentro, así que saltar aquí dejaría al teclado justo antes de la navegación —o sea, sin
          saltar nada—. Ver `LandingHero`. */}
      <main>
        {/*
          La cabecera vive dentro de la portada, no encima de ella: se apoya sobre la fotografía
          en lugar de robarle una franja de papel. El contenedor es el que la ancla, y va aquí y
          no dentro de `LandingHero` para que la portada siga siendo solo la portada.
        */}
        <div className="relative">
          <SiteHeader tone="overlay" />
          <LandingHero />
        </div>

        <LandingAbout
          themeCount={showcase.themes.length}
          eventTypeCount={showcase.eventTypes.length}
        />
        <TemplateShowcase />
        <ManagementStory />
        <PlansSection plans={showcase.plans} eventTypes={showcase.eventTypes} />
      </main>

      <SiteFooter />
    </div>
  );
}
