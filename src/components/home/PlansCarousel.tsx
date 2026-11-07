'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';

/**
 * Los planes en el teléfono: una fila que se desliza de lado con el pulgar, una tarjeta a la vez y
 * la siguiente asomando por el borde para que se note que hay más.
 *
 * Es `scroll-snap` nativo, no un carrusel con JS: el gesto, la inercia y el rebote son los del
 * sistema. El JS solo sabe qué tarjeta está al centro para pintar los puntos y el contador, y para
 * que los puntos lleven a cada una. Solo existe por debajo de `md`; arriba está la fila de tres.
 */
export function PlansCarousel({ labels, children }: { readonly labels: readonly string[]; readonly children: ReactNode }) {
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const list = track.current;
    if (!list) return;
    const cards = Array.from(list.children) as HTMLElement[];
    /* La tarjeta que ocupa más de la mitad de la fila es la activa. */
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(cards.indexOf(entry.target as HTMLElement));
        }
      },
      { root: list, threshold: 0.6 },
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [labels.length]);

  const goTo = (index: number) => {
    const list = track.current;
    const card = list?.children[index] as HTMLElement | undefined;
    if (!list || !card) return;
    /* `scrollTo` en la fila y no `scrollIntoView`, que también movería la página. */
    list.scrollTo({
      left: card.offsetLeft - (list.clientWidth - card.offsetWidth) / 2,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };

  return (
    <div className="mt-10 md:hidden">
      <ul
        ref={track}
        aria-label="Planes"
        className="relative flex snap-x snap-mandatory list-none gap-4 overflow-x-auto overscroll-x-contain px-[9vw] pt-2 pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>li]:w-[82vw] [&>li]:max-w-[340px] [&>li]:shrink-0 [&>li]:snap-center"
      >
        {children}
      </ul>

      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-1">
          {labels.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Ver el plan ${label}`}
              aria-current={index === active ? 'true' : undefined}
              /* El blanco del toque mide 32 px aunque el punto se vea de 8. */
              className="grid size-8 place-items-center"
            >
              <span
                className={clsx(
                  'block h-2 rounded-full transition-[width,background-color] duration-300 ease-(--h-ease)',
                  index === active ? 'w-6 bg-(--h-wine)' : 'w-2 bg-(--h-wine)/25',
                )}
              />
            </button>
          ))}
        </div>
        <p aria-live="polite" className="m-0 min-w-[7rem] text-[12px] tracking-[0.18em] text-(--h-muted) uppercase tabular-nums">
          {String(active + 1).padStart(2, '0')} / {String(labels.length).padStart(2, '0')} · {labels[active]}
        </p>
      </div>
    </div>
  );
}
