'use client';

import { useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * Las animaciones de la página de inicio fuera de la portada, todas con GSAP y ScrollTrigger.
 * Cada sección solo se marca; aquí vive el movimiento:
 *
 * - `[data-curtain]` — un marco de foto. Una cortina vino lo tapa y se recoge hacia arriba al
 *   entrar en pantalla, mientras la foto se asienta desde un acercamiento.
 * - `.h-heading` — los titulares suben línea por línea desde detrás de una máscara.
 * - `[data-parallax]` — una foto de fondo que avanza más despacio que la página.
 * - `[data-tilt]` — con ratón, se inclina en 3D hacia el cursor con un brillo que lo sigue.
 * - `[data-reveal]` — el resto: sube y aparece.
 *
 * Con `prefers-reduced-motion` no se arma nada y la página se ve entera y quieta. Las cortinas se
 * crean aquí y no en el HTML: sin JS no hay nada que tape las fotos.
 */
export function HomeMotion() {
  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>('.home main');
    if (!root) return;

    const created: HTMLElement[] = [];
    const cleanups: (() => void)[] = [];
    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      for (const frame of root.querySelectorAll<HTMLElement>('[data-curtain]')) {
        if (frame.getClientRects().length === 0) continue;
        const curtain = document.createElement('span');
        curtain.setAttribute('aria-hidden', 'true');
        curtain.style.cssText =
          'position:absolute;inset:0;z-index:5;background:var(--h-wine);transform-origin:50% 0%;pointer-events:none;';
        frame.append(curtain);
        created.push(curtain);

        const photo = frame.querySelector('img');
        const tl = gsap
          .timeline({ scrollTrigger: { trigger: frame, start: 'top 88%', once: true } })
          .fromTo(curtain, { scaleY: 1 }, { scaleY: 0, duration: 1.25, ease: 'expo.inOut' });
        /* Una foto con su propio acercamiento al pasar el cursor (`transition-transform`) no se
           toca: la transición de CSS frenaría cada fotograma de GSAP. */
        if (photo && !photo.classList.contains('transition-transform')) {
          tl.fromTo(photo, { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0.2);
        }
      }

      for (const heading of root.querySelectorAll<HTMLElement>('.h-heading')) {
        /* Las secciones con una versión para el teléfono y otra para el escritorio dejan una oculta
           (`display: none`): partir en líneas un titular que no se ve rompe a ScrollTrigger. */
        if (heading.getClientRects().length === 0) continue;
        /* Un titular que cambia con lo que escribe la visitante (sus nombres, la cuenta de
           plantillas) no se parte: SplitText congelaría el texto del primer render. */
        if (heading.dataset.split === 'off') continue;
        SplitText.create(heading, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 110,
              duration: 1.1,
              stagger: 0.12,
              ease: 'expo.out',
              scrollTrigger: { trigger: heading, start: 'top 90%', once: true },
            }),
        });
      }

      for (const layer of root.querySelectorAll<HTMLElement>('[data-parallax]')) {
        gsap.fromTo(
          layer,
          { yPercent: -9, scale: 1.22 },
          {
            yPercent: 9,
            scale: 1.22,
            ease: 'none',
            scrollTrigger: { trigger: layer.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      }

      /*
       * La inclinación 3D: con ratón, el marco se inclina hacia el cursor y un brillo lo sigue,
       * como una lámina que se mira de lado. Solo con puntero fino; en el teléfono no hay cursor
       * que seguir.
       */
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        for (const card of root.querySelectorAll<HTMLElement>('[data-tilt]')) {
          const shine = document.createElement('span');
          shine.setAttribute('aria-hidden', 'true');
          shine.style.cssText =
            'position:absolute;inset:0;z-index:4;pointer-events:none;opacity:0;mix-blend-mode:soft-light;transition:opacity .4s;';
          if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
          card.append(shine);
          created.push(shine);

          gsap.set(card, { transformPerspective: 900 });
          const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
          const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });

          const move = (event: PointerEvent) => {
            const box = card.getBoundingClientRect();
            const nx = (event.clientX - box.left) / box.width;
            const ny = (event.clientY - box.top) / box.height;
            ry((nx - 0.5) * 12);
            rx(-(ny - 0.5) * 10);
            shine.style.opacity = '1';
            shine.style.background = `radial-gradient(circle at ${nx * 100}% ${ny * 100}%, rgba(255,255,255,0.55), transparent 55%)`;
          };
          const leave = () => {
            rx(0);
            ry(0);
            shine.style.opacity = '0';
          };
          card.addEventListener('pointermove', move);
          card.addEventListener('pointerleave', leave);
          cleanups.push(() => {
            card.removeEventListener('pointermove', move);
            card.removeEventListener('pointerleave', leave);
          });
        }
      }

      /* Se esconden de entrada —si no, se verían y luego saltarían a ocultos al entrar— y el lote
         que entra junto en pantalla aparece escalonado. */
      const reveals = root.querySelectorAll<HTMLElement>('[data-reveal]');
      gsap.set(reveals, { autoAlpha: 0, y: 40 });
      ScrollTrigger.batch(reveals, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.12, ease: 'expo.out' }),
      });
    });

    /* Las fotos de `next/image` cargan tarde y cambian las alturas: se vuelve a medir. */
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);

    return () => {
      window.removeEventListener('load', refresh);
      mm.revert();
      for (const el of created) el.remove();
      for (const undo of cleanups) undo();
    };
  }, []);

  return null;
}
