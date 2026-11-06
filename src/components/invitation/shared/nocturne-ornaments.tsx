import type { CSSProperties, ReactNode } from 'react';
import { useId } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { BlockImage as BlockImageContent } from '@/domain/invitation/blocks/shared';
import { requireDesignAsset, type DesignAsset as DesignAssetData } from '@/lib/design-assets';
import { BlockImage } from './BlockImage';
import { DesignAsset } from './DesignAsset';
import { hasText } from './has-text';
import { WATERCOLOR } from './nocturne-assets';

/**
 * Las piezas que se repiten en las variantes de `nocturne`.
 *
 * La plantilla se define por **un marco**: el hexágono de filete dorado con ramos de acuarela
 * desbordando dos esquinas. Lo demás lo ponen tres gestos de papelería clásica —el florón en
 * frambuesa bajo cada título, el remate barroco arriba y abajo de las tarjetas y los títulos en
 * capitulares romanas (Cinzel)— y las flores, que nunca están del todo quietas.
 *
 * Las flores son láminas de Pierre-Joseph Redouté (dominio público), recortadas para la biblioteca
 * (`wedding/watercolor`). Son `multi`: no se tiñen con el tema, como los florales de `blush`.
 */


const FLOURISH = requireDesignAsset('divider-scroll-001');
const CREST = requireDesignAsset('crest-scroll-001');
const HEART = requireDesignAsset('symbol-heart-doodle-001');
const LEAF = requireDesignAsset('botanical-leaf-large-001');
const BRANCH = requireDesignAsset('botanical-branch-diagonal-001');

type Motion = 'spin' | 'breathe' | 'sway' | 'none';

/**
 * Una flor de acuarela colocada, con su movimiento lento.
 *
 * El movimiento va en el envoltorio y la pieza dentro: `DesignAsset` usa `transform` para girar
 * y reflejar, y una animación sobre el mismo elemento se lo pisaría.
 */
export function FloralSpray({
  asset,
  motion = 'breathe',
  rotate,
  flip,
  className,
  style,
}: {
  readonly asset: DesignAssetData;
  readonly motion?: Motion;
  readonly rotate?: number;
  readonly flip?: 'x' | 'y' | 'both';
  readonly className?: string;
  readonly style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        'pointer-events-none absolute block',
        motion === 'spin' && 'inv-spin-slow',
        motion === 'breathe' && 'inv-breathe',
        motion === 'sway' && 'inv-sway',
        className,
      )}
      style={style}
    >
      <DesignAsset asset={asset} rotate={rotate} flip={flip} className="w-full" />
    </span>
  );
}

/**
 * El marco de la plantilla: la foto recortada en hexágono, un filete dorado desplazado alrededor
 * y dos ramos de acuarela en esquinas opuestas.
 *
 * El hexágono es de punta arriba, con los costados verticales, y el filete no abraza la foto: va
 * corrido hacia fuera, como un paspartú, que es lo que hace que se lea como marco y no como
 * borde. El dorado es un degradado del acento del tema hacia un oro claro, para que tenga brillo
 * de metal sin escribir un color fijo.
 *
 * Sin foto, el hexágono se llena con el celeste del tema y el marco sigue en su sitio: el bloque
 * se configura antes de tener el material y no puede quedarse con un hueco.
 */
export function HexFrame({
  image,
  sizes = '(min-width: 640px) 340px, 78vw',
  priority = false,
  flowers = 'both',
  mirror = false,
  className,
  children,
}: {
  readonly image: BlockImageContent | null;
  readonly sizes?: string;
  readonly priority?: boolean;
  readonly flowers?: 'both' | 'top' | 'none';
  /** Pasa los ramos a las otras dos esquinas, reflejados: dos retratos seguidos se miran. */
  readonly mirror?: boolean;
  readonly className?: string;
  readonly children?: ReactNode;
}) {
  const gradientId = useId();
  /* Hexágono de punta arriba en una caja de 100 × 115.47 (proporción de un hexágono regular). */
  const hex = 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)';

  return (
    <div className={clsx('relative mx-auto aspect-[100/115.47] w-[min(78vw,20rem)]', className)}>
      <svg
        aria-hidden="true"
        viewBox="-6 -7 112 129.47"
        className="absolute -inset-[6%] h-[112%] w-[112%] overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" style={{ stopColor: 'var(--inv-color-accent)' }} />
            <stop
              offset="55%"
              style={{ stopColor: 'color-mix(in srgb, var(--inv-color-accent) 45%, #fff4d6)' }}
            />
            <stop offset="100%" style={{ stopColor: 'var(--inv-color-accent)' }} />
          </linearGradient>
        </defs>
        <polygon
          points="50,-4 104,27.2 104,92.6 50,121.5 -4,92.6 -4,27.2"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="2.2"
          strokeLinejoin="miter"
        />
      </svg>

      <div className="absolute inset-0 overflow-hidden bg-inv-surface" style={{ clipPath: hex }}>
        {image && <BlockImage image={image} sizes={sizes} priority={priority} />}
        {children}
      </div>

      {flowers !== 'none' && (
        <FloralSpray
          asset={WATERCOLOR.bouquet}
          rotate={mirror ? 28 : -28}
          flip={mirror ? 'x' : undefined}
          className={clsx('-top-[10%] z-10 w-[56%]', mirror ? '-right-[16%]' : '-left-[16%]')}
          style={{ ['--inv-breathe-duration' as string]: '15s' }}
        />
      )}
      {flowers === 'both' && (
        <FloralSpray
          asset={WATERCOLOR.hydrangea}
          rotate={mirror ? -150 : 150}
          flip={mirror ? 'x' : undefined}
          className={clsx('-bottom-[8%] z-10 w-[46%]', mirror ? '-left-[14%]' : '-right-[14%]')}
          style={{ ['--inv-breathe-duration' as string]: '18s' }}
        />
      )}
    </div>
  );
}

