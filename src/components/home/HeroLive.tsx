'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import clsx from 'clsx';
import { gsap } from 'gsap';
import { EXAMPLE_NAMES, formatLongDate, useCouple, type CelebrationKind } from './couple';
import type { HomeImage } from './types';
import './heroLive.css';

const KINDS: readonly { key: CelebrationKind; label: string }[] = [
  { key: 'boda', label: 'Boda' },
  { key: 'xv', label: 'XV años' },
];

/**
 * La portada en vivo: la visitante escribe sus nombres y ve *su* invitación salir de un sobre.
 *
 * ## Por qué así
 *
 * La pregunta de quien llega es «¿cómo se vería la mía?». En vez de contestarla con capturas, la
 * portada la contesta con sus nombres, su fecha y su cuenta regresiva. Lo que escribe se guarda en
 * `HomeCouple` y la acompaña por el resto de la página.
 *
 * ## Una sola maquetación
 *
 * En el teléfono va todo en columna —titular, sobre, formulario— y en el escritorio en dos
 * columnas con el sobre a la derecha. Las dos son la misma rejilla con áreas distintas: no hace
 * falta duplicar el formulario ni el sobre.
 *
 * ## El movimiento
 *
 * El sobre se abre solo al cargar (solapa, tarjeta que sube, tarjeta al frente) y se vuelve a abrir
 * al tocarlo. En escritorio, con ratón, el sobre se inclina hacia el cursor y su sombra se va al
 * lado contrario. Con movimiento reducido el sobre aparece ya abierto y quieto.
 */
export function HeroLive({ photos }: { readonly photos: { readonly boda: HomeImage; readonly xv: HomeImage } }) {
  const couple = useCouple();
  const { kind } = couple;
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      id="inicio"
      ref={sectionRef}
      aria-labelledby="inicio-titulo"
      className="relative isolate overflow-hidden bg-(--h-wine) text-white"
    >
      {/* Las dos fotos, una encima de otra: al cambiar de celebración se funden. */}
      <div aria-hidden className="absolute inset-0 -z-20">
        {KINDS.map(({ key }) => (
          <Image
            key={key}
            src={photos[key].url}
            alt=""
            fill
            priority={key === 'boda'}
            sizes="100vw"
            className={clsx(
              'object-cover transition-opacity duration-1000 ease-(--h-ease)',
              kind === key ? 'opacity-100' : 'opacity-0',
            )}
          />
        ))}
      </div>
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(43_14_25/0.82)_0%,rgb(74_26_44/0.62)_45%,rgb(43_14_25/0.9)_100%)] lg:bg-[linear-gradient(100deg,rgb(43_14_25/0.9)_0%,rgb(74_26_44/0.7)_50%,rgb(43_14_25/0.45)_100%)]"
      />

      <div className="mx-auto grid min-h-svh max-w-7xl grid-cols-1 items-center gap-x-12 gap-y-8 px-5 pt-24 pb-14 [grid-template-areas:'copy'_'card'_'form'] sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:pt-28 lg:pb-20 lg:[grid-template-areas:'copy_card'_'form_card'] xl:gap-x-20">
        <HeroCopy />
        <div className="flex justify-center [grid-area:card] lg:self-center">
          <Envelope sectionRef={sectionRef} />
        </div>
        <PersonalizeForm />
      </div>
    </section>
  );
}

function HeroCopy() {
  return (
    <div className="text-center [grid-area:copy] lg:self-end lg:text-left">
      <div className="flex items-center justify-center gap-3 lg:justify-start">
        <Image
          src="/brand/isologo.png"
          alt=""
          width={851}
          height={693}
          sizes="48px"
          className="h-mark-light h-auto w-9 opacity-90 lg:w-11"
        />
        <span className="text-[11px] tracking-[0.3em] text-white/80 uppercase">Bodas y XV años</span>
      </div>
      <h1
        id="inicio-titulo"
        className="h-display mx-auto mt-5 mb-0 max-w-[14ch] text-[clamp(2.25rem,9.4vw,4.6rem)] text-balance lg:mx-0 lg:mt-6"
      >
        Invitaciones que ya llevan tu nombre
      </h1>
      <p className="mx-auto mt-4 mb-0 max-w-[38ch] text-[15px] leading-relaxed text-white/80 lg:mx-0 lg:mt-6 lg:text-[17px]">
        Cada familia confirma desde su propio enlace y tú ves quién va. Escribe tus nombres y mírala
        ya.
      </p>
    </div>
  );
}

