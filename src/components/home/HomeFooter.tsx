import Image from 'next/image';
import Link from 'next/link';

const EXPLORE = [
  ['/#plantillas', 'Plantillas'],
  ['/#como-funciona', 'Así funciona'],
  ['/#confirmaciones', 'Confirmaciones'],
  ['/#planes', 'Planes'],
  ['/#preguntas', 'Preguntas'],
  ['/panel', 'Entrar al panel'],
] as const;

/**
 * El pie, en el mismo vino que el cierre y separado de él por un filete claro: se lee como el
 * remate de la misma sección. Cuatro columnas en escritorio y dos en el teléfono.
 *
 * La última es para el invitado que llegó buscando la marca en lugar de abrir su enlace.
 */
export function HomeFooter({
  templates,
}: {
  readonly templates: readonly { readonly name: string; readonly href: string }[];
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-(--h-wine) px-5 text-(--h-wine-ink) sm:px-8">
      <div className="mx-auto max-w-7xl border-t border-(--h-wine-ink)/15 pt-14 pb-10 sm:pt-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr] lg:gap-x-10">
          <div className="col-span-2 lg:col-span-1">
            <Image
              src="/brand/logo.png"
              alt="MiEvento"
              width={2022}
              height={487}
              sizes="180px"
              className="h-mark-cream h-10 w-auto"
            />
            <p className="mt-5 mb-0 max-w-[30ch] text-[15px] leading-relaxed text-(--h-wine-ink)/75">
              Invitaciones digitales para bodas y XV años, con un panel para organizarlas.
            </p>
          </div>

          <nav aria-label="Explora">
            <FooterTitle>Explora</FooterTitle>
            <ul className="m-0 mt-4 grid list-none gap-2.5 p-0 text-[15px]">
              {EXPLORE.map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="text-(--h-wine-ink)/85 underline-offset-4 hover:text-(--h-wine-ink) hover:underline">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Plantillas">
            <FooterTitle>Plantillas</FooterTitle>
            <ul className="m-0 mt-4 grid list-none gap-2.5 p-0 text-[15px]">
              {templates.map((template) => (
                <li key={template.href}>
                  <Link
                    href={template.href}
                    className="text-(--h-wine-ink)/85 underline-offset-4 hover:text-(--h-wine-ink) hover:underline"
                  >
                    {template.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="col-span-2 lg:col-span-1">
            <FooterTitle>¿Recibiste una invitación?</FooterTitle>
            <p className="mt-4 mb-0 max-w-[40ch] text-[15px] leading-relaxed text-(--h-wine-ink)/75">
              Abre el enlace completo que te compartieron. Incluye un código propio de tu familia, y sin
              él la invitación no se puede ver.
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col-reverse items-start justify-between gap-4 border-t border-(--h-wine-ink)/15 pt-6 text-[13px] text-(--h-wine-ink)/70 sm:flex-row sm:items-center">
          <p className="m-0">© {year} MiEvento</p>
          <a href="#" className="tracking-[0.14em] uppercase underline-offset-4 hover:text-(--h-wine-ink) hover:underline">
            Volver arriba <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterTitle({ children }: { readonly children: string }) {
  return <p className="m-0 text-[11px] tracking-[0.24em] text-(--h-gold) uppercase">{children}</p>;
}