/** El florón en frambuesa que va bajo cada título. */
export function Flourish({ className }: { readonly className?: string }) {
  return (
    <DesignAsset
      asset={FLOURISH}
      className={twMerge('mx-auto w-[min(62vw,15rem)] text-inv-primary', className)}
    />
  );
}

/** El remate barroco de las tarjetas. `down` lo da la vuelta para el canto de arriba. */
export function Crest({
  direction = 'down',
  className,
}: {
  readonly direction?: 'down' | 'up';
  readonly className?: string;
}) {
  return (
    <DesignAsset
      asset={CREST}
      flip={direction === 'up' ? 'y' : undefined}
      className={twMerge('mx-auto w-[min(76vw,18rem)] text-inv-primary', className)}
    />
  );
}

/** El corazón dibujado de la portada, en el dorado del tema. */
export function DoodleHeart({ className }: { readonly className?: string }) {
  return <DesignAsset asset={HEART} className={twMerge('text-inv-accent', className)} />;
}

/** El filete con cuentas: «—••●••—», el separador de dentro de las tarjetas. */
export function BeadRule({ className }: { readonly className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 12"
      className={twMerge('mx-auto block w-28 text-inv-primary', className)}
    >
      <g fill="currentColor">
        <rect x="0" y="5.5" width="38" height="1" />
        <rect x="82" y="5.5" width="38" height="1" />
        <circle cx="44" cy="6" r="2.4" />
        <circle cx="51" cy="6" r="2.4" />
        <circle cx="60" cy="6" r="5" />
        <circle cx="69" cy="6" r="2.4" />
        <circle cx="76" cy="6" r="2.4" />
      </g>
    </svg>
  );
}

/**
 * Las hojas de línea del fondo de las franjas celestes: grandes, del color de las líneas del tema
 * y muy suaves. Son textura, no ilustración — por eso van en `line` y casi transparentes.
 */
export function LeafBackdrop({ tone = 'line' }: { readonly tone?: 'line' | 'light' }) {
  const color = tone === 'light' ? 'text-white opacity-[0.07]' : 'text-inv-ink opacity-[0.07]';

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <span className="inv-sway absolute -top-6 -left-24 block w-[26rem] max-w-[90vw]">
        <DesignAsset asset={BRANCH} className={color} />
      </span>
      <span
        className="inv-sway absolute -right-28 bottom-10 block w-[24rem] max-w-[85vw]"
        style={{ ['--inv-sway-delay' as string]: '-4s', ['--inv-sway-y' as string]: '12px' }}
      >
        <DesignAsset asset={LEAF} rotate={-24} className={color} />
      </span>
    </div>
  );
}

/**
 * El encabezado de las secciones: un rótulo pequeño en versalitas, el título en capitulares y el
 * florón debajo. Con `inverse` va en blanco, para las secciones en azul.
 */
export function NocturneHeading({
  eyebrow,
  title,
  subtitle,
  inverse = false,
  flourish = 'below',
  className,
}: {
  readonly eyebrow?: string | null;
  readonly title: string;
  readonly subtitle?: string | null;
  readonly inverse?: boolean;
  readonly flourish?: 'above' | 'below' | 'none';
  readonly className?: string;
}) {
  return (
    <header className={clsx('mx-auto max-w-xl text-center', className)}>
      {flourish === 'above' && <Flourish className="mb-6" />}
      {hasText(eyebrow) && (
        <p
          className={clsx(
            'm-0 font-inv-display text-[13px] tracking-[0.22em] uppercase sm:text-[14px]',
            inverse ? 'text-inv-bg/85' : 'text-inv-ink',
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={clsx(
          'mb-0 font-inv-display text-[clamp(2rem,9vw,2.75rem)] leading-[1.12] font-semibold',
          hasText(eyebrow) ? 'mt-2' : 'mt-0',
          inverse ? 'text-inv-bg' : 'text-inv-ink',
        )}
      >
        {title}
      </h2>
      {flourish === 'below' && <Flourish className="mt-5" />}
      {hasText(subtitle) && (
        <p
          className={clsx(
            'mx-auto mt-5 mb-0 max-w-md text-[15.5px] leading-relaxed',
            inverse ? 'text-inv-bg/80' : 'text-inv-ink-soft',
          )}
        >
          {subtitle}
        </p>
      )}
    </header>
  );
}
