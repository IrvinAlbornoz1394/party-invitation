import type { ReactNode } from 'react';
import clsx from 'clsx';
import type { BlockImage as BlockImageContent } from '@/domain/invitation/blocks/shared';
import { BlockImage } from './BlockImage';
import { hasText } from './has-text';
import { ParallaxLayer } from './Parallax';

/**
 * Las piezas de `mirador`, la plantilla en la que **todos los fondos son parallax**.
 *
 * La invitación alterna dos clases de sección, y las dos se mueven:
 *
 * - **Ventanas**: una fotografía a sangre que avanza más despacio que el texto, con un velo
 *   oscuro y la letra clara encima (`DepthPhoto`).
 * - **Papel**: el marfil del tema con un campo de color difuso al fondo (`DepthWash`) y una palabra
 *   gigante en filete (`DepthWord`) que se desliza a otra velocidad. Son los bloques que no traen
 *   foto —calendario, itinerario, vestimenta— y los que la traen pero no la tienen.
 *
 * Con eso la página nunca está quieta y, aun así, cada sección se lee como una sola capa de
 * texto sobre un fondo que se aleja.
 */

/** Cuánto se queda atrás cada plano. Las mismas tres velocidades en toda la plantilla. */
export const DEPTH = {
  /** La foto de fondo: casi quieta, como una ventana. */
  far: 0.28,
  /** El campo de color del papel. */
  wash: 0.18,
  /** La palabra gigante: se adelanta un poco, y así se cruza con el fondo. */
  word: -0.12,
} as const;

/**
 * Una fotografía a sangre que se queda atrás. Sin foto pinta el campo de color del tema y la
 * sección sigue siendo una ventana, solo que a un cielo.
 *
 * `veil` dice cuánto se oscurece: `deep` para texto largo encima, `soft` para la portada, donde
 * la foto es lo que se viene a ver.
 */
