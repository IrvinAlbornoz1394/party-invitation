import clsx from 'clsx';
import Link from 'next/link';

/**
 * La cabecera del sitio público.
 *
 * Tres cosas y ninguna más: la marca, el enlace a las plantillas y la entrada al panel. Una
 * página de venta con siete apartados en la cabecera obliga a decidir antes de haber visto nada;
 * aquí lo único que hay que decidir en los primeros diez segundos es «¿me gusta cómo se ve
 * esto?», y para eso el único destino que importa es el escaparate.
 *
 * ## Va encima de la portada, no antes
 *
 * Con `tone="overlay"` se sale del flujo y se apoya sobre la fotografía. Es lo que hace que la
 * portada empiece en el píxel cero —una franja de papel encima de una foto a sangre la enmarca y
 * le quita la mitad del efecto— y es también como se compone la papelería impresa: el membrete
 * va sobre la lámina, no en una banda aparte.
 *
 * El precio es que el contraste ya no lo garantiza un fondo propio, sino el velo de la portada.
 * Por eso el tono claro pinta en ciruela sobre el velo de papel y no en blanco: el velo aclara
 * la fotografía hasta el papel, y un blanco encima desaparecería.
 *
 * ## Por qué no se queda fija
 *
 * Porque debajo hay una portada compuesta para ocupar la pantalla. Una barra fija le roba una
 * franja permanente y, sobre todo, la enmarca: la misma razón por la que los mandos de la demo
 * se fueron a una pestaña lateral. Se desplaza con la página, y quien quiera volver arriba tiene
 * el pie.
 *
 * El enlace de salto existe porque esta cabecera va antes del contenido en el orden del DOM:
 * sin él, quien navega con teclado recorre la marca y dos enlaces en **cada** carga.
 */
export function SiteHeader({ tone = 'paper' }: { readonly tone?: 'paper' | 'overlay' }) {
  const overlay = tone === 'overlay';

  return (
    <header className={clsx('z-30', overlay ? 'absolute inset-x-0 top-0' : 'relative')}>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-plum focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Saltar al contenido
      </a>

      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-6 sm:px-10 sm:py-8">
        <Link
          href="/"
          className="font-display text-[1.6rem] leading-none tracking-[0.06em] text-plum transition-opacity hover:opacity-70"
        >
          éclat
        </Link>

        <nav className="flex items-center gap-6 sm:gap-8" aria-label="Principal">
          <Link
            href="#plantillas"
            className="hidden text-[12.5px] tracking-[0.16em] text-ink/70 uppercase transition-colors hover:text-plum sm:inline"
          >
            Plantillas
          </Link>
          <Link
            href="#planes"
            className="hidden text-[12.5px] tracking-[0.16em] text-ink/70 uppercase transition-colors hover:text-plum sm:inline"
          >
            Planes
          </Link>
          <Link
            href="/panel"
            className="text-[12.5px] tracking-[0.16em] text-plum uppercase underline decoration-line underline-offset-[6px] transition-colors hover:decoration-accent"
          >
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  );
}