/** El formulario: qué celebran, sus nombres y la fecha. Todo se ve al instante en la tarjeta. */
function PersonalizeForm() {
  const { kind, names, date, setKind, setNames, setDate } = useCouple();
  const id = useId();

  return (
    <div className="mx-auto w-full max-w-md [grid-area:form] lg:mx-0 lg:self-start">
      <form
        aria-label="Personaliza tu invitación"
        onSubmit={(event) => event.preventDefault()}
        className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur-md sm:p-5"
      >
        <div role="group" aria-label="Celebración" className="grid grid-cols-2 gap-1 rounded-full bg-black/25 p-1">
          {KINDS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={kind === key}
              onClick={() => setKind(key)}
              className={clsx(
                'min-h-10 rounded-full text-center text-[12px] tracking-[0.16em] uppercase transition-colors duration-300',
                kind === key ? 'bg-(--h-gold) text-(--h-wine)' : 'text-white/85 hover:text-white',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1.4fr_1fr]">
          <label htmlFor={`${id}-names`} className="block">
            <span className="text-[11px] tracking-[0.2em] text-white/75 uppercase">
              {kind === 'boda' ? 'Sus nombres' : 'Tu nombre'}
            </span>
            <input
              id={`${id}-names`}
              type="text"
              value={names}
              onChange={(event) => setNames(event.target.value)}
              placeholder={EXAMPLE_NAMES[kind]}
              autoComplete="off"
              maxLength={32}
              className="hl-input mt-1 h-12 w-full rounded-xl border-0 bg-white/95 px-4 text-[16px] text-(--h-ink) placeholder:text-(--h-muted)/70"
            />
          </label>
          <label htmlFor={`${id}-date`} className="block">
            <span className="text-[11px] tracking-[0.2em] text-white/75 uppercase">La fecha</span>
            <input
              id={`${id}-date`}
              type="date"
              value={date}
              onChange={(event) => event.target.value && setDate(event.target.value)}
              className="hl-input mt-1 h-12 w-full rounded-xl border-0 bg-white/95 px-4 text-[16px] text-(--h-ink)"
            />
          </label>
        </div>
      </form>

      <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <Link href="/cotizar" className="h-button h-button--gold">
          Quiero la mía
        </Link>
        <a href="#plantillas" className="h-button h-button--ghost text-white">
          Ver plantillas
        </a>
      </div>
    </div>
  );
}

/**
 * El sobre. La línea de tiempo va de «cerrado» a «abierto»: solapa que gira, tarjeta que sube y
 * tarjeta al frente. Tocarlo la rebobina deprisa y la vuelve a tocar.
 */
function Envelope({ sectionRef }: { readonly sectionRef: React.RefObject<HTMLElement | null> }) {
  const { kind, displayNames, date } = useCouple();
  const tiltRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const flap = flapRef.current;
    const flip = flipRef.current;
    const clip = clipRef.current;
    const card = cardRef.current;
    const tilt = tiltRef.current;
    const shadow = shadowRef.current;
    const section = sectionRef.current;
    if (!flap || !flip || !clip || !card || !tilt || !shadow || !section) return;

    const media = gsap.matchMedia();
    media.add(
      {
        motion: '(prefers-reduced-motion: no-preference)',
        fine: '(hover: hover) and (pointer: fine) and (min-width: 1024px)',
      },
      (context) => {
        const { motion, fine } = context.conditions as { motion: boolean; fine: boolean };

        /* `y: 0` explícito: así GSAP no hereda una traslación en píxeles y solo cuenta el
           porcentaje, que escala con el sobre. */
        gsap.set(flip, { rotationX: 0 });
        gsap.set(flap, { zIndex: 4 });
        gsap.set(clip, { zIndex: 2 });
        gsap.set(card, { y: 0, yPercent: 57, scale: 1 });

        const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.inOut' } });
        tl.to(flip, { rotationX: 180, duration: 0.75 })
          .set(flap, { zIndex: 0 }, 0.38)
          .to(card, { yPercent: -14, duration: 0.85, ease: 'power3.out' }, 0.55)
          .set(clip, { zIndex: 5 }, 1.25)
          .to(card, { yPercent: 0, scale: 1.02, duration: 0.6, ease: 'power2.out' }, 1.25)
          .to(card, { scale: 1, duration: 0.5, ease: 'power2.inOut' }, 1.75);
        timeline.current = tl;

        if (!motion) {
          tl.progress(1);
          return () => {
            timeline.current = null;
          };
        }

        const start = gsap.delayedCall(0.7, () => tl.play());
        const float = gsap.to(tilt, { y: -8, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });

        let cleanupPointer = () => {};
        if (fine) {
          gsap.set(tilt, { transformPerspective: 1200 });
          const rotX = gsap.quickTo(tilt, 'rotationX', { duration: 0.8, ease: 'power3.out' });
          const rotY = gsap.quickTo(tilt, 'rotationY', { duration: 0.8, ease: 'power3.out' });
          const shadowX = gsap.quickTo(shadow, 'x', { duration: 0.8, ease: 'power3.out' });
          const shadowScale = gsap.quickTo(shadow, 'scaleX', { duration: 0.8, ease: 'power3.out' });
          const onMove = (event: PointerEvent) => {
            const box = tilt.getBoundingClientRect();
            const dx = Math.max(-1, Math.min(1, (event.clientX - (box.left + box.width / 2)) / (window.innerWidth / 2)));
            const dy = Math.max(-1, Math.min(1, (event.clientY - (box.top + box.height / 2)) / (window.innerHeight / 2)));
            rotY(dx * 14);
            rotX(-dy * 10);
            shadowX(-dx * 26);
            shadowScale(1 - Math.abs(dx) * 0.12);
          };
          const onLeave = () => {
            rotX(0);
            rotY(0);
            shadowX(0);
            shadowScale(1);
          };
          section.addEventListener('pointermove', onMove);
          section.addEventListener('pointerleave', onLeave);
          cleanupPointer = () => {
            section.removeEventListener('pointermove', onMove);
            section.removeEventListener('pointerleave', onLeave);
          };
        }

        return () => {
          start.kill();
          float.kill();
          cleanupPointer();
          timeline.current = null;
        };
      },
    );

    return () => media.revert();
  }, [sectionRef]);

  const replay = () => {
    const tl = timeline.current;
    if (!tl || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (tl.progress() === 0 || tl.isActive()) {
      tl.timeScale(1).play();
      return;
    }
    tl.eventCallback('onReverseComplete', () => {
      tl.eventCallback('onReverseComplete', null);
      tl.timeScale(1).play();
    });
    tl.timeScale(2.6).reverse();
  };

  const label = kind === 'boda' ? 'Nos casamos' : 'Mis XV años';

  return (
    <div className="flex flex-col items-center">
      <div ref={tiltRef} className="relative will-change-transform">
        <div className="hl-stage">
          <div className="hl-envelope">
            <div className="hl-back" />
          </div>

          <div ref={clipRef} className="hl-card-clip">
            <div ref={cardRef} className="hl-card flex flex-col items-center justify-between px-[9%] py-[10%] text-center">
              <Image
                src="/brand/isologo.png"
                alt=""
                width={851}
                height={693}
                sizes="48px"
                className="h-auto w-[13%] opacity-90"
              />
              <span className="hl-card-small tracking-[0.32em] text-(--h-gold-deep) uppercase">{label}</span>
              <span
                data-long={displayNames.length > 14}
                className="hl-card-names h-script block w-full text-balance break-words text-(--h-wine)"
              >
                {displayNames}
              </span>
              <span className="hl-card-date block text-(--h-muted) first-letter:uppercase">
                {date ? formatLongDate(date) : ' '}
              </span>
              <Countdown date={date} />
              <span className="hl-card-small rounded-full bg-(--h-wine) px-[1.4em] py-[0.7em] tracking-[0.2em] text-(--h-wine-ink) uppercase">
                Confirmar asistencia
              </span>
            </div>
          </div>

          <div className="hl-envelope z-3">
            <div className="hl-pocket" />
          </div>
          {/* El `z-index` va en esta envoltura y no en la solapa: es ella la que compite con la
              tarjeta. Abierta, baja a 0 y queda detrás. */}
          <div ref={flapRef} className="hl-envelope z-4" style={{ transformStyle: 'preserve-3d' }}>
            <div ref={flipRef} className="hl-flap">
              <div className="hl-flap-face hl-flap-face--out" />
              <div className="hl-flap-face hl-flap-face--in" />
              <div className="hl-seal">
                <Image
                  src="/brand/isologo.png"
                  alt=""
                  width={851}
                  height={693}
                  sizes="40px"
                  className="h-mark-cream h-auto w-[58%] opacity-90"
                />
              </div>
            </div>
          </div>

          {/* Todo el sobre es el botón de volver a abrir: una capa transparente encima, porque un
              `<button>` no puede contener los bloques de la tarjeta. */}
          <button
            type="button"
            onClick={replay}
            aria-label={`Abrir otra vez la invitación de ${displayNames}`}
            className="absolute inset-0 z-10 cursor-pointer rounded-md"
          />
        </div>
        <div ref={shadowRef} aria-hidden className="hl-shadow" />
      </div>
      <p className="mt-9 mb-0 text-[12px] tracking-[0.18em] text-white/65 uppercase">Toca el sobre para abrirlo</p>
    </div>
  );
}

/**
 * La cuenta regresiva hasta la fecha. Solo se pinta después de montar: la hora del servidor y la
 * del teléfono no coinciden, y un número distinto en cada lado rompería la hidratación.
 */
function Countdown({ date }: { readonly date: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const [y, m, d] = date.split('-').map(Number);
  const target = y && m && d ? new Date(y, m - 1, d).getTime() : null;
  const left = now !== null && target !== null ? Math.max(0, target - now) : null;
  const parts =
    left === null
      ? null
      : [
          [Math.floor(left / 86_400_000), 'días'],
          [Math.floor(left / 3_600_000) % 24, 'horas'],
          [Math.floor(left / 60_000) % 60, 'min'],
          [Math.floor(left / 1000) % 60, 'seg'],
        ];

  return (
    <span className="grid w-full grid-cols-4 gap-1" aria-hidden={parts === null}>
      {(parts ?? [[0, 'días'], [0, 'horas'], [0, 'min'], [0, 'seg']]).map(([value, unit]) => (
        <span key={unit} className="flex flex-col items-center">
          <span
            className={clsx(
              'hl-card-count h-display tabular-nums text-(--h-wine) transition-opacity',
              parts === null && 'opacity-0',
            )}
          >
            {String(value).padStart(2, '0')}
          </span>
          <span className="hl-card-small tracking-[0.16em] text-(--h-muted) uppercase">{unit}</span>
        </span>
      ))}
    </span>
  );
}
