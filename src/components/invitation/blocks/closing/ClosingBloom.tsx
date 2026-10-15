import { Heart } from 'lucide-react';
import { requireDesignAsset } from '@/lib/design-assets';
import { ActionLink } from '../../shared/ActionLink';
import { BlockImage } from '../../shared/BlockImage';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DesignAsset } from '../../shared/DesignAsset';
import { PolaroidFrame } from '../../shared/PolaroidFrame';
import type { ClosingVariantProps } from './closing-parts';

const FLOWER = requireDesignAsset('symbol-flower-pink-001');
const CORNER = requireDesignAsset('corner-floral-blush-001');

/**
 * `closing.bloom` — una sola flor de tallo largo en el centro, como si se la dejaran al invitado,
 * y la despedida debajo escrita a mano, con los ramilletes de acuarela subiendo por las dos
 * esquinas de abajo.
 *
 * Es el cierre de `blush`, y la flor a cuerpo entero —con su tallo y sus hojas— que la referencia
 * pone dos veces. En el resto de la plantilla la flor está **apoyada** sobre algo, recortada por
 * el marco de una polaroid; aquí está sola y entera, y eso es lo que hace que se lea como un
 * final: lo último que se ve es lo único que no está encima de nada.
 *
 * El título va en manuscrita y no en la serif de `ClosingMessage` («Let's celebrate» en la
 * referencia), y por eso esta variante compone su propio mensaje en vez de usar el compartido.
 *
 * Si hay foto, va antes que la flor y pequeña, en una polaroid: la flor sigue siendo el remate.
 */
export function ClosingBloom({ content }: ClosingVariantProps) {
  return (
    <BlockSection block="closing" variant="bloom" className="relative isolate">
      <DesignAsset
        asset={CORNER}
        flip="y"
        className="pointer-events-none absolute bottom-0 left-0 -z-10 w-36 opacity-80 sm:w-48"
      />
      <DesignAsset
        asset={CORNER}
        rotate={180}
        className="pointer-events-none absolute right-0 bottom-0 -z-10 w-40 opacity-85 sm:w-52"
      />

      <BlockContainer className="max-w-md text-center">
        {content.image && (
          <PolaroidFrame
            className="mx-auto mb-12 w-[min(52vw,12rem)] rotate-[2deg]"
            photoClassName="aspect-[4/5]"
          >
            <BlockImage image={content.image} sizes="12rem" />
          </PolaroidFrame>
        )}

        <DesignAsset asset={FLOWER} className="mx-auto w-24 sm:w-28" />

        {content.eyebrow && (
          <p className="mt-8 mb-0 text-[10.5px] tracking-[0.32em] text-inv-ink-soft uppercase">
            {content.eyebrow}
          </p>
        )}
        <p className="mx-auto mt-4 mb-0 max-w-sm font-inv-script text-[clamp(2.1rem,9.5vw,2.9rem)] leading-[1.2] text-inv-accent">
          {content.title}
        </p>
        {content.message && (
          <p className="mx-auto mt-5 mb-0 max-w-xs font-inv-display text-[12px] leading-relaxed tracking-[0.2em] text-inv-ink-soft uppercase">
            {content.message}
          </p>
        )}
        <Heart
          size={10}
          strokeWidth={0}
          aria-hidden="true"
          className="mx-auto mt-6 block fill-current text-inv-accent"
        />
        {content.signature && (
          <p className="mt-6 mb-0 font-inv-script text-[clamp(1.6rem,6vw,2rem)] leading-none text-inv-primary">
            {content.signature}
          </p>
        )}
        {content.action && (
          <ActionLink label={content.action.label} href={content.action.href} className="mt-9" />
        )}
      </BlockContainer>
    </BlockSection>
  );
}
