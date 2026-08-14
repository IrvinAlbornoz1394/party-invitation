'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  wrap,
  type PanInfo,
} from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { aspectRatioOf, type GalleryItem } from '@/domain/invitation/blocks/gallery';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { Lightbox } from '../../shared/Lightbox';
import { useLightbox } from '../../shared/useLightbox';
import { PhotoButton, type GalleryVariantProps } from './gallery-parts';

/**
 * `gallery.carousel` — una pasarela de fotografías que cruza la pantalla sin parar.
 *
 * Las fotos avanzan en fila, de derecha a izquierda, ocupando todo el ancho del dispositivo.
 * No hay pasos ni posiciones: es un movimiento continuo, y **no termina nunca** — detrás de la
 * última viene otra vez la primera, sin corte ni salto. Se puede arrastrar con el dedo o con el
 * ratón para adelantarlas o retrocederlas, y al soltar sigue sola con la inercia del gesto.
 *
 * ## Cómo es infinita sin trampa
 *
 * La fila se pinta **dos veces**, una detrás de otra, y lo que se desplaza es la tira entera.
 * Cuando el recorrido llega justo al ancho de una copia, la posición vuelve a cero: como la
 * segunda copia es idéntica a la primera y está exactamente donde estaba aquella, el salto cae
 * en un fotograma en el que la pantalla enseña exactamente lo mismo. No hay corte que disimular
 * porque no hay corte.
 *
 * El ancho de la copia se **mide**, no se calcula: las fotos tienen proporciones distintas, así
 * que la tira no mide lo mismo en un móvil que en un monitor, ni antes que después de que
 * carguen las imágenes. Un `ResizeObserver` lo mantiene al día, y por eso el bucle sigue siendo
 * exacto al girar el teléfono.
 *
 * ## El movimiento
 *
 * Va por `requestAnimationFrame` sobre un valor de movimiento, no con una animación de CSS de
 * duración fija. Es lo que permite que el arrastre y el avance automático sean **lo mismo**: los
 * dos suman al mismo desplazamiento. Con una animación declarada, arrastrar obligaría a
 * pausarla, calcular dónde se quedó y relanzarla desde ahí — que es de donde salen los tirones.
 *
 * Se detiene al pasar el ratón por encima, al enfocar con el teclado, mientras se arrastra y
 * con una foto ampliada abierta. Con `prefers-reduced-motion` no avanza sola: quedan el
 * arrastre y las flechas.
 *
 * ## Por qué ya no hay contador
 *
 * Porque no hay una foto «actual». En un carrusel de pasos tiene sentido decir «03 / 06»; en una
 * pasarela continua, cualquier número sería mentira la mitad del tiempo. Las flechas tampoco
 * saltan de foto en foto: **empujan** la tira, como se empuja algo que ya está rodando.
 */

/** Velocidad de crucero, en píxeles por segundo. Un paseo, no un pase de diapositivas. */
const SPEED = 42;

/** El empujón de las flechas. En píxeles por segundo, se apaga solo con el rozamiento. */
const NUDGE = 1100;

/** Cuánto conserva la inercia en cada fotograma. Más alto, más se desliza al soltar. */
const FRICTION = 0.94;

