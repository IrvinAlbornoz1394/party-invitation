import Image from 'next/image';
import Link from 'next/link';

/**
 * El pie como las dos últimas filas de un tablero: losetas llenas, sin una celda vacía.
 *
 * Arriba, qué es esto, a dónde ir y una línea para el invitado que llegó buscando la marca en
 * lugar de abrir su enlace. Abajo, el nombre a todo lo ancho y la última invitación a escribir,
 * que es la loseta entera y no un botón dentro de ella.
 */
export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="grid gap-2 p-2 sm:p-3 lg:grid-cols-12">
      <div className="order-3 flex min-h-[13.75rem] flex-col justify-between gap-6 rounded-[4px] bg-(--l-surface) p-6 lg:order-none lg:col-span-4">
        <p className="m-0 max-w-[26ch] text-(length:--step-lead) leading-snug">
          Invitaciones digitales para bodas y XV años, con un panel para organizarlas.
        </p>
        <p className="m-0 text-(length:--step-small) text-(--l-muted)">© {year} MiEvento</p>
      </div>

      <nav
        aria-label="Pie de página"
        className="order-4 rounded-[4px] bg-(--l-surface) p-6 lg:order-none lg:col-span-3"
      >
        <ul className="m-0 grid list-none gap-2 p-0">
          {[
            ['#plantillas', 'Plantillas'],
            ['#como-funciona', 'Así funciona'],
            ['#panel', 'El panel'],
            ['#planes', 'Planes'],
            ['#preguntas', 'Preguntas'],
            ['/panel', 'Entrar al panel'],
          ].map(([href, label]) => (
            <li key={href}>
              <a href={href} className="text-(--l-ink) underline-offset-4 hover:underline">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="order-5 rounded-[4px] bg-(--l-surface) p-6 lg:order-none lg:col-span-5">
        <p className="m-0 font-medium">¿Recibiste una invitación?</p>
        <p className="mt-2 mb-0 max-w-[40ch] text-(--l-muted)">
          Abre el enlace completo que te compartieron. Incluye un código propio de tu familia, y sin
          él la invitación no se puede ver.
        </p>
      </div>

      <div className="order-1 grid min-h-40 place-items-center overflow-hidden rounded-[4px] bg-(--l-field) p-6 sm:p-10 lg:order-none lg:col-span-8 lg:min-h-80">
        <Image
          src="/brand/logo.png"
          alt="MiEvento"
          width={2022}
          height={487}
          sizes="(min-width: 1024px) 60vw, 90vw"
          className="h-auto w-full max-w-[42rem]"
        />
      </div>

      <Link
        href="/cotizar"
        className="group order-2 flex min-h-48 flex-col justify-between rounded-[4px] bg-(--l-accent) p-6 text-(--l-accent-ink) transition-colors hover:bg-(--l-accent-hover) lg:order-none lg:col-span-4 lg:min-h-80"
      >
        <span className="l-display max-w-[12ch] text-[1.75rem] leading-tight">
          Cuéntanos de tu evento
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 48 48"
          className="size-12 self-end transition-transform duration-300 group-hover:translate-x-1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="square"
        >
          <path d="M6 24h34M28 12l12 12-12 12" />
        </svg>
      </Link>
    </footer>
  );
}
