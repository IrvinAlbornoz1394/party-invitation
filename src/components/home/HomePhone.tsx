'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import { DESKTOP_QUERY, useMedia } from './useMedia';

const FACTS = [
  { title: 'No descargan nada', detail: 'Se abre en el navegador de su teléfono.' },
  { title: 'Su propio enlace', detail: 'Cada familia con su enlace y su código.' },
  { title: 'Confirman en un toque', detail: 'Y tú lo ves en tu panel o en tu WhatsApp.' },
  { title: 'Mapa para llegar', detail: 'La ceremonia y la fiesta, cada una con su ruta.' },
  { title: 'Cuenta regresiva', detail: 'Los días, horas y minutos que faltan.' },
  { title: 'Música y galería', detail: 'Su canción de fondo y sus mejores fotos.' },
] as const;

/* Dónde flota cada tarjeta alrededor del teléfono y a qué profundidad: más cerca, más se mueve. */
const ORBIT = [
  { side: 'left', top: '6%', gap: '2rem', z: 120 },
  { side: 'left', top: '38%', gap: '4rem', z: 60 },
  { side: 'left', top: '70%', gap: '1.5rem', z: 160 },
  { side: 'right', top: '10%', gap: '3rem', z: 90 },
  { side: 'right', top: '42%', gap: '1.5rem', z: 140 },
  { side: 'right', top: '74%', gap: '3.5rem', z: 70 },
] as const;

const DEMOS = [
  { key: 'mirador', label: 'Boda' },
  { key: 'mirador-xv', label: 'XV años' },
] as const;

type DemoKey = (typeof DEMOS)[number]['key'];

/** La pantalla de un iPhone grande en CSS: la invitación se pinta a este tamaño y se escala. */
const SCREEN = { width: 390, height: 844 };
/** Cuántas capas apiladas dan el grosor del cuerpo. */
const BODY_LAYERS = 12;
const DEPTH = 16;

/**
 * El teléfono 3D: una invitación **de verdad** —la demo de `mirador`, en un `<iframe>`— dentro de
 * un teléfono que flota sobre la página, con sombra, y que se puede girar.
 *
 * ## Cómo es 3D sin una librería 3D
 *
 * Es CSS 3D (`preserve-3d`) movido con GSAP. El cuerpo son doce capas del mismo canto redondeado
 * apiladas en profundidad: girado se ve el grosor. La pantalla va delante, con un brillo que se
 * desliza al girar, y las tarjetas de funciones flotan a distintas profundidades dentro de la misma
 * escena, así que se separan del teléfono al moverlo. La sombra va fuera de la escena, en el suelo,
 * y se desplaza al lado contrario del giro.
 *
 * ## Cómo se mueve
 *
 * - Con ratón, el teléfono **mira hacia el cursor**, sin hacer clic.
 * - Arrastrando —ratón o dedo— se gira más, y al soltar vuelve a su sitio con un rebote.
 * - Quieto, flota.
 *
 * `touch-action: pan-y` deja el scroll vertical al navegador: en el teléfono, deslizar hacia arriba
 * sigue bajando la página y deslizar de lado gira el teléfono.
 *
 * ## La invitación de dentro
 *
 * `/plantillas/<demo>/telefono` es la demo sin mandos ni música. Se pinta a 390×844 y se escala a la
 * pantalla, y se recorre sola de arriba abajo; como es del mismo origen, se puede desplazar desde
 * aquí. No recibe clics: el gesto sobre la pantalla es para girar el teléfono. Para usarla está el
 * enlace a la demo completa.
 *
 * Con movimiento reducido no sigue al cursor, no flota y no se recorre sola.
 *
 * ## En el teléfono, una imagen
 *
 * Un `<iframe>` con otra página entera, girando en 3D dentro de un teléfono de verdad, es demasiado
 * para un celular: se trababa. Ahí se enseña una captura de la misma demo
 * (`public/plantillas/capturas`, ver `scripts/capture-templates.mjs`) en un teléfono plano, y la
 * escena 3D con el `<iframe>` ni se monta.
 */
