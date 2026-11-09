'use client';

import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { useState, type CSSProperties, type ReactNode } from 'react';
import type { ShowcaseTemplate } from './types';
import './template-wall.css';

const COLUMNS = 5;
const ROWS = 5;

/**
 * El muro de plantillas de tableta y escritorio: las portadas en un plano inclinado en 3D, en
 * columnas que suben y bajan despacio, con el texto y la lista de nombres al lado.
 *
 * Adaptado del «3D Marquee» de 21st.dev (manuarora700): el plano girado en X y en Z con columnas
 * que van y vienen. Aquí la deriva es CSS y no JS (se detiene con el ratón encima para poder
 * atinarle a una portada), las columnas se rellenan repitiendo el catálogo filtrado, y la lista de
 * nombres y el muro se señalan entre sí: pasar por un nombre levanta su portada y apaga las demás.
 *
 * Una plantilla sale varias veces en el muro para llenarlo; solo la primera es un enlace que se
 * alcanza con el tabulador y que leen los lectores de pantalla. Las copias son decorado.
 */
export function TemplateWall({ templates, header }: { readonly templates: readonly ShowcaseTemplate[]; readonly header: ReactNode }) {
  const [active, setActive] = useState<string | null>(null);

  const seen = new Set<string>();
  const columns = Array.from({ length: COLUMNS }, (_, col) =>
    Array.from({ length: ROWS }, (_, row) => {
      /* Cada columna empieza corrida dos lugares: así la misma portada no queda en fila. */
      const template = templates[(col * ROWS + row + col * 2) % Math.max(templates.length, 1)];
      if (!template) return null;
      const first = !seen.has(template.href);
      seen.add(template.href);
      return { template, first, slot: `${col}-${row}` };
    }).filter((cell) => cell !== null),
  );

  return (
    <div className="relative h-[46rem] overflow-hidden lg:h-[52rem]">
      {/* El muro. */}
      <div
        className="h-wall absolute inset-y-0 right-[-14%] left-[22%] [perspective:2200px] lg:left-[30%]"
        onMouseLeave={() => setActive(null)}
      >
        <div
          className="absolute top-1/2 left-1/2 grid w-[1500px] grid-cols-5 gap-7 [transform-style:preserve-3d]"
          style={{ transform: 'translate(-50%, -50%) rotateX(50deg) rotateZ(-34deg)' }}
        >
          {columns.map((cells, col) => (
            <div
              key={`columna-${col}`}
              className="h-wall-col flex flex-col gap-7"
              style={
                {
                  '--wall-from': col % 2 === 0 ? '-60px' : '60px',
                  '--wall-to': col % 2 === 0 ? '60px' : '-60px',
                  '--wall-duration': `${18 + col * 3}s`,
                } as CSSProperties
              }
            >
              {cells.map(({ template, first, slot }) => {
                const lit = active === template.href;
                return (
                  <Link
                    key={slot}
                    href={template.href}
                    tabIndex={first ? 0 : -1}
                    aria-hidden={first ? undefined : true}
                    aria-label={first ? `${template.name}: abrir la demo` : undefined}
                    onMouseEnter={() => setActive(template.href)}
                    onFocus={() => setActive(template.href)}
                    onBlur={() => setActive(null)}
                    className={clsx(
                      'group relative block aspect-[9/16] overflow-hidden rounded-[10px] bg-(--h-paper-2) transition-[transform,opacity,box-shadow] duration-500 ease-(--h-ease)',
                      lit
                        ? '-translate-y-4 shadow-[0_40px_60px_-24px_rgba(74,26,44,0.55)] ring-2 ring-(--h-gold)'
                        : 'shadow-[0_18px_36px_-24px_rgba(74,26,44,0.45)]',
                      active && !lit && 'opacity-45',
                    )}
                  >
                    <Image src={template.image.url} alt="" fill sizes="300px" className="object-cover object-top" />
                    <span
                      className={clsx(
                        'absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2b1a20]/85 to-transparent px-4 pt-10 pb-3 text-white transition-opacity duration-300',
                        lit ? 'opacity-100' : 'opacity-0',
                      )}
                    >
                      <span className="h-display block text-[1.5rem] leading-none">{template.name}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* El papel que funde el muro con el texto. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[62%] bg-gradient-to-r from-(--h-paper) from-45% via-(--h-paper)/85 to-transparent lg:w-[55%]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-(--h-paper) to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-(--h-paper) to-transparent" />

      {/* El texto y la lista de nombres. */}
      <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-7xl items-center px-8 lg:px-12">
        <div data-reveal className="pointer-events-auto max-w-[24rem]">
          {header}
          <ul className="mt-9 mb-0 hidden list-none grid-cols-2 gap-x-6 gap-y-1 p-0 lg:grid">
            {templates.map((template) => (
              <li key={template.href}>
                <Link
                  href={template.href}
                  onMouseEnter={() => setActive(template.href)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(template.href)}
                  onBlur={() => setActive(null)}
                  className={clsx(
                    'group inline-flex items-center gap-2 py-1 text-[15px] transition-colors duration-300',
                    active === template.href ? 'text-(--h-wine)' : 'text-(--h-muted) hover:text-(--h-wine)',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={clsx(
                      'size-1.5 rotate-45 bg-(--h-rose) transition-transform duration-300',
                      active === template.href ? 'scale-150' : 'scale-0',
                    )}
                  />
                  {template.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
