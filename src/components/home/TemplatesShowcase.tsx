'use client';

import clsx from 'clsx';
import { useMemo } from 'react';
import { useCouple, type CelebrationKind } from './couple';
import { TemplateSwipe } from './TemplateSwipe';
import { TemplateWall } from './TemplateWall';
import type { ShowcaseTemplate } from './types';
import { DESKTOP_QUERY, useMedia } from './useMedia';

const EVENT_TYPE: Record<CelebrationKind, string> = { boda: 'Boda', xv: 'XV Años' };

const KINDS: readonly { readonly kind: CelebrationKind; readonly label: string }[] = [
  { kind: 'boda', label: 'Bodas' },
  { kind: 'xv', label: 'XV años' },
];

/**
 * Las plantillas. Aquí sí hay un componente distinto por pantalla, porque el gesto es otro:
 *
 * - En el teléfono, un mazo para deslizar con el pulgar (`TemplateSwipe`): a la derecha las que le
 *   encantan, a la izquierda la siguiente. Al terminar le quedan sus favoritas con su demo.
 * - En tableta y escritorio, un muro 3D de portadas a la deriva (`TemplateWall`) con la lista de
 *   nombres al lado: pasar por un nombre levanta su portada.
 *
 * Las dos leen la celebración de `useCouple()`: si en la portada eligió XV años, aquí ya llega
 * filtrado a XV, y los botones de aquí cambian también la portada.
 *
 * El muro solo se monta en pantallas anchas (`useMedia`), porque son decenas de imágenes que en
 * el teléfono no se verían. El mazo se pinta siempre y se oculta con `md:hidden`, para que el HTML
 * del servidor ya traiga lo que ve el teléfono.
 */
export function TemplatesShowcase({ templates }: { readonly templates: readonly ShowcaseTemplate[] }) {
  const { kind, setKind } = useCouple();
  const desktop = useMedia(DESKTOP_QUERY);

  const filtered = useMemo(
    () => templates.filter((template) => template.eventTypes.includes(EVENT_TYPE[kind])),
    [templates, kind],
  );

  const chips = (
    <div role="group" aria-label="Tipo de celebración" className="inline-flex rounded-full bg-(--h-white) p-1 shadow-[0_0_0_1px_var(--h-line)]">
      {KINDS.map((option) => (
        <button
          key={option.kind}
          type="button"
          aria-pressed={kind === option.kind}
          onClick={() => setKind(option.kind)}
          className={clsx(
            'min-h-10 rounded-full px-5 text-[12px] tracking-[0.18em] uppercase transition-colors duration-300 ease-(--h-ease)',
            kind === option.kind ? 'bg-(--h-wine) text-(--h-wine-ink)' : 'text-(--h-muted) hover:text-(--h-wine)',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  return (
    <section id="plantillas" aria-labelledby="plantillas-titulo" className="relative overflow-hidden py-20 md:py-0">
      {/* Teléfono: encabezado, mazo y favoritas. */}
      <div className="px-5 md:hidden">
        <header data-reveal className="text-center">
          <span className="h-eyebrow">Plantillas</span>
          <h2 id="plantillas-titulo" data-split="off" className="h-heading mt-5 mb-0">
            Desliza y encuentra la tuya
          </h2>
          <p className="mx-auto mt-4 mb-0 max-w-sm text-[15px] text-(--h-muted)">
            A la derecha las que te encantan, a la izquierda la siguiente. Cada una se abre completa.
          </p>
          <div className="mt-6">{chips}</div>
        </header>
        <TemplateSwipe key={kind} templates={filtered} />
      </div>

      {/* Tableta y escritorio: el muro 3D con la lista al lado. */}
      <div className="hidden md:block md:min-h-[46rem]">
        {desktop && (
          <TemplateWall
            templates={filtered}
            header={
              <>
                <span className="h-eyebrow">Plantillas</span>
                <h2 data-split="off" className="h-heading mt-5 mb-0">
                  {filtered.length} diseños,
                  <br />
                  uno es el tuyo
                </h2>
                <p className="mt-5 mb-0 max-w-sm text-(--h-muted)">
                  Pasa por un nombre para encontrarla en el muro. Cada una se abre completa, con su
                  música y sus secciones.
                </p>
                <div className="mt-7">{chips}</div>
              </>
            }
          />
        )}
      </div>
    </section>
  );
}
