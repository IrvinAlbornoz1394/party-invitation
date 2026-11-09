'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

/* Con la ruta delante (`/#…`) para que sirvan también desde `/cotizar`; en la portada el
   navegador lo trata como un salto dentro de la misma página. */
const LINKS_LEFT = [
  ['/#plantillas', 'Plantillas'],
  ['/#como-funciona', 'Así funciona'],
  ['/#planes', 'Planes'],
] as const;

/**
 * La cabecera fija. Sobre la portada es transparente, con el logotipo en blanco; en cuanto la
 * portada se va, se vuelve papel con el logotipo a color. Así el logo nunca queda vino sobre
 * una foto oscura ni blanco sobre el papel.
 *
 * En las páginas sin portada de foto (`/cotizar`) va `alwaysSolid`: papel desde el principio.
 */
export function HomeHeader({ alwaysSolid = false }: { readonly alwaysSolid?: boolean } = {}) {
  const [scrolled, setScrolled] = useState(false);
  const solid = alwaysSolid || scrolled;

  useEffect(() => {
    if (alwaysSolid) return;
    const update = () => setScrolled(window.scrollY > window.innerHeight * 0.75);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [alwaysSolid]);

  return (
    <header
      className={clsx(
        'fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,color] duration-500 ease-(--h-ease)',
        solid
          ? 'bg-(--h-paper)/95 text-(--h-ink) shadow-[0_1px_0_var(--h-line)] backdrop-blur-sm'
          : 'bg-transparent text-white',
      )}
    >
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:h-20 sm:px-8">
        <nav aria-label="Principal" className="hidden items-center gap-7 text-[12px] tracking-[0.18em] uppercase md:flex">
          {LINKS_LEFT.map(([href, label]) => (
            <a key={href} href={href} className="whitespace-nowrap underline-offset-[6px] hover:underline">
              {label}
            </a>
          ))}
        </nav>

        <Link
          href="/"
          aria-label="MiEvento, inicio"
          className="col-start-1 justify-self-start md:col-start-2 md:justify-self-center"
        >
          <Image
            src="/brand/logo.png"
            alt=""
            width={2022}
            height={487}
            priority
            sizes="180px"
            className={clsx('h-8 w-auto transition-[filter] duration-500 sm:h-10', !solid && 'h-mark-light')}
          />
        </Link>

        <div className="col-start-3 flex items-center justify-self-end gap-5 text-[12px] tracking-[0.18em] uppercase">
          <Link href="/panel" className="hidden underline-offset-[6px] hover:underline sm:inline">
            Entrar
          </Link>
          <Link
            href="/cotizar"
            className={clsx('h-button min-h-10 px-5', solid ? 'h-button--wine' : 'h-button--ghost')}
          >
            Cotizar
          </Link>
        </div>
      </div>
    </header>
  );
}