export function GalleryCarousel({ content }: GalleryVariantProps) {
  const items = content.items;
  const lightbox = useLightbox(items.length);
  const reduced = useReducedMotion();

  const x = useMotionValue(0);
  const copyRef = useRef<HTMLDivElement>(null);
  const copyWidth = useRef(0);
  const paused = useRef(false);
  const velocity = useRef(0);
  /** Si el gesto en curso fue un arrastre. Evita que soltar sobre una foto la amplíe. */
  const dragged = useRef(false);

  /*
   * Con una foto ampliada, la pasarela se queda quieta: al cerrar el visor, lo que hay detrás
   * tiene que seguir donde se dejó. Es un `ref` y no estado porque quien lo consulta es el bucle
   * de fotogramas, sesenta veces por segundo, y no el render.
   */
  const lightboxOpen = lightbox.index !== null;

  useEffect(() => {
    paused.current = lightboxOpen;
  }, [lightboxOpen]);

  /*
   * El ancho de una copia se observa en vez de leerse una vez: las imágenes llegan después del
   * primer render y ensanchan la tira, y girar el teléfono la cambia entera. Medido una sola
   * vez, el bucle daría un salto visible en cuanto cualquiera de las dos cosas pasara.
   */
  useEffect(() => {
    const element = copyRef.current;

    if (!element) return;

    const observer = new ResizeObserver(() => {
      copyWidth.current = element.offsetWidth;
    });

    observer.observe(element);
    copyWidth.current = element.offsetWidth;

    return () => observer.disconnect();
  }, []);

  useAnimationFrame((_timestamp, delta) => {
    const width = copyWidth.current;

    if (!width) return;

    // `delta` en milisegundos: se convierte a segundos para que la velocidad sea la misma en una
    // pantalla de 60Hz y en una de 120Hz.
    const seconds = delta / 1000;
    let movement = 0;

    if (!paused.current && !reduced) movement -= SPEED * seconds;

    if (velocity.current !== 0) {
      movement += velocity.current * seconds;
      velocity.current *= FRICTION;

      // Por debajo de este umbral el deslizamiento ya no se ve y solo gasta fotogramas.
      if (Math.abs(velocity.current) < 6) velocity.current = 0;
    }

    if (movement !== 0) x.set(wrap(-width, 0, x.get() + movement));
  });

  const nudge = useCallback((direction: number) => {
    velocity.current = direction * NUDGE;
  }, []);

  const onPan = (_event: unknown, info: PanInfo) => {
    const width = copyWidth.current;

    if (!width) return;

    if (Math.abs(info.offset.x) > 4) dragged.current = true;

    x.set(wrap(-width, 0, x.get() + info.delta.x));
  };

  const onPanEnd = (_event: unknown, info: PanInfo) => {
    paused.current = false;
    /* La mitad de la velocidad del gesto: soltar con el dedo a toda prisa mandaría la tira
       disparada, y el gesto se siente igual de vivo con la mitad. */
    velocity.current = info.velocity.x * 0.5;
  };

  const openPhoto = (index: number) => {
    // Al soltar un arrastre encima de una foto, el navegador manda un clic. Sin esta guarda,
    // recorrer la pasarela con el dedo acabaría abriendo una foto cada vez.
    if (dragged.current) {
      dragged.current = false;

      return;
    }

    lightbox.open(index);
  };

  return (
    <BlockSection block="gallery" variant="carousel">
      <BlockContainer>
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
        />
      </BlockContainer>

      {/*
        Fuera del contenedor y a todo el ancho: una pasarela con márgenes a los lados no es una
        pasarela, es una caja con fotos dentro. `overflow-hidden` recorta por los cantos de la
        pantalla, que es justo donde deben aparecer y desaparecer.
      */}
      <div
        className="mt-12 w-full overflow-hidden"
        onPointerEnter={() => {
          paused.current = true;
        }}
        onPointerLeave={() => {
          paused.current = lightboxOpen;
        }}
        onFocusCapture={() => {
          paused.current = true;
        }}
        onBlurCapture={() => {
          paused.current = lightboxOpen;
        }}
      >
        <motion.div
          className="flex w-max cursor-grab touch-pan-y active:cursor-grabbing"
          style={{ x }}
          onPanStart={() => {
            paused.current = true;
            dragged.current = false;
          }}
          onPan={onPan}
          onPanEnd={onPanEnd}
        >
          {/* La copia medida. La segunda es su reflejo exacto y solo existe para tapar la
              costura del bucle, así que se oculta a los lectores de pantalla. */}
          <div ref={copyRef} className="flex">
            {items.map((item, index) => (
              <RunwayPhoto
                key={index}
                item={item}
                index={index}
                total={items.length}
                onOpen={openPhoto}
              />
            ))}
          </div>

          <div className="flex" aria-hidden="true" inert>
            {items.map((item, index) => (
              <RunwayPhoto
                key={index}
                item={item}
                index={index}
                total={items.length}
                onOpen={openPhoto}
              />
            ))}
          </div>
        </motion.div>
      </div>

      <BlockContainer>
        <div className="mt-8 flex items-center justify-center gap-5">
          <RunwayArrow label="Mover las fotos hacia la derecha" onClick={() => nudge(1)}>
            <ChevronLeft size={20} strokeWidth={1.7} aria-hidden="true" />
          </RunwayArrow>
          <RunwayArrow label="Mover las fotos hacia la izquierda" onClick={() => nudge(-1)}>
            <ChevronRight size={20} strokeWidth={1.7} aria-hidden="true" />
          </RunwayArrow>
        </div>

        {content.note && <BlockNote note={content.note} className="mt-6 text-center" />}
      </BlockContainer>

      <Lightbox
        items={items}
        index={lightbox.index}
        onClose={lightbox.close}
        onMove={lightbox.move}
      />
    </BlockSection>
  );
}

/**
 * Una foto de la pasarela.
 *
 * El alto es fijo y el ancho lo pone la proporción de cada fotografía, no una medida igual para
 * todas. Es lo que hace que la fila se lea como una pasarela y no como una tira de fichas: las
 * verticales pasan estrechas y las apaisadas ocupan más, igual que si estuvieran colgadas.
 *
 * La separación va como margen derecho de cada foto y no como `gap` del contenedor. No es
 * indiferente: el bucle se mide por el ancho de una copia, y con `gap` faltaría justo un hueco
 * entre la última foto de la primera copia y la primera de la segunda — un tirón por vuelta.
 */
function RunwayPhoto({
  item,
  index,
  total,
  onOpen,
}: {
  readonly item: GalleryItem;
  readonly index: number;
  readonly total: number;
  readonly onOpen: (index: number) => void;
}) {
  return (
    <PhotoButton
      item={item}
      index={index}
      total={total}
      onOpen={onOpen}
      className="mr-3 h-[clamp(210px,42vh,420px)] w-auto shrink-0 sm:mr-4"
      style={{ aspectRatio: aspectRatioOf(item, index) }}
      sizes="(min-width: 768px) 40vw, 70vw"
      priority={index < 2}
    />
  );
}

function RunwayArrow({
  label,
  onClick,
  children,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-11 place-items-center rounded-full border border-inv-line text-inv-primary transition-colors hover:bg-inv-primary/5 focus-visible:ring-2 focus-visible:ring-inv-accent focus-visible:outline-none"
    >
      {children}
    </button>
  );
}
