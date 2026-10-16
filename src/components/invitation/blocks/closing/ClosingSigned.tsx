import clsx from 'clsx';
import { requireDesignAsset } from '@/lib/design-assets';
import { ActionLink } from '../../shared/ActionLink';
import { BlockImage } from '../../shared/BlockImage';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DesignAsset } from '../../shared/DesignAsset';
import { hasText } from '../../shared/has-text';
import { PolaroidFrame } from '../../shared/PolaroidFrame';
import { RedThread } from '../../shared/RedThread';
import type { ClosingVariantProps } from './closing-parts';

const HEART = requireDesignAsset('symbol-heart-solid-001');
const KISS = requireDesignAsset('sticker-kiss-001');
const TAPE = requireDesignAsset('sticker-tape-001');
const COCKTAIL = requireDesignAsset('sticker-cocktail-glass-001');

/**
 * `closing.signed` — la despedida firmada a mano, con el hilo rojo colgando por encima y un beso
 * de carmín junto a la firma.
 *
 * Es el cierre de `scrapbook`. El hilo que ha ido cruzando la invitación sección a sección llega
 * aquí y se cuelga de lado a lado, con dos corazones prendidos, como la guirnalda que remata la
 * última página del álbum. Debajo, la frase y la firma, y la firma es lo grande: en un álbum lo
 * último que se escribe es el nombre de quien lo hizo.
 *
 * ## Por qué no usa `ClosingMessage`
 *
 * El mensaje compartido pinta la frase en la serif de titulares y la firma pequeña y en acento.
 * Aquí la jerarquía va al revés de la habitual —la frase en manuscrita mediana y la firma en
 * manuscrita grande, con el beso pegado—, y por eso la variante compone su propio mensaje, igual
 * que `closing.bloom`.
 *
 * ## El hilo
 *
 * `RedThread` en forma `swag` estirado al ancho de la sección, y los corazones colocados en dos
 * puntos por los que el recorrido pasa exactamente —(260, 60) y (480, 50) en su `viewBox` de
 * 680×100—, en porcentajes de la caja. Si cambia el trazo en `RedThread`, cambian aquí.
 *
 * ## La fotografía
 *
 * Opcional, como una instantánea pegada con cinta y torcida, encima de la frase. Sin ella la
 * sección se queda en el hilo y la firma, que se sostiene sola.
 */
export function ClosingSigned({ content }: ClosingVariantProps) {
  return (
    <BlockSection block="closing" variant="signed" className="relative isolate">
      {/* La guirnalda: va fuera del contenedor para cruzar la sección de canto a canto. */}
      <div aria-hidden="true" className="pointer-events-none relative h-16 w-full sm:h-20">
        <RedThread shape="swag" className="h-full w-full text-inv-primary" />
        <DesignAsset
          asset={HEART}
          className="absolute top-[60%] left-[38.2%] w-4 -translate-x-1/2 -translate-y-1/2 text-inv-primary"
        />
        <DesignAsset
          asset={HEART}
          className="absolute top-1/2 left-[70.6%] w-3 -translate-x-1/2 -translate-y-1/2 rotate-12 text-inv-primary"
        />
      </div>

      {/* La copa, en la esquina de abajo sobre el aire de la sección, donde no pisa el texto. */}
      <DesignAsset
        asset={COCKTAIL}
        className="pointer-events-none absolute bottom-3 -left-3 w-14 -rotate-12 sm:left-[6%] sm:w-20"
      />

      <BlockContainer className="mt-10 max-w-md text-center">
        {content.image && (
          <div className="relative mx-auto mb-12 w-[min(56vw,13rem)] -rotate-3">
            <PolaroidFrame photoClassName="aspect-[4/5]">
              <BlockImage image={content.image} sizes="13rem" />
            </PolaroidFrame>
            <DesignAsset
              asset={TAPE}
              className="pointer-events-none absolute -top-3 left-1/2 z-10 w-20 -translate-x-1/2 rotate-[6deg] opacity-90"
            />
          </div>
        )}

        {hasText(content.eyebrow) && (
          <p className="m-0 text-[10.5px] tracking-[0.3em] text-inv-ink-soft uppercase">
            {content.eyebrow}
          </p>
        )}

        <p
          className={clsx(
            'mx-auto mb-0 max-w-sm font-inv-script text-[clamp(2.1rem,8.5vw,2.9rem)] leading-[1.2] text-inv-primary',
            hasText(content.eyebrow) ? 'mt-4' : 'mt-0',
          )}
        >
          {content.title}
        </p>

        {hasText(content.message) && (
          <p className="mx-auto mt-5 mb-0 max-w-sm text-[15px] leading-relaxed text-inv-ink-soft">
            {content.message}
          </p>
        )}

        <DesignAsset asset={HEART} className="mx-auto mt-8 w-3 text-inv-primary" />

        {hasText(content.signature) && (
          /* `isolate` para que el beso, en `-z-10`, quede detrás de la firma y no detrás de la
             sección: la tinta tiene que leerse entera aunque el carmín la roce. */
          <div className="relative isolate mx-auto mt-6 max-w-xs">
            <p className="m-0 font-inv-script text-[clamp(2.8rem,13vw,4rem)] leading-[1.1] text-inv-ink">
              {content.signature}
            </p>
            <DesignAsset
              asset={KISS}
              className="pointer-events-none absolute -right-2 -bottom-7 -z-10 w-16 rotate-[-12deg] opacity-90 sm:-right-12 sm:w-20"
            />
          </div>
        )}

        {content.action && (
          <ActionLink
            label={content.action.label}
            href={content.action.href}
            tone="onSurface"
            className="mt-12"
          />
        )}
      </BlockContainer>
    </BlockSection>
  );
}
