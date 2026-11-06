'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

export interface RowTemplate {
  readonly key: string;
  readonly name: string;
  readonly tagline: string;
  readonly eventTypes: readonly string[];
  readonly href: string;
  readonly image: { readonly url: string; readonly alt: string };
}

/**
 * El escaparate: una fila con una sola plantilla a plena luz.
 *
 * Cada plantilla es su primera pantalla —la fotografía de portada con los nombres y la fecha
 * compuestos encima, como la ve el invitado al abrirla— y solo la del centro está a plena luz. Las
 * demás esperan veladas a los lados y el borde de la ventana las corta: se lee como una sala
 * con una pieza iluminada, que es justo el papel de esta página respecto del producto.
 *
 * A la derecha de la encendida, su nombre, para qué celebraciones existe y qué la distingue. El
 * texto cambia al llegar cada una.
 *
 * ## Cómo se mueve
 *
 * Es un `overflow-x` con `scroll-snap`, así que en el teléfono y en el trackpad se desliza de forma
 * nativa. Para el ratón hay dos flechas, y las teclas izquierda y derecha también funcionan con la
 * fila enfocada. Pulsar una plantilla velada la trae al centro; pulsar la encendida abre su
 * demo.
 *
 * ## Lo que no se apaga
 *
 * El velo solo afecta a las fotografías. Todo lo que se lee —el nombre, la descripción— va en
 * tinta completa: la que está activa se distingue por estar a su lado, no porque el resto del
 * texto se vuelva ilegible.
 */
