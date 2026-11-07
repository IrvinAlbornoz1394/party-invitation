'use client';

import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { useCouple } from './couple';

/**
 * Confirmaciones en vivo: un ejemplo de cómo se va llenando la fiesta en el panel.
 *
 * ## Qué se simula y qué no
 *
 * Es el panel de Premium, el único plan donde la respuesta se guarda y la cuenta se hace sola: cada
 * familia confirma desde su propio enlace y elige cuántos van, de uno a los lugares que le
 * apartaste. Las familias y las cifras son de ejemplo y así se rotula; en Esencial y Plus la
 * confirmación llega por WhatsApp, y eso se dice al pie en vez de mezclarlo en el panel.
 *
 * ## Cómo corre
 *
 * Solo mientras la sección se ve (IntersectionObserver): llega una respuesta cada pocos segundos, el
 * contador y el aro suben, y al terminar la lista se queda un momento llena y vuelve a empezar. Con
 * movimiento reducido se enseña la cuenta final, quieta.
 *
 * El teléfono y el escritorio son dos composiciones distintas sobre el mismo estado: en el teléfono,
 * una pantalla bloqueada donde caen las notificaciones; en escritorio, el panel con su tabla.
 */

type Answer = 'si' | 'no';

interface Arrival {
  readonly family: string;
  readonly answer: Answer;
  /** Lugares que confirma (o que se liberan si no va). */
  readonly seats: number;
  /** Lugares apartados para esa familia. */
  readonly max: number;
  readonly note?: string;
}

const ARRIVALS: readonly Arrival[] = [
  { family: 'Familia Ramírez', answer: 'si', seats: 4, max: 4 },
  { family: 'Tía Lupe y Beto', answer: 'no', seats: 2, max: 2, note: 'Les mandamos un abrazo enorme.' },
  { family: 'Familia Ortega', answer: 'si', seats: 5, max: 5 },
  { family: 'Los Herrera', answer: 'si', seats: 3, max: 4 },
  { family: 'Familia Treviño', answer: 'si', seats: 6, max: 6 },
  { family: 'Primos Salinas', answer: 'si', seats: 2, max: 3 },
  { family: 'Familia Montes', answer: 'si', seats: 4, max: 4 },
  { family: 'Familia Cárdenas', answer: 'no', seats: 3, max: 3, note: 'Estaremos fuera, ¡felicidades!' },
  { family: 'Don Rafa y Carmen', answer: 'si', seats: 2, max: 2 },
  { family: 'Familia Duarte', answer: 'si', seats: 5, max: 6 },
  { family: 'Los Villarreal', answer: 'si', seats: 4, max: 4 },
  { family: 'Familia Lozano', answer: 'si', seats: 4, max: 5 },
  { family: 'Familia Pineda', answer: 'si', seats: 5, max: 5 },
];

/** Lugares de toda la fiesta y lo que ya estaba respondido cuando empieza el ejemplo. */
const CAPACITY = 150;
const START_YES = 88;
const START_NO = 4;
const STEP_MS = 2400;
const HOLD_MS = 5200;

function totalsAt(count: number) {
  let yes = START_YES;
  let no = START_NO;
  for (const arrival of ARRIVALS.slice(0, count)) {
    if (arrival.answer === 'si') yes += arrival.seats;
    else no += arrival.seats;
  }
  return { yes, no, pending: CAPACITY - yes - no };
}

function arrivalText(arrival: Arrival): string {
  return arrival.answer === 'si'
    ? `confirmó ${arrival.seats} de ${arrival.max} ${arrival.max === 1 ? 'lugar' : 'lugares'}`
    : 'no podrá ir';
}

/** Cuántas respuestas han llegado; corre solo a la vista y se reinicia al llenarse. */
function useArrivals(reduced: boolean) {
  const ref = useRef<HTMLElement>(null);
  const [count, setCount] = useState(reduced ? ARRIVALS.length : 0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? false), {
      threshold: 0.25,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduced) {
      setCount(ARRIVALS.length);
      return;
    }
    if (!visible) return;
    const done = count >= ARRIVALS.length;
    const timer = window.setTimeout(() => setCount(done ? 0 : count + 1), done ? HOLD_MS : count === 0 ? 700 : STEP_MS);
    return () => window.clearTimeout(timer);
  }, [count, visible, reduced]);

  return { ref, count };
}

