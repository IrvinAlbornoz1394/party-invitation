'use client';

import clsx from 'clsx';
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { ShowcaseTemplate } from './types';

type Choice = 'like' | 'skip';

/** Cuánto hay que arrastrar (px) o qué tan rápido (px/s) para que la tarjeta se vaya. */
const THRESHOLD = 96;
const FLICK = 520;
/** Tarjetas visibles en el mazo: la de arriba y dos asomando detrás. */
const PEEK = 3;

const SETTLE = { type: 'spring', stiffness: 260, damping: 30, mass: 0.8 } as const;
const RETURN = { type: 'spring', stiffness: 170, damping: 24 } as const;

/**
 * El mazo de plantillas del teléfono, como una app de citas: arrastra a la derecha si te encanta,
 * a la izquierda para ver la siguiente.
 *
 * Adaptado del «Swipe Deck» de 21st.dev (ddoemonn): la idea de la tarjeta que gira con el
 * arrastre, se va con un empujón rápido aunque no llegue al umbral y vuelve de lado al deshacer.
 * Lo demás es de aquí: las portadas a sangre, los sellos de «Me encanta» y «Siguiente» que se
 * encienden mientras arrastras, la tira de favoritas que se llena y el cierre con sus demos.
 *
 * El arrastre es solo horizontal (`touch-action: pan-y`): deslizar hacia arriba sigue bajando la
 * página. Todo se puede hacer también con los botones y con las flechas del teclado, y con
 * movimiento reducido las tarjetas cambian sin volar.
 */
