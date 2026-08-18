import Image from 'next/image';
import Link from 'next/link';
import { DEMO_TEMPLATES } from '@/components/invitation/demo/templates';

/**
 * Las plantillas, para verlas por dentro antes de comprar.
 *
 * Es la sección que vende. La tarjeta no lleva a una captura ni a un vídeo: lleva a la
 * invitación de verdad, montada con los mismos componentes que tendrá el evento de quien la
 * contrate. Es la diferencia entre «mira qué bonito» y «toca esto», y en un producto que se
 * decide por cómo se ve, la segunda hace todo el trabajo.
 *
 * ## Por qué la primera es distinta
 *
 * Una rejilla de cuatro tarjetas iguales dice «catálogo». Aquí la primera ocupa el doble y
 * enseña su fotografía en grande, y las otras tres van debajo: es la jerarquía de una portada de
 * revista, y evita que la sección se lea como un listado. También es honesto — hay una que
 * conviene abrir primero.
 *
 * ## Sin base de datos
 *
 * Se lee de `DEMO_TEMPLATES`, que es contenido local. Esta sección no consulta nada, así que la
 * portada sigue en pie aunque Postgres no esté — y en una página de venta, estar caído es peor
 * que estar desactualizado.
 */
export function TemplateShowcase() {
  const [featured, ...rest] = DEMO_TEMPLATES;

  if (!featured) return null;

  return (
    <section id="plantillas" className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:px-10 sm:py-28">
        {/* Centrado, como el resto de los encabezados de la página. En una sección cuyo contenido
            es una retícula simétrica, un encabezado alineado a la izquierda deja la composición
            coja por un lado. */}
        <header className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <p className="m-0 flex items-center gap-4 text-[11px] tracking-[0.3em] text-accent uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-accent/45" />
            Plantillas
            <span aria-hidden="true" className="h-px w-8 bg-accent/45" />
          </p>
          <h2 className="m-0 font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.08] font-medium tracking-[-0.03em] text-ink">
            Míralas por dentro
            <span className="block italic">antes de decidir</span>
          </h2>
          <p className="m-0 text-[16px] leading-relaxed text-ink/70">
            Cada una se abre completa y se puede cambiar en vivo: el tema y el diseño de cada
            sección. Lo que veas es exactamente lo que recibirán tus invitados.
          </p>
        </header>

        <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <TemplateCard template={featured} featured />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 lg:gap-8">
            {rest.map((template) => (
              <TemplateCard key={template.key} template={template} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TemplateCard({
  template,
  featured = false,
}: {
  readonly template: (typeof DEMO_TEMPLATES)[number];
  readonly featured?: boolean;
}) {
  return (
    /*
     * La tarjeta entera es el enlace. Con el enlace solo en el botón, el noventa por ciento de la
     * superficie que la gente intenta pulsar en un móvil no hace nada.
     */
    <Link
      href={`/plantillas/${template.key}`}
      /* Sin filete alrededor: la tarjeta es la fotografía y su pie, montados sobre el papel de
         color. Un borde de un píxel la convertía en una ficha de catálogo. */
      className="group flex h-full flex-col overflow-hidden bg-blush/50 transition-colors hover:bg-blush focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div
        className={
          featured
            ? 'relative aspect-[4/3] w-full overflow-hidden bg-blush lg:aspect-[5/4]'
            : 'relative aspect-[16/10] w-full overflow-hidden bg-blush lg:aspect-[21/9]'
        }
      >
        <Image
          src={template.cover.url}
          alt={template.cover.alt}
          fill
          sizes={featured ? '(min-width: 1024px) 45vw, 92vw' : '(min-width: 1024px) 45vw, 46vw'}
          priority={featured}
          className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
        />
      </div>

      <div
        className={
          featured
            ? 'flex flex-1 flex-col gap-3 px-7 py-8 sm:px-9 sm:py-10'
            : 'flex flex-1 flex-col gap-2 px-6 py-6'
        }
      >
        <p className="m-0 text-[10.5px] tracking-[0.24em] text-accent uppercase">
          {template.eventTypeName}
        </p>

        <h3
          className={
            featured
              ? 'm-0 font-display text-[clamp(1.75rem,3.5vw,2.5rem)] leading-tight font-light text-plum'
              : 'm-0 font-display text-[1.5rem] leading-tight font-light text-plum'
          }
        >
          {template.name}
        </h3>

        <p
          className={
            featured
              ? 'm-0 max-w-md text-[15px] leading-relaxed text-ink/70'
              : 'm-0 text-[14px] leading-relaxed text-ink/65'
          }
        >
          {template.tagline}
        </p>

        <span className="mt-auto inline-flex items-center gap-2 pt-5 text-[11.5px] font-semibold tracking-[0.16em] text-plum uppercase">
          Ver la demo
          {/* La flecha se desplaza en `hover`: es la microinteracción más barata que existe y la
              única que hace falta aquí — dice «esto lleva a otro sitio» sin añadir un botón. */}
          <span
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