export function HomePhone() {
  const [demo, setDemo] = useState<DemoKey>('mirador');
  const desktop = useMedia(DESKTOP_QUERY);

  return (
    <section
      id="en-su-telefono"
      aria-labelledby="telefono-titulo"
      className="relative overflow-hidden bg-(--h-paper-2) px-5 pt-20 pb-24 sm:px-8 sm:pt-28 sm:pb-32"
    >
      <div className="mx-auto max-w-3xl text-center">
        <span data-reveal className="h-eyebrow">
          En su teléfono
        </span>
        <h2 id="telefono-titulo" className="h-heading mt-5 mb-0 text-(--h-ink)">
          Así la reciben tus invitados
        </h2>
        <p data-reveal className="mx-auto mt-5 mb-0 max-w-xl text-(--h-muted)">
          <span className="md:hidden">Es una invitación de verdad. Ábrela completa y recórrela.</span>
          <span className="hidden md:inline">Es una invitación de verdad, funcionando. Gíralo con el mouse.</span>
        </p>
      </div>

      <PhoneStill demo={demo} />
      {/* La escena 3D solo se monta en tableta y escritorio; el hueco se reserva desde el HTML. */}
      <div className="hidden md:block">{desktop && <Phone3D demo={demo} />}</div>

      {/* Las funciones en el teléfono: debajo, en rejilla. */}
      <ul className="mx-auto mt-14 grid max-w-md list-none grid-cols-2 gap-3 p-0 md:hidden">
        {FACTS.map((fact) => (
          <li key={fact.title} data-reveal className="rounded-[10px] bg-(--h-white) p-4 shadow-[0_16px_32px_-24px_rgba(43,15,26,0.45)]">
            <p className="h-display m-0 text-[1rem] text-(--h-wine)">{fact.title}</p>
            <p className="mt-1 mb-0 text-[13px] leading-snug text-(--h-muted)">{fact.detail}</p>
          </li>
        ))}
      </ul>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-3 md:mt-20">
        <div role="group" aria-label="Qué invitación ver" className="flex gap-2">
          {DEMOS.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={demo === option.key}
              onClick={() => setDemo(option.key)}
              className={clsx(
                'rounded-full px-4 py-2 text-[12px] tracking-[0.18em] uppercase transition-colors',
                demo === option.key
                  ? 'bg-(--h-wine) text-(--h-wine-ink)'
                  : 'bg-(--h-white) text-(--h-wine) shadow-[inset_0_0_0_1px_var(--h-line)] hover:bg-white',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <Link href={`/plantillas/${demo}`} className="h-button h-button--ghost text-(--h-wine)">
          Abrir la demo completa
        </Link>
      </div>
    </section>
  );
}

/** El teléfono del celular: plano, con la captura de la demo, y todo él lleva a la demo completa. */
function PhoneStill({ demo }: { readonly demo: DemoKey }) {
  return (
    <Link
      href={`/plantillas/${demo}`}
      aria-label="Abrir la invitación de muestra completa"
      className="relative mx-auto mt-12 block w-[min(68vw,16rem)] md:hidden"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-8 left-1/2 h-8 w-[85%] -translate-x-1/2 rounded-[50%] bg-[#2b0f1a] opacity-35 blur-xl"
      />
      <span
        className="relative block rotate-[-3deg] rounded-[2.6rem] bg-[#170a0f] p-[3.5%] shadow-[0_40px_70px_-30px_rgba(30,8,16,0.75),inset_0_0_0_2px_#3a1a25]"
        style={{ aspectRatio: `${SCREEN.width + 30} / ${SCREEN.height + 30}` }}
      >
        <span className="relative block h-full w-full overflow-hidden rounded-[2.1rem] bg-(--h-wine)">
          <Image
            key={demo}
            src={`/plantillas/capturas/${demo}.webp`}
            alt="Captura de la invitación de muestra en un teléfono"
            fill
            sizes="68vw"
            className="object-cover object-top"
          />
          <span aria-hidden="true" className="absolute top-[1.6%] left-1/2 h-[3.2%] w-[30%] -translate-x-1/2 rounded-full bg-black" />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: 'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.14) 50%, transparent 60%)' }}
          />
        </span>
      </span>
    </Link>
  );
}

/** La escena 3D del escritorio, con la demo viva en un `<iframe>`. */
function Phone3D({ demo }: { readonly demo: DemoKey }) {
  const stage = useRef<HTMLDivElement>(null);
  const phone = useRef<HTMLDivElement>(null);
  const shadow = useRef<HTMLDivElement>(null);
  const glare = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0.7);
  const tour = useRef<gsap.core.Tween | null>(null);

  /* La escala de la invitación sigue al ancho real de la pantalla del teléfono. */
  useEffect(() => {
    const el = screen.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale(entry.contentRect.width / SCREEN.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* El giro: mirar al cursor, arrastrar, volver y flotar. */
  useEffect(() => {
    const area = stage.current;
    const body = phone.current;
    if (!area || !body || !shadow.current || !glare.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(body, { rotationY: -18, rotationX: 8 });
      return;
    }

    const rotY = gsap.quickTo(body, 'rotationY', { duration: 0.9, ease: 'power3.out' });
    const rotX = gsap.quickTo(body, 'rotationX', { duration: 0.9, ease: 'power3.out' });
    const shadowX = gsap.quickTo(shadow.current, 'xPercent', { duration: 0.9, ease: 'power3.out' });
    const shadowS = gsap.quickTo(shadow.current, 'scaleX', { duration: 0.9, ease: 'power3.out' });
    const glareX = gsap.quickTo(glare.current, 'xPercent', { duration: 0.9, ease: 'power3.out' });

    const aim = (y: number, x: number) => {
      rotY(y);
      rotX(x);
      shadowX(-y * 1.6);
      shadowS(1 - Math.abs(y) / 160);
      glareX(y * 2.4);
    };

    const float = gsap.to(body, { y: -14, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    aim(-16, 6);

    let dragging: { x: number; y: number; baseY: number; baseX: number } | null = null;
    const current = { y: -16, x: 6 };

    const onMove = (event: PointerEvent) => {
      const box = area.getBoundingClientRect();
      if (dragging) {
        current.y = gsap.utils.clamp(-48, 48, dragging.baseY + (event.clientX - dragging.x) * 0.45);
        current.x = gsap.utils.clamp(-26, 26, dragging.baseX - (event.clientY - dragging.y) * 0.3);
        aim(current.y, current.x);
        return;
      }
      if (event.pointerType !== 'mouse') return;
      /* Mirar al cursor: hacia donde está, con un tope para que nunca quede de canto. */
      const nx = (event.clientX - box.left) / box.width - 0.5;
      const ny = (event.clientY - box.top) / box.height - 0.5;
      current.y = nx * 46;
      current.x = -ny * 26;
      aim(current.y, current.x);
    };

    const onDown = (event: PointerEvent) => {
      dragging = { x: event.clientX, y: event.clientY, baseY: current.y, baseX: current.x };
      area.setPointerCapture(event.pointerId);
      float.pause();
    };

    const release = () => {
      if (!dragging) return;
      dragging = null;
      current.y = -16;
      current.x = 6;
      gsap.to(body, { rotationY: -16, rotationX: 6, duration: 1.6, ease: 'elastic.out(1, 0.45)' });
      shadowX(25);
      shadowS(0.9);
      glareX(-38);
      float.resume();
    };

    const onLeave = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && !dragging) aim(-16, 6);
    };

    area.addEventListener('pointermove', onMove);
    area.addEventListener('pointerdown', onDown);
    area.addEventListener('pointerup', release);
    area.addEventListener('pointercancel', release);
    area.addEventListener('pointerleave', onLeave);
    return () => {
      float.kill();
      area.removeEventListener('pointermove', onMove);
      area.removeEventListener('pointerdown', onDown);
      area.removeEventListener('pointerup', release);
      area.removeEventListener('pointercancel', release);
      area.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  useEffect(() => () => void tour.current?.kill(), []);

  /* El `<iframe>` puede terminar de cargar antes de que React le conecte `onLoad` (llega en el
     HTML del servidor): si ya está listo, el recorrido arranca aquí. */
  useEffect(() => {
    const doc = frame.current?.contentDocument;
    if (doc?.readyState === 'complete' && doc.location.href !== 'about:blank') startTour();
    // `startTour` solo lee refs: no hace falta en las dependencias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo]);

  /* El recorrido: la invitación baja sola hasta el final y vuelve a subir, sin fin. */
  const startTour = () => {
    const win = frame.current?.contentWindow;
    if (!win || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const doc = win.document.documentElement;
    const state = { y: 0 };
    tour.current?.kill();
    const max = () => doc.scrollHeight - win.innerHeight;
    tour.current = gsap.to(state, {
      y: () => max(),
      duration: () => Math.max(30, max() / 220),
      delay: 2.5,
      ease: 'none',
      repeat: -1,
      yoyo: true,
      repeatDelay: 2,
      onUpdate: () => win.scrollTo(0, state.y),
    });
  };

  /* El escenario: aquí se escucha el puntero. */
  return (
      <div
        ref={stage}
        className="relative mx-auto mt-14 flex max-w-5xl cursor-grab touch-pan-y justify-center select-none active:cursor-grabbing sm:mt-20"
        style={{ perspective: '1600px' }}
      >
        {/* La sombra en el suelo. */}
        <div
          ref={shadow}
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[-2.5rem] left-1/2 h-10 w-[min(64vw,16rem)] -translate-x-1/2 rounded-[50%] bg-[#2b0f1a] opacity-40 blur-2xl"
        />

        <div
          ref={phone}
          className="relative w-[min(66vw,17rem)] will-change-transform"
          style={{ transformStyle: 'preserve-3d', aspectRatio: `${SCREEN.width + 30} / ${SCREEN.height + 30}` }}
        >
          {/* El grosor: el canto, en capas. */}
          {Array.from({ length: BODY_LAYERS }, (_, layer) => (
            <div
              key={layer}
              aria-hidden="true"
              className="absolute inset-0 rounded-[2.9rem]"
              style={{
                transform: `translateZ(${-DEPTH + (layer * DEPTH) / BODY_LAYERS}px)`,
                background: layer === 0 ? '#2a1119' : `hsl(340 ${28 + layer}% ${14 + layer * 0.9}%)`,
                boxShadow: layer === 0 ? '0 40px 80px -30px rgba(30,8,16,0.75)' : undefined,
              }}
            />
          ))}

          {/* El frente: marco y pantalla. */}
          <div className="absolute inset-0 rounded-[2.9rem] bg-[#170a0f] p-[3.5%]" style={{ transform: 'translateZ(1px)' }}>
            <div ref={screen} className="relative h-full w-full overflow-hidden rounded-[2.3rem] bg-(--h-wine)">
              <iframe
                ref={frame}
                key={demo}
                title="Invitación de muestra de la plantilla Mirador"
                src={`/plantillas/${demo}/telefono`}
                loading="lazy"
                tabIndex={-1}
                onLoad={startTour}
                className="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
                style={{ width: SCREEN.width, height: SCREEN.height, transform: `scale(${scale})` }}
              />
              {/* La isla de la cámara. */}
              <span aria-hidden="true" className="absolute top-[1.6%] left-1/2 h-[3.2%] w-[30%] -translate-x-1/2 rounded-full bg-black" />
              {/* El brillo del cristal, que se desliza al girar. */}
              <div
                ref={glare}
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-[200%]"
                style={{
                  background: 'linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.16) 48%, transparent 58%)',
                }}
              />
            </div>
          </div>

          {/* Las tarjetas que flotan alrededor, cada una a su profundidad. Solo desde tablet. */}
          {FACTS.map((fact, index) => {
            const spot = ORBIT[index];
            if (!spot) return null;
            return (
              <div
                key={fact.title}
                className="absolute hidden w-[13.5rem] rounded-[10px] bg-(--h-white) p-4 shadow-[0_24px_48px_-24px_rgba(43,15,26,0.45)] md:block"
                style={{
                  top: spot.top,
                  [spot.side === 'left' ? 'right' : 'left']: `calc(100% + ${spot.gap})`,
                  transform: `translateZ(${spot.z}px)`,
                }}
              >
                <span aria-hidden="true" className="block size-2 rotate-45 bg-(--h-rose)" />
                <p className="h-display mt-2 mb-0 text-[1.05rem] text-(--h-wine)">{fact.title}</p>
                <p className="mt-1 mb-0 text-[13px] leading-snug text-(--h-muted)">{fact.detail}</p>
              </div>
            );
          })}
        </div>
      </div>
  );
}
