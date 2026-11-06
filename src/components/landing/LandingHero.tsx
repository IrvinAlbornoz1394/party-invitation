'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLayoutEffect, useRef, useState } from 'react';

export interface HeroFrame {
  readonly key: string;
  readonly name: string;
  readonly eventTypes: string;
  readonly href: string;
  readonly image: { readonly url: string; readonly alt: string };
}

/** Lo que asoma del marco anterior y del siguiente, y el hueco entre marcos. */
const SLIVER = 60;
const GAP = 24;

/**
 * La portada: una frase partida en dos por un marco.
 *
 * «Tu invitación» a la izquierda, «sabe quién va» a la derecha y, entre las dos, el marco por el
 * que pasan las portadas de las plantillas de verdad. La frase dice las dos mitades del producto
 * —el diseño y la cuenta— y el marco enseña la primera mientras se lee la segunda.
 *
 * ## El carrete
 *
 * El escenario se queda fijo mientras la sección se desplaza y el carrete avanza una plantilla por
 * cada tramo de scroll. Del marco anterior y del siguiente asoman 60 px, para que se lea como una
 * tira que atraviesa la frase y no como una foto suelta.
 *
 * El avance se calcula en píxeles a partir de la altura real del marco (medida con un
 * `ResizeObserver`), porque el marco es 16:9 sobre un ancho en `vw` y su altura cambia con cada
 * ventana. Con movimiento reducido no hay carrete: se queda la primera portada.
 *
 * ## En el teléfono
 *
 * Las dos mitades se apilan, con el marco entre ellas a todo el ancho y en 4:3. Es la misma frase
 * y el mismo carrete; solo cambia la disposición.
 */