/** Un número que sube con resorte hasta su valor. */
function Rolling({ value, reduced }: { readonly value: number; readonly reduced: boolean }) {
  const motionValue = useMotionValue(value);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest).toString());
  useEffect(() => {
    if (reduced) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [value, reduced, motionValue]);
  return <motion.span className="tabular-nums">{rounded}</motion.span>;
}

/** El aro de lugares confirmados, con la cifra al centro. */
function Ring({
  yes,
  reduced,
  size,
  tone,
}: {
  readonly yes: number;
  readonly reduced: boolean;
  readonly size: number;
  readonly tone: 'light' | 'dark';
}) {
  const stroke = size * 0.07;
  const radius = (size - stroke) / 2;
  const share = yes / CAPACITY;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={tone === 'dark' ? 'stroke-(--h-wine-ink)/15' : 'stroke-(--h-line)'}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="stroke-(--h-gold)"
          initial={false}
          animate={{ pathLength: share }}
          transition={reduced ? { duration: 0 } : { duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span
          className={clsx('h-display leading-none', tone === 'dark' ? 'text-(--h-wine-ink)' : 'text-(--h-wine)')}
          style={{ fontSize: size * 0.26 }}
        >
          <Rolling value={yes} reduced={reduced} />
        </span>
        <span
          className={clsx(
            'mt-1 text-[10px] tracking-[0.22em] uppercase',
            tone === 'dark' ? 'text-(--h-wine-ink)/70' : 'text-(--h-muted)',
          )}
        >
          de {CAPACITY} lugares
        </span>
      </div>
    </div>
  );
}

function Totals({
  yes,
  no,
  pending,
  reduced,
  tone,
}: {
  readonly yes: number;
  readonly no: number;
  readonly pending: number;
  readonly reduced: boolean;
  readonly tone: 'light' | 'dark';
}) {
  const items = [
    { label: 'Confirmados', value: yes, dot: 'bg-(--h-gold)' },
    { label: 'Pendientes', value: pending, dot: tone === 'dark' ? 'bg-(--h-wine-ink)/40' : 'bg-(--h-line)' },
    { label: 'No van', value: no, dot: 'bg-(--h-rose)' },
  ];
  return (
    <dl className="m-0 grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt
            className={clsx(
              'flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase',
              tone === 'dark' ? 'text-(--h-wine-ink)/70' : 'text-(--h-muted)',
            )}
          >
            <span aria-hidden="true" className={clsx('size-2 shrink-0 rounded-full', item.dot)} />
            {item.label}
          </dt>
          <dd className={clsx('h-display m-0 mt-1 text-[1.6rem] leading-none', tone === 'dark' ? 'text-(--h-wine-ink)' : 'text-(--h-wine)')}>
            <Rolling value={item.value} reduced={reduced} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** La notificación de una respuesta: blanca y translúcida en el teléfono, de papel en escritorio. */
function Notice({ arrival, variant }: { readonly arrival: Arrival; readonly variant: 'lock' | 'toast' }) {
  const yes = arrival.answer === 'si';
  return (
    <div
      className={clsx(
        'flex items-start gap-3 rounded-[18px] px-4 py-3',
        variant === 'lock'
          ? 'bg-white/85 text-(--h-ink) shadow-[0_12px_30px_-18px_rgba(20,6,12,0.7)] backdrop-blur-md'
          : 'bg-(--h-white) text-(--h-ink) shadow-[0_18px_40px_-24px_rgba(43,26,32,0.55),0_0_0_1px_var(--h-line)]',
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          'mt-0.5 grid size-9 shrink-0 place-items-center rounded-[10px] text-[15px]',
          yes ? 'bg-(--h-wine) text-(--h-wine-ink)' : 'bg-(--h-paper-2) text-(--h-wine)',
        )}
      >
        {yes ? '✓' : '—'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="m-0 flex items-baseline justify-between gap-2 text-[10px] tracking-[0.16em] text-(--h-muted) uppercase">
          <span>Tu panel · Confirmaciones</span>
          <span className="tracking-normal normal-case">ahora</span>
        </p>
        <p className="m-0 mt-0.5 text-[14px] leading-snug">
          <strong className="font-medium">{arrival.family}</strong> {arrivalText(arrival)}
        </p>
        {arrival.note && <p className="m-0 mt-0.5 text-[13px] text-(--h-muted) italic">«{arrival.note}»</p>}
      </div>
    </div>
  );
}

const SPRING = { type: 'spring', stiffness: 380, damping: 32, mass: 0.8 } as const;

export function LiveRsvp() {
  const { kind, displayNames, daysLeft } = useCouple();
  const reduced = useReducedMotion() === true;
  const { ref, count } = useArrivals(reduced);
  const totals = useMemo(() => totalsAt(count), [count]);
  /* Lo más reciente primero. */
  const arrived = useMemo(() => [...ARRIVALS.slice(0, count)].reverse(), [count]);

  const title = kind === 'boda' ? `Así se llena la boda de ${displayNames}` : `Así se llenan los XV de ${displayNames}`;
  const days = daysLeft > 0 ? `Faltan ${daysLeft} días` : 'Tu gran día';
  const transition = reduced ? { duration: 0 } : SPRING;

  return (
    <section
      ref={ref}
      id="confirmaciones"
      aria-labelledby="confirmaciones-titulo"
      className="relative overflow-hidden bg-(--h-wine) py-20 text-(--h-wine-ink) md:bg-(--h-paper) md:py-28 md:text-(--h-ink)"
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-8 md:grid-cols-[1fr_1.15fr] md:items-center md:gap-14">
        <header data-reveal className="text-center md:text-left">
          <span className="h-eyebrow h-eyebrow--dark md:hidden">Confirmaciones</span>
          <span className="h-eyebrow hidden md:inline-flex">Confirmaciones</span>
          <h2 id="confirmaciones-titulo" data-split="off" className="h-heading mt-5 mb-0 [overflow-wrap:anywhere]">
            {title}
          </h2>
          <p className="mx-auto mt-5 mb-0 max-w-md text-(--h-wine-ink)/80 md:mx-0 md:text-(--h-muted)">
            Cada familia confirma desde su propio enlace y elige cuántos van, hasta los lugares que le
            apartaste. Tú solo ves cómo sube la cuenta.
          </p>

          {/* Escritorio: las notificaciones llegan aquí, a un lado del panel. */}
          <div className="relative mt-10 hidden h-[16.5rem] md:block" aria-hidden="true">
            <AnimatePresence initial={false}>
              {arrived.slice(0, 3).map((arrival, index) => (
                <motion.div
                  key={arrival.family}
                  layout
                  initial={{ opacity: 0, y: -24, scale: 0.96 }}
                  animate={{ opacity: 1 - index * 0.28, y: index * 84, scale: 1 - index * 0.03 }}
                  exit={{ opacity: 0, y: 3 * 84, scale: 0.9 }}
                  transition={transition}
                  className="absolute inset-x-0 top-0 max-w-sm"
                  style={{ zIndex: 3 - index }}
                >
                  <Notice arrival={arrival} variant="toast" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </header>

        {/* Teléfono: la pantalla bloqueada. El reloj es la cuenta regresiva de su fiesta. */}
        <div aria-hidden="true" className="md:hidden">
          <div className="relative mx-auto max-w-sm overflow-hidden rounded-[2.4rem] bg-[radial-gradient(120%_80%_at_50%_0%,#7a3550_0%,#4a1a2c_55%,#2e0f1b_100%)] px-4 pt-7 pb-6 shadow-[0_40px_70px_-40px_rgba(0,0,0,0.8),inset_0_0_0_1px_rgba(255,255,255,0.08)]">
            <p className="m-0 text-center text-[11px] tracking-[0.24em] text-(--h-wine-ink)/70 uppercase">
              {kind === 'boda' ? 'Boda' : 'XV años'} · {displayNames}
            </p>
            <p className="h-display m-0 mt-1 text-center text-[2.6rem] leading-none">{days}</p>

            <div className="relative mt-6 h-[15.5rem]">
              <AnimatePresence initial={false}>
                {arrived.slice(0, 3).map((arrival, index) => (
                  <motion.div
                    key={arrival.family}
                    layout
                    initial={{ opacity: 0, y: -30, scale: 0.94 }}
                    animate={{ opacity: 1 - index * 0.25, y: index * 78, scale: 1 - index * 0.035 }}
                    exit={{ opacity: 0, scale: 0.88 }}
                    transition={transition}
                    className="absolute inset-x-0 top-0"
                    style={{ zIndex: 3 - index }}
                  >
                    <Notice arrival={arrival} variant="lock" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center gap-8">
            <Ring yes={totals.yes} reduced={reduced} size={200} tone="dark" />
            <div className="w-full max-w-sm">
              <Totals {...totals} reduced={reduced} tone="dark" />
            </div>
          </div>
        </div>

        {/* Escritorio: el panel, con la cuenta a la izquierda y las familias a la derecha. */}
        <div
          aria-hidden="true"
          className="hidden overflow-hidden rounded-[10px] bg-(--h-white) shadow-[0_50px_90px_-50px_rgba(43,26,32,0.6),0_0_0_1px_var(--h-line)] md:block"
        >
          <div className="flex items-center justify-between border-b border-(--h-line) px-6 py-4">
            <p className="m-0 text-[11px] tracking-[0.22em] text-(--h-muted) uppercase">
              Panel · {kind === 'boda' ? 'Boda' : 'XV años'} de {displayNames}
            </p>
            <span className="rounded-full bg-(--h-paper-2) px-3 py-1 text-[11px] text-(--h-wine)">{days}</span>
          </div>
          <div className="grid gap-6 p-6 lg:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center gap-6">
              <Ring yes={totals.yes} reduced={reduced} size={170} tone="light" />
            </div>
            <div className="flex min-w-0 flex-col gap-5">
              <Totals {...totals} reduced={reduced} tone="light" />
              <ul className="m-0 grid h-[15.5rem] list-none content-start gap-0 overflow-hidden p-0">
                <AnimatePresence initial={false}>
                  {arrived.slice(0, 6).map((arrival) => (
                    <motion.li
                      key={arrival.family}
                      layout
                      initial={{ opacity: 0, backgroundColor: 'rgba(195,154,95,0.22)' }}
                      animate={{ opacity: 1, backgroundColor: 'rgba(195,154,95,0)' }}
                      exit={{ opacity: 0 }}
                      transition={reduced ? { duration: 0 } : { ...SPRING, backgroundColor: { duration: 1.6 } }}
                      className="flex items-center justify-between gap-3 border-b border-(--h-line) px-2 py-2.5 text-[14px] last:border-b-0"
                    >
                      <span className="truncate">{arrival.family}</span>
                      <span
                        className={clsx(
                          'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] tracking-[0.06em]',
                          arrival.answer === 'si'
                            ? 'bg-(--h-wine) text-(--h-wine-ink)'
                            : 'bg-(--h-paper-2) text-(--h-muted)',
                        )}
                      >
                        {arrival.answer === 'si' ? `Van ${arrival.seats} de ${arrival.max}` : 'No van'}
                      </span>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Lo que se ve arriba no se lee en voz alta: aquí va la cuenta en texto, al día. */}
      <p className="sr-only" aria-live="off">
        Ejemplo de panel: {totals.yes} de {CAPACITY} lugares confirmados, {totals.pending} pendientes y {totals.no}{' '}
        que no van.
      </p>

      <p className="mx-auto mt-12 mb-0 max-w-2xl px-5 text-center text-[12.5px] text-(--h-wine-ink)/65 md:text-(--h-muted)">
        Ejemplo con familias y cifras inventadas. Así se ve en Premium, donde la respuesta llega a tu panel; en
        Esencial y Plus te llega por WhatsApp con el mensaje ya escrito.
      </p>
    </section>
  );
}
