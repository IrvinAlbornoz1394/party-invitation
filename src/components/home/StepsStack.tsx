'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { useRef } from 'react';
import type { HomeImage } from './types';

const STEPS = [
  {
    title: 'Nos cuentas de tu evento',
    body: 'Eliges una plantilla, nos pasas los datos y las fotos, y te devolvemos la invitación armada para que la revises antes de publicarla.',
  },
  {
    title: 'Cada familia recibe su enlace',
    body: 'Cada invitación lleva el código de su familia. Se lo mandas por WhatsApp y la abren en el navegador del teléfono, sin descargar nada.',
  },
  {
    title: 'Confirman y tú lo ves',
    body: 'En Esencial y Plus confirman por WhatsApp con el mensaje ya escrito para ti. En Premium confirman en la misma invitación y la respuesta llega a tu panel.',
  },
] as const;

/** Lo que se encoge cada tarjeta por cada una que se le apila encima. */
const SHRINK = 0.06;

/**
 * Así funciona: los tres pasos como tarjetas que se apilan al bajar.
 *
 * Cada tarjeta vive en un hueco de una pantalla de alto y se queda pegada (`sticky`) un poco más
 * abajo que la anterior, así que al llegar la siguiente la de atrás asoma por arriba, se encoge y se
 * apaga. El encogimiento sale del avance del scroll por toda la pila (`useScroll`), no de un
 * temporizador: si la visitante se detiene, la pila se detiene.
 *
 * En el teléfono la foto va arriba y el texto abajo, y la tarjeta cabe en la pantalla descontando
 * la cabecera; en escritorio, foto y texto lado a lado. Con movimiento reducido no se encogen: se
 * apilan quietas.
 */
export function StepsStack({ photos }: { readonly photos: readonly HomeImage[] }) {
  const stack = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion() === true;
  const { scrollYProgress } = useScroll({ target: stack, offset: ['start start', 'end end'] });

  return (
    <section id="como-funciona" aria-labelledby="como-funciona-titulo" className="bg-(--h-paper-2) pt-20 sm:pt-28">
      <header data-reveal className="px-5 text-center">
        <span className="h-eyebrow">Paso a paso</span>
        <h2 id="como-funciona-titulo" className="h-heading mx-auto mt-5 mb-0 max-w-[18ch]">
          Así funciona
        </h2>
        <p className="mx-auto mt-5 mb-0 max-w-md text-(--h-muted)">
          Tres pasos, de la plantilla a la cuenta de quién va.
        </p>
      </header>

      <ol ref={stack} className="m-0 list-none p-0 pb-[8vh]">
        {STEPS.map((step, index) => (
          <StepCard
            key={step.title}
            index={index}
            step={step}
            photo={photos[index]}
            progress={scrollYProgress}
            reduced={reduced}
          />
        ))}
      </ol>

      <div className="flex justify-center px-5 pb-20 sm:pb-28">
        <Link href="/cotizar" className="h-button h-button--wine">
          Empezar con mi evento
        </Link>
      </div>
    </section>
  );
}

function StepCard({
  index,
  step,
  photo,
  progress,
  reduced,
}: {
  readonly index: number;
  readonly step: (typeof STEPS)[number];
  readonly photo: HomeImage | undefined;
  readonly progress: MotionValue<number>;
  readonly reduced: boolean;
}) {
  const total = STEPS.length;
  /* Desde que esta tarjeta llega arriba hasta el final de la pila, se encoge una vez por cada
     tarjeta que le cae encima; la última no se encoge. */
  const start = index / total;
  const target = 1 - (total - 1 - index) * SHRINK;
  const scale = useTransform(progress, [start, 1], [1, reduced ? 1 : target]);
  const dim = useTransform(progress, [start, 1], [0, reduced ? 0 : (total - 1 - index) * 0.12]);

  return (
    <li
      className="sticky top-0 flex h-svh items-start justify-center px-4 pt-[calc(5.5rem+var(--offset))] sm:px-8"
      style={{ ['--offset' as string]: `${index * 1.1}rem` }}
    >
      <motion.article
        style={{ scale, transformOrigin: '50% 0%' }}
        className="relative grid max-h-[calc(100svh-7.5rem)] w-full max-w-5xl overflow-hidden rounded-[22px] bg-(--h-white) shadow-[0_-10px_40px_-24px_rgba(43,26,32,0.45),0_30px_70px_-40px_rgba(43,26,32,0.55)] md:grid-cols-[1.05fr_1fr]"
      >
        <div className="relative aspect-[16/10] min-h-0 md:order-2 md:aspect-auto md:min-h-[26rem]">
          {photo && (
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              sizes="(min-width: 768px) 480px, 92vw"
              className="object-cover"
            />
          )}
          <span className="absolute top-4 left-4 rounded-full bg-(--h-white)/90 px-3 py-1 text-[11px] tracking-[0.22em] text-(--h-wine) uppercase backdrop-blur-sm">
            Paso {index + 1} de {total}
          </span>
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-8 md:p-12">
          <span aria-hidden="true" className="h-display block text-[3.4rem] leading-none text-(--h-gold) md:text-[5rem]">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className="h-display mt-3 mb-0 text-[clamp(1.55rem,5.5vw,2.5rem)] leading-tight text-(--h-wine)">
            {step.title}
          </h3>
          <p className="mt-3 mb-0 max-w-[42ch] text-[15px] text-(--h-muted) md:mt-5 md:text-base">{step.body}</p>
        </div>

        {/* Se apaga al quedar debajo de la siguiente. */}
        <motion.div
          aria-hidden="true"
          style={{ opacity: dim }}
          className="pointer-events-none absolute inset-0 bg-(--h-wine)"
        />
      </motion.article>
    </li>
  );
}