export function DepthPhoto({
  image,
  depth = DEPTH.far,
  veil = 'deep',
  priority = false,
  sizes = '100vw',
}: {
  readonly image: BlockImageContent | null;
  readonly depth?: number;
  readonly veil?: 'soft' | 'deep';
  readonly priority?: boolean;
  readonly sizes?: string;
}) {
  return (
    <>
      <ParallaxLayer depth={depth} fill className="-z-20 bg-inv-ink">
        {image ? (
          <BlockImage image={image} priority={priority} sizes={sizes} />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 70% at 20% 15%, color-mix(in srgb, var(--inv-color-accent) 55%, transparent), transparent 60%), radial-gradient(90% 60% at 85% 90%, color-mix(in srgb, var(--inv-color-primary) 85%, transparent), transparent 70%), var(--inv-color-ink)',
            }}
          />
        )}
      </ParallaxLayer>
      {/* El velo no se mueve: si se moviera con la foto, su borde asomaría al final del recorrido. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            veil === 'deep'
              ? 'linear-gradient(180deg, color-mix(in srgb, var(--inv-color-overlay) 80%, transparent) 0%, var(--inv-color-overlay) 45%, color-mix(in srgb, var(--inv-color-overlay) 92%, #000) 100%)'
              : 'linear-gradient(180deg, color-mix(in srgb, var(--inv-color-overlay) 55%, transparent) 0%, transparent 35%, transparent 55%, var(--inv-color-overlay) 100%)',
        }}
      />
    </>
  );
}

/**
 * El fondo del papel: dos manchas de color difusas del tema que se alejan despacio. Es lo que
 * hace que una sección sin foto también tenga profundidad.
 *
 * `flip` cambia de lado las manchas, para que dos secciones de papel seguidas no repitan fondo.
 */
export function DepthWash({ flip = false }: { readonly flip?: boolean }) {
  const [a, b] = flip ? ['82% 18%', '12% 88%'] : ['14% 12%', '90% 82%'];
  return (
    <ParallaxLayer depth={DEPTH.wash} fill className="-z-20 bg-inv-bg">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(55% 40% at ${a}, color-mix(in srgb, var(--inv-color-accent) 26%, transparent), transparent 70%), radial-gradient(60% 45% at ${b}, color-mix(in srgb, var(--inv-color-primary) 16%, transparent), transparent 72%)`,
        }}
      />
    </ParallaxLayer>
  );
}

/**
 * La palabra gigante en filete que cruza el papel a otra velocidad: «Faltan», «Itinerario», el
 * día del mes. Es decoración —el título de verdad va en `DepthHeading`—, así que no se lee.
 */
export function DepthWord({
  children,
  depth = DEPTH.word,
  className,
  tone = 'paper',
}: {
  readonly children: ReactNode;
  readonly depth?: number;
  readonly className?: string;
  readonly tone?: 'paper' | 'photo';
}) {
  return (
    <div aria-hidden="true" className={clsx('pointer-events-none absolute inset-x-0 -z-10 select-none', className)}>
      <ParallaxLayer depth={depth}>
        <p
          className="m-0 text-center font-inv-display text-[clamp(6rem,30vw,16rem)] leading-[0.85] whitespace-nowrap italic"
          style={{
            color: 'transparent',
            WebkitTextStroke:
              tone === 'photo'
                ? '1px color-mix(in srgb, var(--inv-color-on-photo) 35%, transparent)'
                : '1px color-mix(in srgb, var(--inv-color-primary) 30%, transparent)',
          }}
        >
          {children}
        </p>
      </ParallaxLayer>
    </div>
  );
}

/**
 * El encabezado de cada sección: rótulo espaciado con dos filetes cortos, título en la didona
 * del tema en cursiva grande y subtítulo. `tone="photo"` lo pone en claro sobre una ventana.
 */
export function DepthHeading({
  eyebrow,
  title,
  subtitle,
  tone = 'paper',
  className,
}: {
  readonly eyebrow?: string | null;
  readonly title?: string | null;
  readonly subtitle?: string | null;
  readonly tone?: 'paper' | 'photo';
  readonly className?: string;
}) {
  const onPhoto = tone === 'photo';
  return (
    <header className={clsx('text-center', className)}>
      {hasText(eyebrow) && (
        <p
          className={clsx(
            'm-0 flex items-center justify-center gap-3 text-[11px] tracking-[0.32em] uppercase',
            onPhoto ? 'text-inv-on-photo/85' : 'text-inv-accent',
          )}
        >
          <span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />
          {eyebrow}
          <span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />
        </p>
      )}
      {hasText(title) && (
        <h2
          className={clsx(
            'mx-auto mt-4 mb-0 max-w-[18ch] font-inv-display text-[clamp(2.4rem,9vw,4.25rem)] leading-[1.02] font-normal italic',
            onPhoto ? 'text-inv-on-photo' : 'text-inv-ink',
          )}
        >
          {title}
        </h2>
      )}
      {hasText(subtitle) && (
        <p
          className={clsx(
            'mx-auto mt-5 mb-0 max-w-md text-[16px] leading-relaxed',
            onPhoto ? 'text-inv-on-photo/85' : 'text-inv-ink-soft',
          )}
        >
          {subtitle}
        </p>
      )}
    </header>
  );
}

/**
 * Una tarjeta clara que flota sobre una ventana: datos, formularios, cuentas. Lleva
 * `inv-on-surface` para que el texto no herede la sombra del velo.
 */
export function DepthCard({ children, className }: { readonly children: ReactNode; readonly className?: string }) {
  return (
    <div
      className={clsx(
        'inv-on-surface rounded-inv-lg bg-inv-bg/95 p-7 text-inv-ink shadow-inv-soft sm:p-9',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Un filete vertical que baja de un encabezado al contenido: el «hilo» de la plantilla. */
export function DepthRule({ tone = 'paper', className }: { readonly tone?: 'paper' | 'photo'; readonly className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        'mx-auto block h-14 w-px',
        tone === 'photo' ? 'bg-inv-on-photo/50' : 'bg-inv-accent/60',
        className,
      )}
    />
  );
}
