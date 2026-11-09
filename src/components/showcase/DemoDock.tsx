'use client';

import { useCallback, useEffect, useRef, useState, useTransition, type MouseEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, LayoutGrid, LoaderCircle, X } from 'lucide-react';
import { DESKTOP_QUERY, useMedia } from '@/components/home/useMedia';
import type { DemoTemplate } from '@/components/invitation/demo/templates';
import { findPalette, palettesFor, type PaletteColors, type PaletteFamily } from '@/domain/invitation/palettes';
import type { StudioEventType, StudioTemplateOption } from './TemplateStudio';

/**
 * Los mandos de la demo: una barra abajo y un selector de plantillas con sus capturas.
 *
 * ## Por qué una barra y no un panel lateral
 *
 * El panel lateral se pensó para muchos mandos (paleta, diseño de cada sección). Con solo dos
 * decisiones —tipo de evento y plantilla— un panel que tapa un tercio de la pantalla es
 * desproporcionado, y la pestaña del canto escondía que se podía cambiar de plantilla. La barra
 * está siempre a la vista, ocupa una línea y deja la invitación entera detrás:
 *
 * - **Las flechas** pasan a la plantilla anterior o siguiente del mismo tipo. Es lo que más se
 *   hace en un escaparate: comparar una con otra sin salir de la invitación.
 * - **El nombre** abre el selector, con la captura de cada plantilla. Un nombre como «Silk» no
 *   dice nada; la captura sí, y así se elige viendo en vez de probando a ciegas.
 * - **El tipo de evento** va a la vista en el escritorio, y dentro del selector en el teléfono.
 * - **La paleta** abre una bandeja encima de la barra, sin velo ni bloqueo: se toca un color y se
 *   ve la invitación cambiar detrás, que es la única forma de juzgar una paleta.
 *
 * En el teléfono la barra deja libre el canto derecho, donde viven la música y el volver arriba.
 *
 * Va por encima de las bienvenidas (sobres, puertas: `z-[60]`) a propósito: quien compara
 * plantillas con las flechas no debería tener que abrir cada sobre para pasar a la siguiente.
 */