export function TemplateSwipe({ templates }: { readonly templates: readonly ShowcaseTemplate[] }) {
  const reduced = useReducedMotion() === true;
  const hintId = useId();
  const [decisions, setDecisions] = useState<Choice[]>([]);
  /* Hacia dónde se fue la última tarjeta y si fue una decisión o un «deshacer»: la que sale vuela
     hacia ese lado y la que vuelve entra desde él. */
  const [flow, setFlow] = useState<{ dir: -1 | 1; kind: 'decide' | 'undo' }>({ dir: 1, kind: 'decide' });

  const index = Math.min(decisions.length, templates.length);
  const done = index >= templates.length;
  const favorites = templates.filter((_, at) => decisions[at] === 'like');
  const stack = templates.slice(index, index + PEEK);
  const current = templates[index];

  const decide = useCallback(
    (choice: Choice) => {
      setDecisions((prev) => (prev.length >= templates.length ? prev : [...prev, choice]));
      setFlow({ dir: choice === 'like' ? 1 : -1, kind: 'decide' });
      /* Un toque corto en los Android que lo permiten: se siente como un «me gusta». */
      if (choice === 'like') navigator.vibrate?.(12);
    },
    [templates.length],
  );

  const undo = useCallback(() => {
    const last = decisions[decisions.length - 1];
    if (!last) return;
    setFlow({ dir: last === 'like' ? 1 : -1, kind: 'undo' });
    setDecisions((prev) => prev.slice(0, -1));
  }, [decisions]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || done) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      decide('like');
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      decide('skip');
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      undo();
    }
  };

  return (
    <div className="mx-auto mt-8 w-full max-w-[22rem]">
      {/* El mazo. */}
      <div
        role="group"
        aria-roledescription="mazo de plantillas"
        aria-label="Plantillas para elegir"
        aria-describedby={hintId}
        tabIndex={done ? -1 : 0}
        onKeyDown={onKeyDown}
        className="relative aspect-[3/4] w-full rounded-[18px] outline-none"
      >
        {done ? (
          <DeckEnd favorites={favorites} onRestart={() => setDecisions([])} />
        ) : (
          <AnimatePresence initial={false} custom={flow.dir}>
            {stack
              .map((template, depth) => (
                <DeckCard
                  key={template.href}
                  template={template}
                  depth={depth}
                  position={index + depth + 1}
                  total={templates.length}
                  entryX={depth === 0 && flow.kind === 'undo' ? flow.dir * 480 : 0}
                  reduced={reduced}
                  onDecide={decide}
                />
              ))
              /* La de arriba se pinta al final para quedar encima. */
              .reverse()}
          </AnimatePresence>
        )}
      </div>

      {/* Los botones: lo mismo que el gesto, para quien no quiera arrastrar. */}
      <div className={clsx('mt-6 flex items-end justify-center gap-6 transition-opacity duration-300', done && 'pointer-events-none opacity-0')}>
        <DeckButton label="Siguiente" onClick={() => decide('skip')} disabled={done} tone="plain" size="lg">
          <path d="M7 7l10 10M17 7L7 17" />
        </DeckButton>
        <DeckButton label="Deshacer" onClick={undo} disabled={decisions.length === 0} tone="plain" size="sm">
          <path d="M9 14L4 9l5-5" />
          <path d="M4 9h10.5a5.5 5.5 0 010 11H11" />
        </DeckButton>
        <DeckButton label="Me encanta" onClick={() => decide('like')} disabled={done} tone="wine" size="lg">
          <path d="M12 20s-7-4.35-7-10a4 4 0 017-2.65A4 4 0 0119 10c0 5.65-7 10-7 10z" />
        </DeckButton>
      </div>

      {/* La tira de favoritas: se llena mientras elige. */}
      {!done && (
        <div className="mt-7 flex min-h-12 items-center gap-3 rounded-full bg-(--h-white) py-1.5 pr-4 pl-1.5 shadow-[0_0_0_1px_var(--h-line)]">
          <ul className="m-0 flex min-w-0 list-none items-center p-0">
            <AnimatePresence initial={false}>
              {favorites.slice(-5).map((template) => (
                <motion.li
                  key={template.href}
                  layout
                  initial={reduced ? false : { scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={reduced ? { opacity: 0 } : { scale: 0, opacity: 0 }}
                  transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 24 }}
                  className="-ml-2 first:ml-0"
                >
                  <Link
                    href={template.href}
                    aria-label={`Abrir la demo de ${template.name}`}
                    className="relative block size-9 overflow-hidden rounded-full ring-2 ring-(--h-white)"
                  >
                    <Image src={template.image.url} alt="" fill sizes="36px" className="object-cover" />
                  </Link>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <p className="m-0 text-[13px] leading-tight text-(--h-muted)">
            {favorites.length === 0
              ? 'Tus favoritas aparecen aquí'
              : `${favorites.length} ${favorites.length === 1 ? 'favorita' : 'favoritas'} · tócalas para abrirlas`}
          </p>
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        {done || !current ? 'Terminaste el mazo.' : `${current.name}, ${index + 1} de ${templates.length}.`}
      </p>
      <p id={hintId} className="sr-only">
        Flecha derecha: me encanta. Flecha izquierda: siguiente. Retroceso: deshacer.
      </p>
    </div>
  );
}

interface DeckCardProps {
  readonly template: ShowcaseTemplate;
  readonly depth: number;
  readonly position: number;
  readonly total: number;
  readonly entryX: number;
  readonly reduced: boolean;
  readonly onDecide: (choice: Choice) => void;
}

function DeckCard({ template, depth, position, total, entryX, reduced, onDecide }: DeckCardProps) {
  const active = depth === 0;
  const x = useMotionValue(entryX);
  const rotate = useTransform(x, [-240, 0, 240], [-14, 0, 14], { clamp: false });
  const likeStamp = useTransform(x, [24, THRESHOLD], [0, 1]);
  const skipStamp = useTransform(x, [-THRESHOLD, -24], [1, 0]);

  /* Al deshacer, la tarjeta nace fuera, del lado por donde se fue, y regresa al centro. */
  const skip = useRef(reduced);
  skip.current = reduced;
  useEffect(() => {
    if (x.get() === 0) return;
    const controls = animate(x, 0, skip.current ? { duration: 0 } : RETURN);
    return () => controls.stop();
  }, [x, entryX]);

  const onDragEnd = (_event: unknown, info: PanInfo) => {
    const far = Math.abs(info.offset.x) >= THRESHOLD;
    const fast = Math.abs(info.velocity.x) >= FLICK && Math.abs(info.offset.x) >= THRESHOLD * 0.35;
    if (!far && !fast) return;
    onDecide((far ? info.offset.x : info.velocity.x) > 0 ? 'like' : 'skip');
  };

  return (
    <motion.div
      aria-hidden={!active}
      inert={!active}
      variants={{
        exit: (dir: number) => ({
          x: dir * 480,
          rotate: dir * 20,
          opacity: 0,
          zIndex: 20,
          transition: reduced ? { duration: 0 } : { duration: 0.32, ease: [0.4, 0, 1, 1] },
        }),
      }}
      initial={{ y: depth * 14, scale: 1 - depth * 0.05 }}
      animate={{ y: depth * 14, scale: 1 - depth * 0.05 }}
      exit="exit"
      transition={reduced ? { duration: 0 } : SETTLE}
      drag={active ? 'x' : false}
      dragDirectionLock
      dragMomentum={false}
      dragElastic={1}
      dragConstraints={{ left: 0, right: 0 }}
      dragTransition={{ bounceStiffness: 260, bounceDamping: 26 }}
      whileDrag={reduced ? undefined : { scale: 1.02 }}
      onDragEnd={onDragEnd}
      style={{ x, rotate, zIndex: 10 - depth, transformOrigin: '50% 90%', touchAction: 'pan-y' }}
      className={clsx(
        'absolute inset-0 overflow-hidden rounded-[18px] bg-(--h-wine) select-none',
        active
          ? 'cursor-grab shadow-[0_28px_50px_-24px_rgba(74,26,44,0.6)] active:cursor-grabbing'
          : 'shadow-[0_10px_24px_-16px_rgba(74,26,44,0.45)]',
      )}
    >
      <Image
        src={template.image.url}
        alt={template.image.alt}
        fill
        draggable={false}
        sizes="360px"
        className="pointer-events-none object-cover object-top"
        priority={depth === 0 && position === 1}
      />
      {/* Las de atrás, más oscuras: así se lee que están debajo. */}
      <div aria-hidden="true" className={clsx('absolute inset-0 transition-colors duration-300', active ? 'bg-transparent' : 'bg-(--h-wine)/30')} />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#2b1a20]/90 via-[#2b1a20]/45 to-transparent" />

      <span className="absolute top-4 left-4 rounded-full bg-black/30 px-3 py-1 text-[11px] tracking-[0.2em] text-white tabular-nums backdrop-blur-sm">
        {position} / {total}
      </span>

      {/* Los sellos que se encienden con el arrastre. */}
      <motion.span
        aria-hidden="true"
        style={{ opacity: likeStamp }}
        className="absolute top-14 left-5 -rotate-12 rounded-[6px] border-2 border-(--h-gold) px-3 py-1 text-[15px] font-medium tracking-[0.2em] text-(--h-gold) uppercase"
      >
        Me encanta
      </motion.span>
      <motion.span
        aria-hidden="true"
        style={{ opacity: skipStamp }}
        className="absolute top-14 right-5 rotate-12 rounded-[6px] border-2 border-white/90 px-3 py-1 text-[15px] font-medium tracking-[0.2em] text-white uppercase"
      >
        Siguiente
      </motion.span>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white">
        <div className="min-w-0">
          <h3 className="h-display m-0 text-[2.1rem] leading-none">{template.name}</h3>
          <p className="mt-2 mb-0 line-clamp-2 text-[14px] leading-snug text-white/85">{template.tagline}</p>
        </div>
        {/* El enlace no arranca el arrastre: tocarlo abre la demo, nada más. */}
        <Link
          href={template.href}
          onPointerDownCapture={(event) => event.stopPropagation()}
          tabIndex={active ? 0 : -1}
          className="shrink-0 rounded-full bg-white/95 px-4 py-2.5 text-[11px] tracking-[0.16em] text-(--h-wine) uppercase"
        >
          Ver demo
        </Link>
      </div>
    </motion.div>
  );
}

function DeckButton({
  label,
  onClick,
  disabled,
  tone,
  size,
  children,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled: boolean;
  readonly tone: 'plain' | 'wine';
  readonly size: 'sm' | 'lg';
  readonly children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="group flex flex-col items-center gap-1.5 disabled:opacity-35">
      <span
        className={clsx(
          'grid place-items-center rounded-full transition-transform duration-200 ease-(--h-ease) group-active:scale-90',
          size === 'lg' ? 'size-15' : 'size-11',
          tone === 'wine'
            ? 'bg-(--h-wine) text-(--h-wine-ink) shadow-[0_14px_28px_-14px_rgba(74,26,44,0.7)]'
            : 'bg-(--h-white) text-(--h-wine) shadow-[0_0_0_1px_var(--h-line),0_10px_22px_-16px_rgba(74,26,44,0.5)]',
        )}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={size === 'lg' ? 'size-6' : 'size-4.5'}
          fill={tone === 'wine' ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={tone === 'wine' ? 0 : 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {children}
        </svg>
      </span>
      <span className="text-[11px] tracking-[0.16em] text-(--h-muted) uppercase">{label}</span>
    </button>
  );
}

/** El final del mazo: sus favoritas con su demo, o una invitación a darle otra vuelta. */
function DeckEnd({ favorites, onRestart }: { readonly favorites: readonly ShowcaseTemplate[]; readonly onRestart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SETTLE}
      className="absolute inset-0 flex flex-col overflow-hidden rounded-[18px] bg-(--h-wine) p-6 text-(--h-wine-ink)"
    >
      <p className="h-script m-0 text-[2.4rem] leading-none text-(--h-gold)">
        {favorites.length > 0 ? 'Tus favoritas' : 'Ninguna todavía'}
      </p>
      {favorites.length > 0 ? (
        <ul className="mt-5 mb-0 grid min-h-0 flex-1 list-none content-start gap-2.5 overflow-y-auto p-0">
          {favorites.map((template) => (
            <li key={template.href}>
              <Link
                href={template.href}
                className="flex items-center gap-3 rounded-[10px] bg-white/8 p-2 pr-4 transition-colors hover:bg-white/14"
              >
                <span className="relative size-12 shrink-0 overflow-hidden rounded-[8px]">
                  <Image src={template.image.url} alt="" fill sizes="48px" className="object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px]">{template.name}</span>
                  <span className="block text-[11px] tracking-[0.16em] text-(--h-gold) uppercase">Ver la demo</span>
                </span>
                <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 mb-0 flex-1 text-[15px] text-(--h-wine-ink)/80">
          Dale otra vuelta al mazo, o cambia a la otra celebración: cada plantilla también se puede
          personalizar con tus colores.
        </p>
      )}
      <button type="button" onClick={onRestart} className="h-button h-button--gold mt-5 self-start">
        Volver a empezar
      </button>
    </motion.div>
  );
}
