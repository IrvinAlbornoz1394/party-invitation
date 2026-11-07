import Image from 'next/image';
import Link from 'next/link';
import { HomeCtaHeadline } from './HomeCtaHeadline';

/**
 * El cierre: el vino del logotipo con el isologo en línea clara y las dos salidas.
 *
 * El borde de arriba baja en escalones hacia el centro —el blanco de las preguntas entra en el
 * vino como una escalinata— y lleva la mirada al sello. Es un SVG y no un `clip-path` para que
 * los escalones conserven su alto en píxeles a cualquier ancho.
 *
 * El titular es lo único de cliente: si escribieron sus nombres en la portada, les habla por su
 * nombre. Su `id` lo usa la barra fija del teléfono para esconderse al llegar aquí.
 */
export function HomeCta() {
  return (
    <section id="cotizar-cierre" aria-labelledby="cierre-titulo" className="relative bg-(--h-wine) text-(--h-wine-ink)">
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 96"
        preserveAspectRatio="none"
        className="block h-12 w-full sm:h-20"
      >
        <path
          d="M0 0 H1440 V24 H1180 V48 H980 V72 H460 V48 H260 V24 H0 Z"
          fill="var(--h-white)"
        />
      </svg>

      <div data-reveal className="mx-auto flex max-w-3xl flex-col items-center px-5 pt-10 pb-20 text-center sm:px-8 sm:pt-12 sm:pb-28">
        <Image
          src="/brand/isologo.png"
          alt=""
          width={851}
          height={693}
          sizes="128px"
          className="h-mark-cream h-auto w-28 opacity-90 sm:w-32"
        />
        <HomeCtaHeadline />
        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/cotizar" className="h-button h-button--gold">
            Cotizar mi evento
          </Link>
          <a href="#plantillas" className="h-button h-button--ghost">
            Ver plantillas
          </a>
        </div>
      </div>
    </section>
  );
}
