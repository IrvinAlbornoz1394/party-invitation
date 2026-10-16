import clsx from 'clsx';
import { requireDesignAsset } from '@/lib/design-assets';
import { ActionLink } from '../../shared/ActionLink';
import { BlockImage } from '../../shared/BlockImage';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DesignAsset } from '../../shared/DesignAsset';
import type { ClosingVariantProps } from './closing-parts';
import { hasText } from '../../shared/has-text';

const TIARA = requireDesignAsset('tiara-filigree-001');
const BOW = requireDesignAsset('bow-ribbon-line-001');
const ROSES = requireDesignAsset('corner-rose-line-001');

/**
 * `closing.tiara` — la despedida coronada: un retrato en óvalo con la tiara de línea apoyada en el
 * canto de arriba, y debajo el agradecimiento a pincel, la frase y la firma, con rosas subiendo
 * por las dos esquinas de abajo.
 *
 * Es el cierre de `coquette`, que la referencia no tiene, y se compone con sus piezas: la tiara
 * del pie de la portada y las rosas de las tarjetas. Lo que lo distingue de los otros cierres es
 * que **corona** a quien se despide: la tiara no flota como adorno, se posa sobre la foto, y es
 * el último guiño a la quinceañera antes del pie.
 *
 * Sin foto, la tiara se queda sola encima del título, que sigue funcionando como remate.
 */
export function ClosingTiara({ content }: ClosingVariantProps) {
  return (
    <BlockSection block="closing" variant="tiara" className="relative isolate">
      <DesignAsset
        asset={ROSES}
        className="pointer-events-none absolute bottom-0 left-0 -z-10 w-40 text-inv-primary opacity-55 sm:w-52"
      />
      <DesignAsset
        asset={ROSES}
        flip="x"
        className="pointer-events-none absolute right-0 bottom-0 -z-10 w-40 text-inv-primary opacity-55 sm:w-52"
      />

      <BlockContainer className="max-w-md text-center">
        {content.image ? (
          <div className="relative mx-auto w-[min(52vw,12.5rem)] pt-12">
            <DesignAsset
              asset={TIARA}
              className="pointer-events-none absolute top-0 left-1/2 z-10 w-[78%] -translate-x-1/2 text-inv-primary"
            />
            <div className="rounded-[50%] border border-solid border-inv-primary/40 bg-inv-surface p-1.5">
              <div className="relative aspect-[3/4] overflow-hidden rounded-[50%]">
                <BlockImage image={content.image} sizes="12.5rem" />
              </div>
            </div>
          </div>
        ) : (
          <DesignAsset asset={TIARA} className="mx-auto w-40 text-inv-primary opacity-80" />
        )}

        {hasText(content.eyebrow) && (
          <p className="mt-9 mb-0 font-inv-display text-[11px] tracking-[0.32em] text-inv-ink-soft uppercase">
            {content.eyebrow}
          </p>
        )}
        <p
          className={clsx(
            'mx-auto mb-0 max-w-sm font-inv-script text-[clamp(2.6rem,12vw,3.4rem)] leading-[1.15] text-inv-primary',
            hasText(content.eyebrow) ? 'mt-4' : 'mt-9',
          )}
        >
          {content.title}
        </p>
        {hasText(content.message) && (
          <p className="mx-auto mt-4 mb-0 max-w-xs font-inv-display text-[clamp(1rem,4.4vw,1.15rem)] leading-snug text-inv-accent">
            {content.message}
          </p>
        )}
        <DesignAsset asset={BOW} className="mx-auto mt-6 w-8 text-inv-primary opacity-70" />
        {hasText(content.signature) && (
          <p className="mt-4 mb-0 font-inv-script text-[clamp(1.9rem,8vw,2.4rem)] leading-none text-inv-ink">
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