export function DemoDock({
  template,
  templates,
  eventTypes,
  palette,
  persona,
}: {
  readonly template: DemoTemplate;
  readonly templates: readonly StudioTemplateOption[];
  readonly eventTypes: readonly StudioEventType[];
  /** La paleta elegida (`null` = la de la plantilla), los colores originales y cómo cambiarla. */
  readonly palette: {
    readonly key: string | null;
    readonly original: PaletteColors;
    readonly set: (key: string | null) => void;
  };
  /** El aviso de «con tus datos», cuando la demo lleva los de la visitante. */
  readonly persona: { readonly names: string; readonly showingSample: boolean; readonly toggle: () => void } | null;
}) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [pending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [trayOpen, setTrayOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const paletteButtonRef = useRef<HTMLButtonElement>(null);

  const chosenPalette = findPalette(palette.key);
  const currentColors = chosenPalette?.colors ?? palette.original;
  /* La paleta viaja con la solicitud, igual que la plantilla: «Silk en talavera» es lo que le
     gustó, y es lo que quien atiende necesita saber. */
  const quoteHref = `/cotizar?plantilla=${template.key}${chosenPalette ? `&paleta=${chosenPalette.key}` : ''}`;

  /* El foco vuelve al botón solo al cerrar con teclado: tras un toque en la X, un anillo en el
     botón de la barra parece una selección. */
  const closeTray = useCallback((restoreFocus: boolean) => {
    setTrayOpen(false);
    if (restoreFocus) paletteButtonRef.current?.focus();
  }, []);

  const sameType = templates.filter((option) => option.eventTypeKey === template.eventTypeKey);
  const index = Math.max(0, sameType.findIndex((option) => option.key === template.key));
  const previous = sameType[(index - 1 + sameType.length) % sameType.length];
  const next = sameType[(index + 1) % sameType.length];
  const single = sameType.length < 2;

  /*
   * Las vecinas se piden de antemano: la flecha es lo que más se toca, y así la siguiente
   * plantilla ya está en el navegador cuando se pulsa.
   */
  useEffect(() => {
    if (previous) router.prefetch(`/plantillas/${previous.key}`);
    if (next) router.prefetch(`/plantillas/${next.key}`);
  }, [router, previous, next]);

  const go = (key: string) => {
    if (key === template.key) return;
    startTransition(() => router.push(`/plantillas/${key}`));
  };

  /*
   * Los enlaces siguen siendo enlaces —se abren en otra pestaña con ⌘/Ctrl o el botón del medio—,
   * pero el clic normal pasa por la transición para que la barra diga que está cargando.
   */
  const onLinkClick = (key: string, after?: () => void) => (event: MouseEvent<HTMLElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    after?.();
    go(key);
  };

  /* Estable: el selector lo usa como dependencia de su efecto de foco y bloqueo de scroll. */
  const closePicker = useCallback(() => {
    setPickerOpen(false);
    triggerRef.current?.focus();
  }, []);

  return (
    <>
      <div className="pointer-events-none fixed right-[4.75rem] bottom-4 left-3 z-[70] mb-[env(safe-area-inset-bottom)] flex flex-col items-start gap-2 md:right-0 md:left-0 md:items-center">
        {persona && (
          <div className="pointer-events-auto flex max-w-full items-center gap-2.5 rounded-full border border-white/15 bg-neutral-900/80 py-1 pr-1 pl-3.5 text-[12px] text-white shadow-lg backdrop-blur-md">
            <span className="truncate">
              {persona.showingSample ? 'Viendo el ejemplo' : <>Con tus datos · <strong className="font-medium">{persona.names}</strong></>}
            </span>
            <button
              type="button"
              onClick={persona.toggle}
              className="shrink-0 cursor-pointer rounded-full border-0 bg-white/12 px-2.5 py-1 text-[11px] text-white transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              {persona.showingSample ? 'Ver con mis datos' : 'Ver ejemplo'}
            </button>
          </div>
        )}

        <AnimatePresence>
          {trayOpen && (
            <PaletteTray
              eventTypeKey={template.eventTypeKey}
              activeKey={palette.key}
              original={palette.original}
              onPick={palette.set}
              onClose={closeTray}
            />
          )}
        </AnimatePresence>

        <motion.nav
          aria-label="Plantillas de la demostración"
          aria-busy={pending}
          className="pointer-events-auto flex w-full items-center gap-1 rounded-2xl border border-white/12 bg-neutral-900/85 p-1.5 text-white shadow-2xl backdrop-blur-xl md:w-auto md:gap-1.5"
          initial={reduced ? false : { y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href="/"
            aria-label="Volver al inicio"
            title="Volver al inicio"
            className="hidden size-10 shrink-0 place-items-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none md:grid"
          >
            <ArrowLeft size={17} strokeWidth={1.9} aria-hidden="true" />
          </Link>

          <div className="hidden md:block">
            <EventTypeSwitch
              eventTypes={eventTypes}
              activeKey={template.eventTypeKey}
              hrefFor={(option) => `/plantillas/${option.templateKey}`}
              onPick={(option, event) => onLinkClick(option.templateKey)(event)}
            />
          </div>

          <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-white/12 md:block" />

          <StepLink
            label={previous ? `Plantilla anterior: ${previous.name}` : 'Plantilla anterior'}
            href={previous ? `/plantillas/${previous.key}` : '#'}
            disabled={single}
            onClick={previous ? onLinkClick(previous.key) : undefined}
          >
            <ChevronLeft size={18} strokeWidth={2} aria-hidden="true" />
          </StepLink>

          <button
            ref={triggerRef}
            type="button"
            onClick={() => {
              setTrayOpen(false);
              setPickerOpen(true);
            }}
            aria-haspopup="dialog"
            aria-expanded={pickerOpen}
            className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-xl border-0 bg-white/8 px-3 text-left text-white transition-colors hover:bg-white/14 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none md:w-60 md:flex-none"
          >
            <span className="grid size-5 shrink-0 place-items-center text-white/60">
              {pending ? (
                <LoaderCircle size={16} strokeWidth={2} className="animate-spin" aria-hidden="true" />
              ) : (
                <LayoutGrid size={16} strokeWidth={1.9} aria-hidden="true" />
              )}
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-[14px] font-medium">{template.name}</span>
              <span className="truncate text-[11px] text-white/50 tabular-nums">
                {template.eventTypeName} · {index + 1} de {sameType.length}
              </span>
            </span>
            <span className="sr-only">. Ver todas las plantillas</span>
          </button>

          <StepLink
            label={next ? `Plantilla siguiente: ${next.name}` : 'Plantilla siguiente'}
            href={next ? `/plantillas/${next.key}` : '#'}
            disabled={single}
            onClick={next ? onLinkClick(next.key) : undefined}
          >
            <ChevronRight size={18} strokeWidth={2} aria-hidden="true" />
          </StepLink>

          <button
            ref={paletteButtonRef}
            type="button"
            onClick={() => setTrayOpen((current) => !current)}
            aria-expanded={trayOpen}
            aria-label={`Paleta de color: ${chosenPalette?.name ?? 'la de la plantilla'}`}
            title="Cambiar la paleta de color"
            className={`flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border-0 px-2.5 text-white transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none md:pr-3.5 ${
              trayOpen ? 'bg-white/16' : 'bg-transparent hover:bg-white/10'
            }`}
          >
            <SwatchDot colors={currentColors} />
            <span aria-hidden="true" className="hidden text-[13px] md:inline">Paleta</span>
          </button>

          {/*
            Pedir información desde aquí: es el momento de máximo interés —acaba de gustarle una
            plantilla—. La plantilla viaja en la URL para que la solicitud llegue diciendo cuál.
            En el teléfono vive dentro del selector: la barra no tiene ancho para todo.
          */}
          <Link
            href={quoteHref}
            className="ml-1 hidden min-h-11 shrink-0 items-center rounded-xl bg-white px-5 text-[12px] font-semibold tracking-[0.12em] text-ink uppercase no-underline transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 focus-visible:outline-none md:inline-flex"
          >
            Quiero esta plantilla
          </Link>
        </motion.nav>
      </div>

      <TemplatePicker
        open={pickerOpen}
        onClose={closePicker}
        template={template}
        templates={templates}
        eventTypes={eventTypes}
        quoteHref={quoteHref}
        onPick={(key) => (event) => onLinkClick(key, () => setPickerOpen(false))(event)}
      />
    </>
  );
}

/**
 * El selector de plantillas: todas las del tipo elegido, con su captura.
 *
 * En el teléfono sube desde abajo, como una hoja; en el escritorio es una ventana centrada con
 * más columnas. El tipo de evento de arriba **filtra aquí mismo** en lugar de saltar a otra demo:
 * quien está viendo una boda puede curiosear los XV sin perder la invitación que tiene detrás.
 */
function TemplatePicker({
  open,
  onClose,
  template,
  templates,
  eventTypes,
  quoteHref,
  onPick,
}: {
  readonly quoteHref: string;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly template: DemoTemplate;
  readonly templates: readonly StudioTemplateOption[];
  readonly eventTypes: readonly StudioEventType[];
  readonly onPick: (key: string) => (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const reduced = useReducedMotion();
  const wide = useMedia(DESKTOP_QUERY);
  const [browseType, setBrowseType] = useState(template.eventTypeKey);
  const dialogRef = useRef<HTMLDivElement>(null);

  /* Al abrir se vuelve al tipo que se está viendo: es lo primero que se quiere encontrar. */
  useEffect(() => {
    if (open) setBrowseType(template.eventTypeKey);
  }, [open, template.eventTypeKey]);

  /*
   * Ventana modal de verdad: el foco entra, no se escapa con Tab, Escape cierra y la página de
   * detrás no se desplaza mientras tanto.
   */
  useEffect(() => {
    if (!open) return;

    /* El foco va a la ventana y no al botón de cerrar: con el ratón, un anillo en la X al abrir
       parece un error, y el lector de pantalla anuncia igual el título. */
    dialogRef.current?.focus();
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';

    const onKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') {
        onClose();
        return;
      }
      if (keyboardEvent.key !== 'Tab' || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      if (keyboardEvent.shiftKey && document.activeElement === first) {
        keyboardEvent.preventDefault();
        last.focus();
      } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
        keyboardEvent.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      root.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  const visible = templates.filter((option) => option.eventTypeKey === browseType);
  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center md:items-center md:p-8">
          <motion.div
            aria-hidden="true"
            onClick={onClose}
            className="absolute inset-0 bg-neutral-950/55 backdrop-blur-sm"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.25 }}
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-picker-title"
            tabIndex={-1}
            className="relative outline-none flex max-h-[88svh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-neutral-900 text-white shadow-2xl md:max-h-[min(52rem,90svh)] md:max-w-5xl md:rounded-3xl"
            initial={reduced ? false : wide ? { opacity: 0, y: 16, scale: 0.98 } : { y: '100%' }}
            animate={wide ? { opacity: 1, y: 0, scale: 1 } : { y: 0 }}
            exit={reduced ? undefined : wide ? { opacity: 0, y: 12, scale: 0.98 } : { y: '100%' }}
            transition={{ duration: 0.38, ease }}
          >
            {/* El asa: dice «esto es una hoja» en el teléfono. */}
            <span aria-hidden="true" className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/20 md:hidden" />

            <header className="flex flex-wrap items-center gap-x-6 gap-y-4 border-b border-white/10 px-5 pt-4 pb-4 md:px-8 md:pt-7 md:pb-6">
              <div className="min-w-0 flex-1">
                <p className="m-0 text-[10.5px] tracking-[0.26em] text-white/45 uppercase">Demostración</p>
                <h2 id="demo-picker-title" className="mt-1 mb-0 font-display text-[26px] leading-tight font-medium md:text-[32px]">
                  Elige una plantilla
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="order-2 grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-white/8 text-white transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none md:order-3"
              >
                <X size={18} strokeWidth={1.8} aria-hidden="true" />
              </button>

              <div className="order-3 w-full md:order-2 md:w-auto">
                <EventTypeSwitch
                  eventTypes={eventTypes}
                  activeKey={browseType}
                  onPick={(option, event) => {
                    event.preventDefault();
                    setBrowseType(option.key);
                  }}
                />
              </div>
            </header>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 md:px-8 md:py-7">
              <ul className="m-0 grid list-none grid-cols-2 gap-x-3 gap-y-6 p-0 sm:grid-cols-3 md:grid-cols-4 md:gap-x-5 md:gap-y-8">
                {visible.map((option, position) => {
                  const current = option.key === template.key;
                  return (
                    <motion.li
                      key={option.key}
                      initial={reduced ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: Math.min(position, 8) * 0.03, ease }}
                    >
                      <Link
                        href={`/plantillas/${option.key}`}
                        onClick={current ? (event) => { event.preventDefault(); onClose(); } : onPick(option.key)}
                        aria-current={current ? 'page' : undefined}
                        className="group block rounded-2xl text-white no-underline focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-neutral-900 focus-visible:outline-none"
                      >
                        <span
                          className={`relative block aspect-[3/5] overflow-hidden rounded-2xl border bg-white/5 transition-[transform,border-color] duration-300 group-hover:-translate-y-1 ${
                            current ? 'border-white ring-2 ring-white/60' : 'border-white/10 group-hover:border-white/30'
                          }`}
                        >
                          {/* `img` y no `next/image`: las capturas ya son WebP pequeños hechos a medida. */}
                          <img
                            src={option.preview.url}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                          {current && (
                            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10.5px] font-semibold tracking-[0.08em] text-neutral-900 uppercase">
                              <Check size={12} strokeWidth={2.6} aria-hidden="true" />
                              Viendo
                            </span>
                          )}
                        </span>
                        <span className="mt-3 block text-[15px] font-medium">{option.name}</span>
                        <span className="mt-1 line-clamp-2 block text-[12.5px] leading-snug text-white/55">
                          {option.tagline}
                        </span>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            </div>

            <footer className="flex items-center gap-3 border-t border-white/10 px-5 pt-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] md:px-8">
              <Link
                href="/"
                className="text-[12px] tracking-[0.12em] text-white/60 uppercase no-underline transition-colors hover:text-white"
              >
                ← Inicio
              </Link>
              <Link
                href={quoteHref}
                className="ml-auto inline-flex min-h-11 items-center rounded-xl bg-white px-5 text-[12px] font-semibold tracking-[0.12em] text-ink uppercase no-underline transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 focus-visible:outline-none"
              >
                Quiero {template.name}
              </Link>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * Boda / XV años. Dos opciones, así que van a la vista y no en un desplegable.
 *
 * Con `hrefFor` son enlaces que llevan a la demo hermana (la barra); sin él, botones que solo
 * filtran (el selector).
 */
function EventTypeSwitch({
  eventTypes,
  activeKey,
  hrefFor,
  onPick,
}: {
  readonly eventTypes: readonly StudioEventType[];
  readonly activeKey: string;
  readonly hrefFor?: (option: StudioEventType) => string;
  readonly onPick: (option: StudioEventType, event: MouseEvent<HTMLElement>) => void;
}) {
  const itemClass = (active: boolean) =>
    `inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border-0 px-4 text-[13px] whitespace-nowrap no-underline transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
      active ? 'bg-white font-medium text-neutral-900' : 'bg-transparent text-white/70 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <div
      role={hrefFor ? undefined : 'radiogroup'}
      aria-label="Tipo de evento"
      className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-white/8 p-1"
    >
      {eventTypes.map((option) => {
        const active = option.key === activeKey;
        return hrefFor ? (
          <Link
            key={option.key}
            href={hrefFor(option)}
            aria-current={active ? 'true' : undefined}
            onClick={(event) => (active ? event.preventDefault() : onPick(option, event))}
            className={itemClass(active)}
          >
            {option.name}
          </Link>
        ) : (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={(event) => onPick(option, event)}
            className={itemClass(active)}
          >
            {option.name}
          </button>
        );
      })}
    </div>
  );
}

function StepLink({
  label,
  href,
  disabled,
  onClick,
  children,
}: {
  readonly label: string;
  readonly href: string;
  readonly disabled: boolean;
  readonly onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  readonly children: ReactNode;
}) {
  const className =
    'grid size-11 shrink-0 place-items-center rounded-xl text-white transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none';

  if (disabled) {
    return (
      <span aria-hidden="true" className={`${className} opacity-30`}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} aria-label={label} title={label} onClick={onClick} className={`${className} hover:bg-white/10`}>
      {children}
    </Link>
  );
}

/** Tres colores de una paleta en un círculo: el que afirma, el que decora y el papel. */
function SwatchDot({ colors, size = 'size-6' }: { readonly colors: PaletteColors; readonly size?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`${size} shrink-0 rounded-full border border-white/25`}
      style={{
        background: `conic-gradient(${colors.primary} 0 50%, ${colors.accent} 50% 75%, ${colors.background} 75% 100%)`,
      }}
    />
  );
}

const FAMILIES: readonly { readonly key: PaletteFamily; readonly label: string }[] = [
  { key: 'classic', label: 'Las de siempre' },
  { key: 'rare', label: 'Poco comunes' },
];

/**
 * La bandeja de paletas, encima de la barra.
 *
 * **No es modal, a propósito.** Una paleta solo se juzga viéndola puesta, así que la invitación
 * sigue a la vista, sin velo, y se puede desplazar con la bandeja abierta para ver cómo queda la
 * galería o el pie. Por eso tampoco se cierra al elegir: lo normal es tocar tres o cuatro antes
 * de decidir. Se cierra con la X, con Escape o con el mismo botón de la barra.
 *
 * Cada muestra es una invitación en miniatura —el papel, la tinta en «Aa», el acento y la franja
 * del color principal— y no tres círculos: así se ve qué color va de fondo y cuál de franja, que
 * es lo que cambia por completo cómo se siente una paleta.
 */
function PaletteTray({
  eventTypeKey,
  activeKey,
  original,
  onPick,
  onClose,
}: {
  readonly eventTypeKey: string;
  readonly activeKey: string | null;
  readonly original: PaletteColors;
  readonly onPick: (key: string | null) => void;
  readonly onClose: (restoreFocus: boolean) => void;
}) {
  const reduced = useReducedMotion();
  const all = palettesFor(eventTypeKey);
  const active = findPalette(activeKey);
  const [family, setFamily] = useState<PaletteFamily>(active?.family ?? 'classic');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') onClose(true);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  /* Al cambiar de familia la fila vuelve al principio: si no, se queda a medio desplazar. */
  useEffect(() => {
    listRef.current?.scrollTo({ left: 0, top: 0 });
  }, [family]);

  const options = [
    ...(family === 'classic' ? [{ key: null, name: 'Original', colors: original }] : []),
    ...all.filter((palette) => palette.family === family).map((palette) => ({ key: palette.key, name: palette.name, colors: palette.colors })),
  ];

  return (
    <motion.section
      role="region"
      aria-label="Paletas de color"
      className="pointer-events-auto w-full overflow-hidden rounded-2xl border border-white/12 bg-neutral-900/92 text-white shadow-2xl backdrop-blur-xl md:w-[42rem]"
      initial={reduced ? false : { opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="flex items-start gap-3 px-4 pt-3.5 pb-3 md:px-5">
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[10.5px] tracking-[0.24em] text-white/45 uppercase">Paleta de color</p>
          <p className="mt-1 mb-0 truncate text-[14px] font-medium">{active?.name ?? 'Original de la plantilla'}</p>
          <p className="mt-0.5 mb-0 line-clamp-2 text-[12px] leading-snug text-white/55">
            {active?.mood ?? 'Los colores con los que se diseñó. Prueba otra y mira la invitación cambiar detrás.'}
          </p>
        </div>
        <button
          type="button"
          onClick={(event) => onClose(event.detail === 0)}
          aria-label="Cerrar las paletas"
          className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-white/8 text-white transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          <X size={16} strokeWidth={1.9} aria-hidden="true" />
        </button>
      </header>

      <div role="tablist" aria-label="Familia de paletas" className="mx-4 grid grid-cols-2 gap-1 rounded-xl bg-white/8 p-1 md:mx-5 md:inline-grid md:w-auto">
        {FAMILIES.map((option) => {
          const selected = option.key === family;
          return (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setFamily(option.key)}
              className={`h-8 cursor-pointer rounded-lg border-0 px-4 text-[12.5px] whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
                selected ? 'bg-white font-medium text-neutral-900' : 'bg-transparent text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/*
        En el teléfono, una fila que se desliza: la bandeja se queda baja y la invitación sigue a la
        vista encima. En el escritorio hay ancho para una cuadrícula.
      */}
      <div
        ref={listRef}
        role="radiogroup"
        aria-label="Paletas"
        className="flex snap-x scroll-px-4 gap-2.5 overflow-x-auto overscroll-contain px-4 pt-3.5 pb-4 [scrollbar-width:none] md:grid md:max-h-[min(19rem,42svh)] md:grid-cols-6 md:overflow-x-visible md:overflow-y-auto md:px-5"
      >
        {options.map((option) => {
          const selected = option.key === activeKey;
          return (
            <button
              key={option.key ?? 'original'}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onPick(option.key)}
              className="group w-[5.75rem] shrink-0 cursor-pointer snap-start rounded-xl border-0 bg-transparent p-0 text-left text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 focus-visible:outline-none md:w-auto"
            >
              <span
                className={`relative block h-[4.25rem] overflow-hidden rounded-xl border transition-transform duration-200 group-hover:-translate-y-0.5 ${
                  selected ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900' : ''
                }`}
                style={{ background: option.colors.background, borderColor: option.colors.line }}
              >
                <span className="absolute top-1.5 left-2 font-display text-[19px] leading-none" style={{ color: option.colors.ink }}>
                  Aa
                </span>
                <span className="absolute top-2.5 right-2 size-2.5 rounded-full" style={{ background: option.colors.accent }} />
                <span className="absolute inset-x-0 bottom-0 h-[1.35rem]" style={{ background: option.colors.primary }} />
                {selected && (
                  <span className="absolute right-1.5 bottom-1 grid size-4 place-items-center rounded-full" style={{ background: option.colors.onPrimary, color: option.colors.primary }}>
                    <Check size={10} strokeWidth={3} aria-hidden="true" />
                  </span>
                )}
              </span>
              <span className="mt-1.5 block truncate text-[11.5px] text-white/80">{option.name}</span>
            </button>
          );
        })}
      </div>
    </motion.section>
  );
}