export function TemplateRow({ templates }: { readonly templates: readonly RowTemplate[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  /* La encendida es la más cercana al centro de la fila. Se mide en cada `scroll` dentro de un
     `requestAnimationFrame`, que es lo que cuesta una lectura de geometría por fotograma. */
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const center = row.scrollLeft + row.clientWidth / 2;
      let best = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      Array.from(row.children).forEach((child, index) => {
        const el = child as HTMLElement;
        const distance = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      });
      setActive(best);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    row.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      row.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const goTo = useCallback((index: number) => {
    const row = rowRef.current;
    const target = row?.children[index] as HTMLElement | undefined;
    if (!row || !target) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    row.scrollTo({
      left: target.offsetLeft + target.offsetWidth / 2 - row.clientWidth / 2,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  const current = templates[active];
  if (!current) return null;

  return (
    <section
      id="plantillas"
      aria-labelledby="plantillas-titulo"
      className="relative bg-(--l-surface) py-12 sm:py-20 lg:flex lg:min-h-[96svh] lg:flex-col lg:justify-center lg:py-24"
    >
      <div className="grid gap-5 px-5 sm:px-8 lg:grid-cols-12 lg:gap-x-6">
        <h2
          id="plantillas-titulo"
          data-reveal
          className="l-display m-0 text-(length:--step-head) lg:col-span-7"
        >
          {templates.length} plantillas, y todas se abren
        </h2>
        <p
          data-reveal
          className="m-0 max-w-[44ch] self-end text-(--l-ink) lg:col-span-4 lg:col-start-9"
          style={{ ['--d' as string]: '90ms' }}
        >
          Cada una es una invitación completa que puedes recorrer y cambiar en vivo: el tipo de
          celebración, los colores y el diseño de cada sección.
        </p>
      </div>

      <div className="relative mt-12 lg:mt-16">
        <div
          ref={rowRef}
          role="group"
          aria-roledescription="carrusel"
          aria-label="Plantillas"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              goTo(Math.min(active + 1, templates.length - 1));
            }
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              goTo(Math.max(active - 1, 0));
            }
          }}
          className="l-snap-row flex gap-[3vw] overflow-x-auto px-[10vw] focus-visible:outline-offset-[-2px] lg:gap-[clamp(2rem,26vw,26rem)] lg:px-[calc(50vw-11.5rem)]"
        >
          {templates.map((template, index) => {
            const lit = index === active;
            return (
              <Link
                key={template.key}
                href={template.href}
                tabIndex={lit ? 0 : -1}
                aria-label={`Abrir la demo de ${template.name}`}
                onClick={(event) => {
                  if (lit) return;
                  event.preventDefault();
                  goTo(index);
                }}
                className="group relative block aspect-[3/4] w-[80vw] shrink-0 snap-center overflow-hidden rounded-[4px] bg-(--l-surface-2) sm:w-[23rem]"
              >
                <Image
                  src={template.image.url}
                  alt={template.image.alt}
                  fill
                  sizes="(min-width: 640px) 368px, 80vw"
                  className={clsx(
                    'object-cover transition-[opacity,transform] duration-700 ease-(--l-ease) group-hover:scale-[1.03]',
                    lit ? 'opacity-100' : 'opacity-[0.35] grayscale-[40%]',
                  )}
                />
                {/* La primera pantalla de la invitación: nombres y fecha sobre la foto, en la
                    tipografía de las invitaciones y no en la de esta página. */}
                <span
                  data-ui
                  className={clsx(
                    'absolute inset-0 flex flex-col items-center justify-end bg-[linear-gradient(to_top,rgb(0_0_0/0.55),transparent_55%)] px-6 pb-10 text-center text-white transition-opacity duration-700',
                    lit ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  <span className="font-(family-name:--font-display) text-[2.4rem] leading-none font-light">
                    {template.eventTypes.includes('Boda') ? 'Ana & Diego' : 'Renata'}
                  </span>
                  <span className="mt-3 text-[13px] tracking-[0.08em]">
                    {template.eventTypes.includes('Boda') ? '12 · 06 · 2027' : '06 · 11 · 2027'}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        {/*
          El texto de la encendida. En escritorio va en el hueco a la derecha de la pieza central,
          alineado con su borde superior; en el teléfono, debajo de la fila.
        */}
        <div
          className="mt-8 px-5 sm:px-8 lg:pointer-events-none lg:absolute lg:top-0 lg:left-[calc(50%+11.5rem+2.5rem)] lg:mt-0 lg:w-[24ch] lg:px-0"
          aria-live="polite"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="lg:pointer-events-auto"
            >
              <h3 className="l-display m-0 text-(length:--step-lead)">{current.name}</h3>
              <p className="mt-1 mb-0 text-(--l-muted)">{current.eventTypes.join(' y ')}</p>
              <p className="mt-4 mb-0 text-(--l-ink)">{current.tagline}</p>
              <Link href={current.href} className="l-link mt-5 text-(--l-ink)">
                Abrir la demo
                <ArrowRight aria-hidden="true" size={16} strokeWidth={1.75} />
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-10 flex items-center gap-3 px-5 sm:px-8 lg:mt-12 lg:justify-center">
        <button
          type="button"
          onClick={() => goTo(Math.max(active - 1, 0))}
          disabled={active === 0}
          aria-label="Plantilla anterior"
          className="grid size-12 place-items-center rounded-[4px] bg-(--l-surface-2) text-(--l-ink) transition-[background-color,transform] hover:bg-(--l-field) active:scale-95 disabled:opacity-40"
        >
          <ArrowLeft aria-hidden="true" size={18} strokeWidth={1.75} />
        </button>
        <span className="min-w-[4.5rem] text-center text-(length:--step-small) text-(--l-muted) tabular-nums">
          {active + 1} de {templates.length}
        </span>
        <button
          type="button"
          onClick={() => goTo(Math.min(active + 1, templates.length - 1))}
          disabled={active === templates.length - 1}
          aria-label="Plantilla siguiente"
          className="grid size-12 place-items-center rounded-[4px] bg-(--l-surface-2) text-(--l-ink) transition-[background-color,transform] hover:bg-(--l-field) active:scale-95 disabled:opacity-40"
        >
          <ArrowRight aria-hidden="true" size={18} strokeWidth={1.75} />
        </button>
      </div>
    </section>
  );
}