export function LandingHero({ frames }: { readonly frames: readonly HeroFrame[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLSpanElement>(null);
  const [frameHeight, setFrameHeight] = useState(0);
  const reduce = useReducedMotion();
  /* Lo que asoma de los vecinos: 60 px en escritorio, 28 px en el teléfono. */
  const [sliver, setSliver] = useState(SLIVER);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => {
      setFrameHeight(entry.contentRect.height);
      setSliver(window.innerWidth >= 1024 ? SLIVER : 28);
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const steps = Math.max(frames.length - 1, 0);
  const travel = steps * (frameHeight + GAP);
  const y = useTransform(scrollYProgress, [0.04, 0.96], [0, reduce ? 0 : -travel]);

  return (
    <section
      ref={sectionRef}
      id="contenido"
      aria-labelledby="portada-titulo"
      /* El recorrido del carrete: media pantalla de scroll por portada en el teléfono y algo más en
         escritorio, donde el escenario es más ancho y el avance se lee mejor despacio. */
      className="relative h-[calc(100svh+var(--steps)*30svh)] lg:h-[calc(100svh+var(--steps)*55svh)]"
      style={{ ['--steps' as string]: reduce ? 0 : steps }}
    >
      <div className="sticky top-0 flex h-svh flex-col overflow-hidden">
        <header className="relative z-20 flex items-center justify-between gap-6 px-5 pt-6 sm:px-8 sm:pt-7">
          <Link href="/" aria-label="MiEvento, inicio" className="transition-opacity hover:opacity-75">
            <Image
              src="/brand/logo.png"
              alt="MiEvento"
              width={2022}
              height={487}
              priority
              sizes="200px"
              className="h-9 w-auto sm:h-11"
            />
          </Link>

          <nav aria-label="Principal" className="flex items-center gap-5 text-[15px] sm:gap-7">
            <a href="#plantillas" className="hidden text-(--l-ink) underline-offset-4 hover:underline md:inline">
              Plantillas
            </a>
            <a href="#panel" className="hidden text-(--l-ink) underline-offset-4 hover:underline md:inline">
              El panel
            </a>
            <a href="#planes" className="hidden text-(--l-ink) underline-offset-4 hover:underline md:inline">
              Planes
            </a>
            <Link href="/panel" className="text-(--l-ink) underline-offset-4 hover:underline">
              Entrar
            </Link>
            <Link href="/cotizar" className="l-button l-button--accent min-h-10 px-4">
              Cotizar
            </Link>
          </nav>
        </header>

        {/*
          El escenario. El titular ES la retícula: en escritorio, la primera mitad pegada al margen
          izquierdo, el marco en las columnas centrales y la segunda mitad pegada al derecho, las
          tres sobre la línea central. En el teléfono, las tres piezas apiladas.
        */}
        <div className="relative flex flex-1 flex-col justify-center px-5 sm:px-8">
          <h1
            id="portada-titulo"
            className="l-display m-0 flex flex-col text-[clamp(2.5rem,9vw,3.75rem)] lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-6 lg:text-[clamp(2.5rem,3.6vw,3.75rem)]"
          >
            <span data-reveal className="block lg:col-span-4">
              Tu invitación
            </span>

            {/*
              El marco va DENTRO del titular en el orden del DOM porque es donde se lee: la frase
              lo atraviesa. Va oculto a los lectores de pantalla, que leen la frase seguida.
            */}
            <span
              aria-hidden="true"
              className="relative mx-auto my-3 block w-full max-w-[30rem] lg:col-span-4 lg:my-0 lg:max-w-none"
              style={{ height: frameHeight ? frameHeight + 2 * (sliver + GAP) : undefined }}
            >
              <span className="absolute inset-0 overflow-hidden">
                <motion.span
                  className="absolute inset-x-0 flex flex-col"
                  style={{ y, top: frameHeight ? sliver + GAP - (frameHeight + GAP) : 0, gap: GAP }}
                >
                  {/* El carrete da la vuelta: arriba asoma la última portada y abajo, al final,
                      vuelve a asomar la primera. Así nunca hay un marco vacío en la tira. */}
                  {[frames.at(-1), ...frames, frames[0]].map((frame, index) =>
                    frame ? (
                      <ReelFrame
                        key={`${frame.key}-${index}`}
                        frame={frame}
                        priority={index === 1}
                        frameRef={index === 1 ? frameRef : undefined}
                      />
                    ) : null,
                  )}
                </motion.span>
              </span>
            </span>

            <span
              data-reveal
              className="block text-right lg:col-span-4"
              style={{ ['--d' as string]: '120ms' }}
            >
              sabe quién va
            </span>
          </h1>
        </div>

        <div
          data-reveal
          className="relative z-10 grid gap-5 px-5 pb-8 sm:px-8 sm:pb-8 lg:grid-cols-12 lg:gap-x-6"
          style={{ ['--d' as string]: '220ms' }}
        >
          <p className="m-0 max-w-[34ch] text-(length:--step-body) leading-normal text-(--l-ink) lg:col-span-4">
            Invitaciones digitales para bodas y XV años. Cada familia confirma desde su propio
            enlace y tú ves la cuenta en tu panel.
          </p>
          <div className="flex items-end lg:col-span-4 lg:col-start-9 lg:justify-end">
            <a href="#plantillas" className="l-link text-(--l-ink)">
              Ver las plantillas
              <ArrowRight aria-hidden="true" size={16} strokeWidth={1.75} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReelFrame({
  frame,
  priority,
  frameRef,
}: {
  readonly frame: HeroFrame;
  readonly priority: boolean;
  readonly frameRef?: React.Ref<HTMLSpanElement>;
}) {
  return (
    <span
      ref={frameRef}
      className="relative block aspect-[4/3] w-full overflow-hidden rounded-[4px] bg-(--l-surface) lg:aspect-[16/11]"
    >
      <Image
        src={frame.image.url}
        alt=""
        fill
        priority={priority}
        sizes="(min-width: 1024px) 34vw, 92vw"
        className="l-drift object-cover"
      />
      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-[linear-gradient(to_top,rgb(0_0_0/0.62),transparent)] px-4 pt-12 pb-3.5 font-(family-name:--l-text) text-[14px] leading-tight tracking-normal text-white">
        <span className="font-medium">{frame.name}</span>
        <span className="text-white/85">{frame.eventTypes}</span>
      </span>
    </span>
  );
}
