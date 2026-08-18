import Image from 'next/image';
import Link from 'next/link';
import { MARKETING_PHOTOS } from './photos';

/**
 * El cierre y el pie del sitio.
 *
 * Van juntos porque son el mismo momento: quien llega hasta abajo o se decide o se va, y separar
 * la última llamada del pie deja una franja muerta entre las dos.
 *
 * ## La última llamada va sobre fotografía
 *
 * Es la única sección de la página con una imagen a sangre y texto encima, y es a propósito: el
 * cierre tiene que pesar más que lo que hay antes o no cierra nada. El velo es del color de la
 * marca y opaco de sobra —no está para ambientar sino para que un botón blanco y un titular
 * grande se lean sobre una fotografía que no controlamos—, así que la imagen queda como textura
 * y el contraste no depende de qué se vea en ella.
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
  const photo = MARKETING_PHOTOS.closing;

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <Image
          src={photo.url}
          alt={photo.alt}
          fill
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-plum/88" />

        <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-24 text-center sm:px-10 sm:py-32">
          <p className="m-0 flex items-center gap-4 text-[11px] tracking-[0.32em] text-white/70 uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-white/40" />
            Empecemos
            <span aria-hidden="true" className="h-px w-8 bg-white/40" />
          </p>

          <h2 className="mt-8 mb-0 font-display text-[clamp(2.2rem,6vw,3.75rem)] leading-[1.06] font-medium tracking-[-0.03em] text-white">
            Cuéntanos qué celebras
            <span className="block italic">y qué día</span>
          </h2>

          <p className="mt-7 mb-0 max-w-xl text-[16px] leading-relaxed text-white/80">
            Nosotros armamos la invitación y te entregamos el panel listo para empezar a contar
            confirmaciones.
          </p>

          <Link
            href="/panel"
            className="mt-11 inline-flex min-h-12 items-center justify-center bg-white px-9 text-[12px] font-semibold tracking-[0.14em] text-plum uppercase transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-plum focus-visible:outline-none"
          >
            Entrar al panel
          </Link>
        </div>
      </section>

      <footer className="bg-ivory">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12 sm:px-10 md:flex-row md:items-center md:justify-between">
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
