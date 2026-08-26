'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import type { Tone } from './tone';

/**
 * La señal de que la invitación sigue hacia abajo.
 *
 * Sustituye al botón «Ver la invitación» que llevaban las seis portadas. Aquel prometía algo que
 * ya estaba pasando —quien lo leía **estaba** viendo la invitación— y lo único que hacía era
 * desplazar la página, que es lo que hace el dedo. La duda real de una portada a pantalla completa
 * no es «¿cómo entro?», es «¿hay algo más?», y eso se responde con una señal que se quita sola, no
 * con un control permanente.
 *
 * ## Se va sola, por dos caminos
 *
 *   · **Al primer desplazamiento.** En cuanto la página se mueve, la pregunta está contestada y la
 *     señal sobra. El umbral son unos pocos píxeles y no cero, porque en iOS el rebote elástico
 *     dispara `scroll` sin que nadie haya hecho nada.
 *   · **A los seis segundos.** Para quien se queda mirando el retrato sin tocar nada. Seis es el
 *     tiempo en que alguien lee un nombre y una fecha; menos parpadea, y más se convierte en un
 *     adorno permanente en la primera pantalla.
 *
 * ## Por qué el reloj no arranca mientras la puerta está puesta
 *
 * La bienvenida tapa la invitación entera y bloquea el desplazamiento, y lo hace poniendo
 * `inv-gate-locked` en el `<html>` (ver `welcome-parts.tsx`). Sin mirar esa clase, los seis
 * segundos correrían **detrás del telón**: quien tarde en abrir la puerta —que es todo el mundo, la
 * puerta es para mirarla— encontraría la portada sin ninguna señal. Se observa la clase y el reloj
 * empieza cuando la puerta se ha ido.
 *
 * Es una lectura del DOM y no un contexto compartido a propósito: el contexto de la puerta lo
 * provee `WelcomeShell`, y la portada **no está dentro** de la puerta. Meterla dentro para poder
 * preguntar sería reordenar la invitación entera por una señal decorativa.
 *
 * ## El velo
 *
 * Solo sobre fotografía (`tone="onImage"`). Es un degradado corto al pie —no una capa gris sobre
 * toda la portada—, y la diferencia importa: atenuar el retrato entero para señalar un chevrón
 * apaga justo lo que se ha venido a ver. El degradado hace las dos cosas a la vez: da fondo a la
 * señal y lleva el ojo al borde inferior, que es hacia donde se pide mirar.
 *
 * Sobre papel (`tone="onSurface"`) no hay velo ninguno: el contraste ya lo garantiza el tema entre
 * `ink` y `surface`, y un degradado oscuro sobre papel claro se ve como una mancha.
 *
 * ## Accesibilidad
 *
 * `aria-hidden` y sin foco: es una pista **visual** sobre un gesto que quien navega con teclado o
 * con lector de pantalla ya tiene resuelto —las flechas y el modo de lectura recorren la página
 * entera—. Anunciar «desliza hacia abajo» ahí sería ruido. Y `pointer-events-none`, para que nunca
 * se coma un toque destinado a lo que haya debajo.
 */
export function ScrollHint({ tone = 'onImage', className }: {
  readonly tone?: Tone;
  readonly className?: string;
}) {
  const visible = useScrollHintVisible();
  const onImage = tone === 'onImage';

  return (
    <div
      aria-hidden="true"
      className={clsx(
        'pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center justify-end',
        'transition-opacity duration-700 ease-out',
        visible ? 'opacity-100' : 'opacity-0',
        className,
      )}
    >
      {/* El velo, atado al pie y solo sobre fotografía. Ver la cabecera. */}
      {onImage && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 -z-10 h-36 inv-scrim"
          data-from="bottom"
        />
      )}

      <div
        className={clsx(
          'flex flex-col items-center gap-2.5 pb-7 sm:pb-9',
          onImage ? 'text-inv-on-primary inv-on-photo' : 'text-inv-ink-soft',
        )}
      >
        <span className="text-[9.5px] tracking-[0.28em] uppercase opacity-80">Desliza</span>

        {/*
          El mismo gesto que la flecha de `welcome.spotlight`: un medallón de filete que sube y
          baja. `inv-bob` ya se apaga solo con `prefers-reduced-motion` —ver `globals.css`—, así
          que quien pide menos movimiento recibe la señal quieta, que sigue diciendo lo mismo.
        */}
        <span
          className={clsx(
            'inv-bob grid size-9 place-items-center rounded-full border',
            onImage ? 'border-current/45 bg-current/10 backdrop-blur-[2px]' : 'border-inv-line',
          )}
        >
          <ChevronDown size={16} strokeWidth={1.5} />
        </span>
      </div>
    </div>
  );
}

/**
 * Si la señal debe verse: hasta el primer desplazamiento, y como mucho seis segundos con la puerta
 * ya abierta.
 *
 * El estado empieza en `false` y no en `true`, y es deliberado: el servidor pinta la señal
 * transparente y el navegador la enciende al montar. Empezando visible, el HTML del servidor
 * llegaría con la señal puesta también para quien tiene la puerta delante —y para quien abre la
 * página ya desplazada, que pasa al volver atrás en el historial—, y se vería un parpadeo al
 * corregirse.
 */
function useScrollHintVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    /* En iOS el rebote elástico dispara `scroll` sin que nadie haya movido nada, así que el umbral
       son unos píxeles y no cero. */
    if (window.scrollY > 8) return;

    setVisible(true);

    const hide = () => setVisible(false);

    const onScroll = () => {
      if (window.scrollY > 8) hide();
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    const root = document.documentElement;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const startClock = () => {
      if (timer) return;

      timer = setTimeout(hide, 6000);
    };

    /* Con la puerta puesta el reloj espera. Ver la cabecera del componente. */
    let observer: MutationObserver | undefined;

    if (root.classList.contains('inv-gate-locked')) {
      observer = new MutationObserver(() => {
        if (root.classList.contains('inv-gate-locked')) return;

        observer?.disconnect();
        startClock();
      });

      observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    } else {
      startClock();
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      observer?.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return visible;
}
