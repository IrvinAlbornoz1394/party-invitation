'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import clsx from 'clsx';

export interface Faq {
  readonly question: string;
  readonly answer: string;
}

/**
 * Las preguntas, con una sola respuesta a la vista.
 *
 * A la izquierda, todas las preguntas a un mismo tamaño; a la derecha, la respuesta de la elegida
 * en grande y anclada mientras se recorre la lista. La respuesta es lo que se lee de lejos, no la
 * pregunta: es lo que la persona vino a buscar.
 *
 * La selección sigue al cursor, al clic y al foco del teclado. En el teléfono no hay panel: la
 * respuesta se abre debajo de su pregunta y cierra la anterior.
 */
export function FaqIndex({ items }: { readonly items: readonly Faq[] }) {
  const [selected, setSelected] = useState(0);
  const current = items[selected];

  return (
    <section id="preguntas" aria-labelledby="preguntas-titulo" className="bg-(--l-surface) px-5 py-12 sm:py-28 sm:px-8 lg:py-40">
      <div className="grid gap-y-10 lg:grid-cols-12 lg:gap-x-6">
        <div className="lg:col-span-5">
          <h2 id="preguntas-titulo" data-reveal className="l-display m-0 text-(length:--step-head)">
            Preguntas frecuentes
          </h2>

          <ul className="mt-10 grid list-none gap-1 p-0" data-reveal style={{ ['--d' as string]: '90ms' }}>
            {items.map((item, index) => {
              const active = index === selected;
              return (
                <li key={item.question}>
                  <button
                    type="button"
                    aria-expanded={active}
                    aria-controls={`respuesta-${index}`}
                    onClick={() => setSelected(index)}
                    onMouseEnter={() => setSelected(index)}
                    onFocus={() => setSelected(index)}
                    className={clsx(
                      'flex w-full items-baseline gap-3.5 bg-transparent py-2 text-left text-[1.125rem] leading-snug transition-colors duration-150',
                      active ? 'text-(--l-ink)' : 'text-(--l-muted) hover:text-(--l-ink)',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={clsx(
                        'inline-block size-2 shrink-0 -translate-y-0.5 rounded-full transition-colors duration-150',
                        active ? 'bg-(--l-accent)' : 'bg-(--l-muted)',
                      )}
                    />
                    {item.question}
                  </button>

                  {/* En el teléfono, la respuesta va aquí debajo. */}
                  {active && (
                    <p id={`respuesta-${index}`} className="mt-1 mb-4 pl-[1.375rem] text-[19px] leading-normal text-(--l-ink) lg:hidden">
                      {item.answer}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="hidden lg:col-span-6 lg:col-start-7 lg:block">
          <div className="sticky top-[120px] min-h-[12rem] pt-[calc(var(--step-head)*1.05+2.5rem)]" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              {current && (
                <motion.p
                  key={selected}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="m-0 max-w-[30ch] text-(length:--step-lead) leading-[1.3] text-(--l-ink)"
                >
                  {current.answer}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
