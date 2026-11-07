'use client';

import { useId, useState } from 'react';
import clsx from 'clsx';

export interface Faq {
  readonly question: string;
  readonly answer: string;
}

/**
 * Las preguntas, en acordeón centrado. La primera va abierta: quien llega hasta aquí viene a
 * leer una respuesta, no a abrir la primera. Una sola abierta a la vez, y se puede cerrar.
 *
 * El alto se anima con `grid-template-rows` de `0fr` a `1fr`, que no necesita medir el texto y
 * respeta el movimiento reducido con solo quitar la transición.
 */
export function HomeFaq({ items }: { readonly items: readonly Faq[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section id="preguntas" aria-labelledby="preguntas-titulo" className="bg-(--h-white) px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-[44rem]">
        <header data-reveal className="text-center">
          <span className="h-eyebrow">Preguntas</span>
          <h2 id="preguntas-titulo" className="h-heading mt-5 mb-0 text-(--h-ink)">
            Preguntas frecuentes
          </h2>
        </header>

        <ul data-reveal className="mt-12 grid list-none gap-0 p-0" style={{ ['--reveal-delay' as string]: '0.1s' }}>
          {items.map((item, index) => {
            const isOpen = open === index;
            const buttonId = `${baseId}-q${index}`;
            const panelId = `${baseId}-a${index}`;
            return (
              <li
                key={item.question}
                className={clsx(
                  'rounded-[6px] transition-colors duration-300 ease-(--h-ease)',
                  isOpen ? 'bg-(--h-paper-2)' : 'border-b border-(--h-line)',
                )}
              >
                <h3 className="m-0 text-[length:inherit] font-normal">
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : index)}
                    className="flex w-full items-center gap-4 bg-transparent px-4 py-5 text-left sm:px-6"
                  >
                    <span className="flex-1 text-[16px] leading-snug text-(--h-ink) sm:text-[17px]">
                      <span className="mr-2 text-(--h-gold-deep) tabular-nums">{index + 1}.</span>
                      {item.question}
                    </span>
                    <span
                      aria-hidden="true"
                      className={clsx(
                        'relative grid size-8 shrink-0 place-items-center rounded-full transition-colors duration-300',
                        isOpen ? 'bg-(--h-wine) text-(--h-wine-ink)' : 'text-(--h-wine) ring-1 ring-(--h-line)',
                      )}
                    >
                      <span className="absolute h-px w-3 bg-current" />
                      <span
                        className={clsx(
                          'absolute h-3 w-px bg-current transition-transform duration-300 ease-(--h-ease)',
                          isOpen && 'scale-y-0',
                        )}
                      />
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={clsx(
                    'grid transition-[grid-template-rows] duration-400 ease-(--h-ease) motion-reduce:transition-none',
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  )}
                >
                  <div className="overflow-hidden" inert={!isOpen}>
                    <p className="m-0 px-4 pb-6 pl-[2.6rem] text-[15px] leading-relaxed text-(--h-muted) sm:px-6 sm:pl-[3.1rem] sm:text-[16px]">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
