'use client';

import { useEffect, useState } from 'react';
import { ChevronUp, Music2, Pause } from 'lucide-react';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';

/**
 * Los dos mandos flotantes de una invitación: la música y el volver arriba.
 *
 * No son bloques y no podrían serlo. Un bloque es una sección del documento —ocupa sitio, se
 * desplaza con la página y se puede reordenar—; esto flota encima de todas y no pertenece a
 * ninguna. Meterlos en el catálogo obligaría a que cada plantilla acordara ponerlos, y una
 * invitación sin botón de música con música sonando es una invitación que no se puede callar.
 *
 * Es lo único de la invitación que no es un bloque **ni** un tema, y por eso es también lo único
 * que el motor monta por su cuenta.
 *
 * ## Por qué es de cliente y el resto no
 *
 * Los dos necesitan estado del navegador: uno reproduce audio y el otro escucha el desplazamiento.
 * Que sea un componente aparte y no parte del motor es lo que permite que el motor y sus doce
 * bloques sigan renderizándose en el servidor: la invitación llega pintada en el HTML y esto se
 * hidrata después, sin retrasar nada de lo que se lee.
 */
export function InvitationChrome({
  musicUrl,
  musicTitle,
}: {
  /** La pista de fondo. Sin ella no se pinta el botón: no hay nada que reproducir. */
  readonly musicUrl: string | null;
  readonly musicTitle: string | null;
}) {
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2.5 pb-[env(safe-area-inset-bottom)]">
      {musicUrl ? <MusicToggle src={musicUrl} title={musicTitle} /> : null}
      <BackToTop />
    </div>
  );
}

/** El aspecto compartido: papel del tema, tinta del tema y un borde fino. */
const controlClasses =
  'pointer-events-auto grid size-11 place-items-center rounded-full border border-inv-line bg-inv-surface/85 text-inv-ink shadow-inv-soft backdrop-blur-md transition-[opacity,transform,background-color] hover:bg-inv-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inv-primary';

function MusicToggle({ src, title }: { readonly src: string; readonly title: string | null }) {
  const { playing, blocked, toggle } = useBackgroundMusic(src);

  /*
   * Tres estados y no dos. «Bloqueada» es el caso normal en un móvil: el navegador no deja sonar
   * nada hasta que alguien toca la pantalla, así que el botón tiene que pedir el toque en lugar
   * de mentir diciendo que está sonando. Ver `useBackgroundMusic` para el mecanismo.
   */
  const label = playing ? 'Pausar la música' : blocked ? 'Activar la música' : 'Reproducir la música';

  return (
    <button
      type="button"
      onClick={toggle}
      className={controlClasses}
      title={title ?? label}
      aria-label={label}
    >
      {playing ? <Pause size={17} aria-hidden /> : <Music2 size={17} aria-hidden />}
    </button>
  );
}

function BackToTop() {
  /*
   * Escondido en la portada, y no por estética: ahí lo que se quiere es que bajen. Aparece cuando
   * ya hay algo a lo que volver.
   */
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 320);

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <a
      href="#inv-top"
      className={`${controlClasses} ${scrolled ? 'opacity-100' : 'pointer-events-none translate-y-2 opacity-0'}`}
      aria-label="Volver arriba"
      /* Fuera del recorrido del tabulador mientras no se ve: un enlace invisible que recibe el
         foco deja a quien navega con teclado sin saber dónde está. */
      tabIndex={scrolled ? undefined : -1}
      aria-hidden={scrolled ? undefined : true}
    >
      <ChevronUp size={18} aria-hidden />
    </a>
  );
}
