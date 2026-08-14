import Link from 'next/link';

/**
 * El cierre y el pie del sitio.
 *
 * Van juntos porque son el mismo momento: quien llega hasta abajo o se decide o se va, y separar
 * la última llamada del pie deja una franja muerta entre las dos. La llamada se apoya en el color
 * de marca —es la única superficie llena de toda la página— y el pie es una línea de texto.
 *
 * ## Lo que no lleva
 *
 * Ni mapa del sitio, ni «enlaces rápidos», ni columnas de secciones que no existen. La página
 * tiene cuatro apartados y caben en la cabecera; repetirlos abajo en tres columnas es rellenar un
 * hueco que no había que rellenar.
 *
 * ## El recordatorio de la invitación
 *
 * La frase sobre el enlace con código está aquí y no en la cabecera porque va dirigida a alguien
 * distinto: un invitado que buscó el nombre de la marca en Google en lugar de abrir el enlace
 * que le mandaron. Es poca gente, pero llega perdida, y una línea la resuelve.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <>
      <section className="bg-plum text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-20 sm:px-10 sm:py-24 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <h2 className="m-0 font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.08] font-light">
              ¿Empezamos?
            </h2>
            <p className="mt-5 mb-0 text-[16px] leading-relaxed text-white/75">
              Cuéntanos qué celebras y qué día. Nosotros armamos la invitación y te entregamos el
              panel listo para empezar a contar confirmaciones.
            </p>
          </div>

          <Link
            href="/panel"
            className="inline-flex min-h-12 shrink-0 items-center justify-center bg-white px-8 text-[12px] font-semibold tracking-[0.14em] text-plum uppercase transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-plum focus-visible:outline-none"
          >
            Entrar al panel
          </Link>
        </div>
      </section>

      <footer className="border-t border-line bg-ivory">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:px-10 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              className="font-display text-[1.35rem] leading-none tracking-[0.06em] text-plum"
            >
              éclat
            </Link>
            <p className="m-0 text-[13px] text-ink/55">
              Invitaciones digitales y organización de eventos.
            </p>
          </div>

          <p className="m-0 max-w-md text-[13px] leading-relaxed text-ink/55">
            ¿Recibiste una invitación? Abre el enlace completo que te compartieron: incluye un
            código propio del evento y sin él no se puede ver.
          </p>

          <p className="m-0 text-[12px] text-ink/40">© {year} éclat</p>
        </div>
      </footer>
    </>
  );
}
