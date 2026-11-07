'use client';

import { type CSSProperties, type ReactNode, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * El parallax de `mirador`: una sección cuyo fondo avanza más despacio que su contenido.
 *
 * ## Cómo se mueve
 *
 * `ParallaxScene` mide en cada fotograma de desplazamiento dónde está su sección respecto al
 * centro de la pantalla y lo deja en dos variables CSS:
 *
 * - `--inv-px`: el avance, de `1` (la sección asoma por abajo) a `-1` (se va por arriba), con `0`
 *   cuando está centrada.
 * - `--inv-px-h`: el alto de la sección en píxeles, sin unidad.
 *
 * Cada `ParallaxLayer` las convierte en un `translate3d` con su propia `depth`. Una profundidad
 * positiva se queda atrás —el fondo, que es lo que hace la referencia con la foto— y una negativa
 * se adelanta, para los adornos que flotan por delante. Solo se anima `transform`, así que el
 * navegador lo resuelve en la GPU y no recalcula el diseño al desplazarse.
 *
 * ## Por qué no `background-attachment: fixed` ni framer-motion
 *
 * `fixed` no funciona en Safari de iPhone, que es donde se abre la mayoría de las invitaciones.
 * Y `useScroll` de framer-motion escucha la ventana: dentro de la vista previa del panel, que se
 * desplaza por su cuenta, el fondo se quedaría quieto (le pasa a `gallery.parallax`). Aquí se
 * busca el contenedor que de verdad se desplaza, sea la ventana o el marco del teléfono.
 *
 * ## Movimiento reducido
 *
 * Con `prefers-reduced-motion` no se escucha el desplazamiento: `--inv-px` se queda en `0` y las
 * capas en su sitio. La composición está pensada para leerse igual quieta.
 */

/** El ancestro que se desplaza, o `null` si es la ventana. */
function findScroller(node: HTMLElement): HTMLElement | null {
  let current = node.parentElement;
  while (current && current !== document.body) {
    const { overflowY } = getComputedStyle(current);
    if (/(auto|scroll|overlay)/.test(overflowY) && current.scrollHeight > current.clientHeight) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

export function ParallaxScene({
  as: Tag = 'section',
  block,
  variant,
  className,
  style,
  children,
  ...rest
}: {
  readonly as?: 'section' | 'div' | 'footer';
  readonly block?: string;
  readonly variant?: string;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children: ReactNode;
  readonly 'aria-label'?: string;
  readonly 'aria-labelledby'?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const scroller = findScroller(node);
    const target: HTMLElement | Window = scroller ?? window;
    let frame = 0;
    let visible = false;

    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const viewport = scroller
        ? scroller.getBoundingClientRect()
        : { top: 0, height: window.innerHeight };
      const offset = rect.top + rect.height / 2 - (viewport.top + viewport.height / 2);
      const span = (viewport.height + rect.height) / 2 || 1;
      const progress = Math.max(-1, Math.min(1, offset / span));
      node.style.setProperty('--inv-px', progress.toFixed(4));
      node.style.setProperty('--inv-px-h', String(Math.round(rect.height)));
    };

    const schedule = () => {
      if (!visible || frame) return;
      frame = requestAnimationFrame(update);
    };

    /* Solo se mide mientras la sección está cerca de la pantalla: con catorce secciones en la
       página, las que están lejos no gastan nada al desplazarse. */
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
        if (visible) schedule();
      },
      { root: scroller, rootMargin: '25% 0px' },
    );
    observer.observe(node);

    update();
    target.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      observer.disconnect();
      target.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <Tag
      ref={ref as never}
      data-block={block}
      data-variant={variant}
      className={twMerge(clsx('relative isolate w-full overflow-hidden', className))}
      style={{ ['--inv-px' as string]: 0, ['--inv-px-h' as string]: 0, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Una capa que se desplaza a su propia velocidad dentro de la escena.
 *
 * `depth` es la fracción del alto de la sección que la capa recorre de una punta a otra: `0.2`
 * para un fondo que casi se queda quieto, `-0.15` para un adorno que se adelanta. Con `fill`, la
 * capa cubre la sección y se estira por arriba y por abajo justo lo que va a recorrer, para que
 * nunca asome un borde vacío.
 */
export function ParallaxLayer({
  depth,
  fill = false,
  className,
  style,
  children,
}: {
  readonly depth: number;
  readonly fill?: boolean;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
}) {
  const travel = `calc(var(--inv-px-h) * ${Math.abs(depth)} * 1px)`;

  return (
    <div
      aria-hidden={fill ? true : undefined}
      className={twMerge(
        clsx(fill ? 'pointer-events-none absolute inset-x-0' : 'relative', 'will-change-transform', className),
      )}
      style={{
        transform: `translate3d(0, calc(var(--inv-px) * var(--inv-px-h) * ${-depth} * 1px), 0)`,
        ...(fill ? { top: `calc(${travel} * -1)`, bottom: `calc(${travel} * -1)` } : null),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Lo que se va desvaneciendo a medida que la sección sale por arriba: el título de la portada,
 * como en la referencia. `rate` dice qué tan pronto: con `1.6` ya no se ve a media salida.
 */
export function ParallaxFade({
  rate = 1.6,
  className,
  children,
}: {
  readonly rate?: number;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <div className={className} style={{ opacity: `calc(1 - max(0, var(--inv-px) * -${rate}))` }}>
      {children}
    </div>
  );
}
