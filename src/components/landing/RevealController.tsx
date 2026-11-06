'use client';

import { useEffect } from 'react';

/**
 * Las entradas de cada sección, con un solo vigilante para toda la página.
 *
 * Cualquier elemento con `data-reveal` sube y aparece la primera vez que su borde superior entra
 * en pantalla. El retardo se escribe en el propio elemento (`style={{ '--d': '90ms' }}`), así que
 * el escalonado —titular, luego texto, luego imagen— se lee en el marcado de cada sección.
 *
 * ## Por qué no un `IntersectionObserver`
 *
 * Porque un observador solo avisa cuando un elemento **cruza** la pantalla. Un salto —el enlace
 * a «Planes» de la cabecera, la tecla Fin— lleva a un elemento de «debajo» a «encima» sin pasar
 * nunca por dentro, y ese elemento se quedaba oculto. Aquí se revela todo lo que ya está a la
 * altura de la pantalla o por encima de ella, se haya visto pasar o no.
 *
 * ## Sin script, todo se ve
 *
 * El estado oculto solo existe mientras `.landing` lleva `data-armed`, y ese atributo lo pone este
 * componente. Si el JavaScript no llega, la página se pinta completa y quieta. Con movimiento
 * reducido no se arma nada.
 */
export function RevealController() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.landing');
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let pending = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    let frame = 0;

    const check = () => {
      frame = 0;
      const line = window.innerHeight * 0.92;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top > line) return true;
        el.classList.add('is-in');
        return false;
      });
      if (pending.length === 0) stop();
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };

    /* Un cambio de tamaño de la ventana no siempre dispara `resize` (las herramientas de captura
       y algunos navegadores al girar el teléfono); el tamaño del documento sí cambia. */
    const sized = new ResizeObserver(schedule);

    const stop = () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      sized.disconnect();
    };

    root.dataset.armed = '';
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    sized.observe(document.documentElement);
    /* Un fotograma después de armar, para que lo que ya está en pantalla entre con su transición
       en lugar de aparecer de golpe. */
    frame = requestAnimationFrame(() => {
      frame = 0;
      schedule();
    });

    return () => {
      stop();
      cancelAnimationFrame(frame);
      delete root.dataset.armed;
    };
  }, []);

  return null;
}
