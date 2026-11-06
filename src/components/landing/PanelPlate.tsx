'use client';

import { ImagePlus, Link2, Send, UserPlus } from 'lucide-react';
import Image from 'next/image';
import { useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';

type Part = 'resumen' | 'confirmaciones' | 'invitados' | 'enlace' | 'contenido' | 'accesos';

interface Note {
  readonly part: Part;
  readonly side: 'left' | 'right';
  readonly name: string;
  readonly detail: string;
}

/**
 * Las seis notas, cada una nivelada con la parte del panel que explica.
 *
 * Solo se anotan pantallas que existen hoy: resumen, confirmaciones, invitados, el enlace de cada
 * familia, el editor de contenido y los accesos. Mesas y recordatorios están en el catálogo de
 * planes pero su pantalla todavía no se enseña en el panel (`pending` en `event-navigation.ts`), y
 * dibujarlas aquí como si funcionaran sería vender lo que no hay.
 */
const NOTES: readonly Note[] = [
  {
    part: 'resumen',
    side: 'left',
    name: 'Lo importante, primero',
    detail: 'Cuántos días faltan y cuántas familias ya respondieron, al entrar.',
  },
  {
    part: 'invitados',
    side: 'left',
    name: 'Una invitación por familia',
    detail: 'Con su teléfono y sus lugares apartados. Confirman de uno al máximo.',
  },
  {
    part: 'contenido',
    side: 'left',
    name: 'Tus textos y tus fotos',
    detail: 'Los cambias desde el editor y los mandas a revisión antes de publicar.',
  },
  {
    part: 'confirmaciones',
    side: 'right',
    name: 'La cuenta se hace sola',
    detail: 'Quién viene, cuántas personas y quién falta por responder.',
  },
  {
    part: 'enlace',
    side: 'right',
    name: 'Su propio enlace',
    detail: 'Cada familia abre la invitación con su código. Se lo mandas por WhatsApp.',
  },
  {
    part: 'accesos',
    side: 'right',
    name: 'Para quien organiza contigo',
    detail: 'Da acceso a tu pareja, a tu mamá o a quien te ayuda con el evento.',
  },
];

export function PanelPlate({
  photos,
}: {
  readonly photos: readonly { readonly url: string; readonly alt: string }[];
}) {
  const [focus, setFocus] = useState<Part | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [offsets, setOffsets] = useState<Partial<Record<Part, number>>>({});

  /* Las notas se nivelan midiendo el panel, no con números escritos a mano: si una parte crece,
     su nota baja con ella. */
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const measure = () => {
      const next: Partial<Record<Part, number>> = {};
      panel.querySelectorAll<HTMLElement>('[data-part]').forEach((el) => {
        next[el.dataset.part as Part] = el.offsetTop;
      });
      setOffsets(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  const dim = (part: Part) =>
    clsx('transition-opacity duration-300', focus && focus !== part && 'opacity-30');

  const noteProps = (note: Note) => ({
    onMouseEnter: () => setFocus(note.part),
    onMouseLeave: () => setFocus(null),
    onFocus: () => setFocus(note.part),
    onBlur: () => setFocus(null),
  });

  return (
    <section id="panel" aria-labelledby="panel-titulo" className="bg-(--l-surface) px-5 py-12 sm:py-28 sm:px-8 lg:py-40">
      <div className="grid gap-5 lg:grid-cols-12 lg:gap-x-6">
        <h2 id="panel-titulo" data-reveal className="l-display m-0 text-(length:--step-head) lg:col-span-6">
          Tu panel, por dentro
        </h2>
        <p
          data-reveal
          className="m-0 max-w-[44ch] self-end lg:col-span-4 lg:col-start-9"
          style={{ ['--d' as string]: '90ms' }}
        >
          Lo que antes llevabas en una libreta y en doscientos mensajes de WhatsApp, junto en una
          sola pantalla.
        </p>
      </div>

      <div data-reveal className="relative mt-16 lg:mt-20 lg:grid lg:grid-cols-12 lg:gap-x-6" style={{ ['--d' as string]: '160ms' }}>
        {/* Notas de la izquierda (escritorio) */}
        <ul className="relative m-0 hidden list-none p-0 lg:col-span-4 lg:block">
          {NOTES.filter((note) => note.side === 'left').map((note) => (
            <li key={note.part} className="absolute right-0 w-[24ch] text-right" style={{ top: (offsets[note.part] ?? 0) + 14 }}>
              <NoteBody note={note} active={focus === note.part} {...noteProps(note)} />
            </li>
          ))}
        </ul>

        {/* El panel */}
        <div
          ref={panelRef}
          data-ui
          className="relative mx-auto w-full max-w-[24rem] overflow-hidden rounded-[14px] bg-(--ui-canvas) text-(--ui-ink) lg:col-span-4 lg:col-start-5"
        >
          <div data-part="resumen" className={clsx('bg-(--ui-sider) px-5 pt-5 pb-4 text-(--ui-sider-ink)', dim('resumen'))}>
            <p className="m-0 text-[13px] text-(--ui-mark)">Resumen</p>
            <p className="mt-1 mb-0 text-[17px] font-medium text-white">Boda de Ana &amp; Diego</p>
            <p className="mt-0.5 mb-0 text-[13px]">Faltan 220 días · 38 de 52 familias respondieron</p>
          </div>

          <div data-part="confirmaciones" className={clsx('grid grid-cols-2 gap-2 p-4', dim('confirmaciones'))}>
            {[
              ['Personas confirmadas', '104'],
              ['Familias que vienen', '31'],
              ['Sin responder', '14'],
              ['No asistirán', '7'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[10px] bg-(--ui-surface) px-3.5 py-3">
                <p className="m-0 text-[13px] text-(--ui-ink-soft)">{label}</p>
                <p className="mt-1 mb-0 text-[22px] leading-none font-medium tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          <div data-part="invitados" className={clsx('px-4 pb-2', dim('invitados'))}>
            <div className="flex items-center justify-between px-1 pb-2">
              <p className="m-0 text-[14px] font-medium">Invitados</p>
              <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-(--ui-accent) px-2.5 py-1.5 text-[13px] text-white">
                <UserPlus aria-hidden="true" size={14} /> Agregar invitación
              </span>
            </div>
            {[
              ['Familia Pech Canul', '5 lugares', 'Confirmaron', 'ok'],
              ['Tíos de Diego', '2 lugares', 'Confirmaron', 'ok'],
              ['Familia Robles Cámara', '4 lugares', 'Sin responder', 'idle'],
            ].map(([name, seats, status, tone]) => (
              <div key={name} className="mb-1.5 flex items-center justify-between gap-2 rounded-[10px] bg-(--ui-surface) px-3.5 py-2.5 text-[14px]">
                <span className="min-w-0">
                  <span className="block truncate">{name}</span>
                  <span className="block text-[13px] text-(--ui-ink-soft)">{seats}</span>
                </span>
                <span
                  className={clsx(
                    'shrink-0 rounded-full px-2.5 py-0.5 text-[13px]',
                    tone === 'ok' ? 'bg-(--ui-ok-wash) text-(--ui-ok)' : 'bg-(--ui-canvas) text-(--ui-ink-soft)',
                  )}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>

          <div data-part="enlace" className={clsx('flex items-center gap-2 px-4 pb-4', dim('enlace'))}>
            <span className="inline-flex min-w-0 flex-1 items-center gap-1.5 rounded-[8px] border border-(--ui-border) bg-(--ui-surface) px-2.5 py-2 text-[13px] text-(--ui-ink-soft)">
              <Link2 aria-hidden="true" size={14} className="shrink-0" />
              <span className="truncate">…/ana-y-diego/k7m2qx9d</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[8px] bg-[#1f8a4c] px-2.5 py-2 text-[13px] text-white">
              <Send aria-hidden="true" size={14} /> WhatsApp
            </span>
          </div>

          <div data-part="contenido" className={clsx('border-t border-(--ui-border) bg-(--ui-surface) p-4', dim('contenido'))}>
            <p className="m-0 text-[14px] font-medium">Contenido · Galería</p>
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {photos.slice(0, 3).map((photo) => (
                <div key={photo.url} className="relative aspect-square overflow-hidden rounded-[8px] bg-(--ui-canvas)">
                  <Image src={photo.url} alt={photo.alt} fill sizes="80px" className="object-cover" />
                </div>
              ))}
              <div className="grid aspect-square place-items-center rounded-[8px] border border-dashed border-(--ui-border) text-(--ui-ink-soft)">
                <ImagePlus aria-hidden="true" size={18} />
              </div>
            </div>
            <span className="mt-3 inline-flex rounded-[8px] bg-(--ui-accent-wash) px-2.5 py-1.5 text-[13px] text-(--ui-accent)">
              Mandar a revisión
            </span>
          </div>

          <div data-part="accesos" className={clsx('flex items-center justify-between gap-3 border-t border-(--ui-border) bg-(--ui-surface) px-4 py-3.5', dim('accesos'))}>
            <div className="flex items-center">
              {['A', 'D', 'L'].map((initial, index) => (
                <span
                  key={initial}
                  className="-ml-1.5 grid size-8 place-items-center rounded-full border-2 border-white bg-(--ui-accent-wash) text-[13px] font-medium text-(--ui-accent) first:ml-0"
                  style={{ zIndex: 3 - index }}
                >
                  {initial}
                </span>
              ))}
              <span className="ml-2.5 text-[13px] text-(--ui-ink-soft)">Ana, Diego y Lupita</span>
            </div>
            <span className="text-[13px] font-medium text-(--ui-accent)">Accesos</span>
          </div>
        </div>

        {/* Notas de la derecha (escritorio) */}
        <ul className="relative m-0 hidden list-none p-0 lg:col-span-4 lg:col-start-9 lg:block">
          {NOTES.filter((note) => note.side === 'right').map((note) => (
            <li key={note.part} className="absolute left-0 w-[24ch]" style={{ top: (offsets[note.part] ?? 0) + 14 }}>
              <NoteBody note={note} active={focus === note.part} {...noteProps(note)} />
            </li>
          ))}
        </ul>

        {/* En el teléfono y la tableta, las seis notas debajo, en dos columnas. */}
        <ul className="m-0 mt-10 grid list-none grid-cols-1 gap-x-6 gap-y-7 p-0 sm:grid-cols-2 lg:hidden">
          {NOTES.map((note) => (
            <li key={note.part}>
              <NoteBody note={note} active={focus === note.part} {...noteProps(note)} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function NoteBody({
  note,
  active,
  ...handlers
}: {
  readonly note: Note;
  readonly active: boolean;
  readonly onMouseEnter: () => void;
  readonly onMouseLeave: () => void;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
}) {
  return (
    /* Un botón y no un párrafo: así se enfoca con el teclado y la nota ilumina su parte también
       sin ratón. No hace nada al pulsarlo más que eso. */
    <button
      type="button"
      {...handlers}
      onClick={handlers.onFocus}
      className="w-full cursor-default bg-transparent p-0 text-inherit [text-align:inherit]"
    >
      <span className="block text-[1.125rem] font-medium text-(--l-ink)">
        {/* La nota activa se marca con un punto carmesí, no cambiando el color del texto: el
            carmesí sobre negro no llega al contraste de lectura. */}
        <span
          aria-hidden="true"
          className={clsx(
            'inline-block h-2 rounded-full bg-(--l-accent) align-middle transition-[width,margin,opacity] duration-300',
            active ? 'mr-2 w-2 opacity-100' : 'mr-0 w-0 opacity-0',
          )}
        />
        {note.name}
      </span>
      <span className="mt-1 block text-[15px] leading-normal text-(--l-muted)">{note.detail}</span>
    </button>
  );
}
