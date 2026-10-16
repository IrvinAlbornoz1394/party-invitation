import { paletteIsNamed } from '@/domain/invitation/blocks/dresscode';
import { requireDesignAsset } from '@/lib/design-assets';
import { ActionLink } from '../../shared/ActionLink';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { DesignAsset } from '../../shared/DesignAsset';
import { Swatch } from './dresscode-parts';
import type { DresscodeVariantProps } from './dresscode-variant';

const DIVIDER = requireDesignAsset('botanical-divider-002');

/**
 * `dresscode.arches` — cada color en una ventana de medio punto, en fila, como una arcada.
 *
 * Es la vestimenta de `arbor`. Las otras diez muestras son discos, retales, franjas, manchas o
 * fichas; esta les da a los colores la misma forma que tiene todo lo demás en la plantilla —el
 * arco—, alto y estrecho, de modo que la paleta se lee como una galería de vanos pintados cada
 * uno de un tono. La altura importa: un arco tan ancho como alto se lee como una lápida, y uno
 * esbelto como una ventana.
 *
 * Los nombres, si los hay, van debajo de cada arco en versalitas; sin ellos la fila es decorativa
 * y se marca así (`paletteIsNamed`), como en las demás.
 */
export function DresscodeArches({ content }: DresscodeVariantProps) {
  const named = paletteIsNamed(content.palette);

  return (
    <BlockSection block="dresscode" variant="arches">
      <BlockContainer className="max-w-xl">
        <div className="flex flex-col items-center text-center">
          <BlockHeading
            eyebrow={content.eyebrow}
            title={content.title}
            align="center"
            titleFont="script"
          />
          <DesignAsset asset={DIVIDER} className="mt-5 w-28 text-inv-primary opacity-80" />
          {hasText(content.description) && (
            <p className="mt-6 mb-0 max-w-sm text-[14.5px] leading-relaxed text-inv-ink">
              {content.description}
            </p>
          )}

          <ul
            aria-hidden={named ? undefined : 'true'}
            className="mt-10 flex list-none flex-wrap items-start justify-center gap-x-3 gap-y-6 p-0 sm:gap-x-5"
          >
            {content.palette.map((swatch, index) => (
              <li key={index} className="flex w-12 flex-col items-center gap-3 sm:w-14">
                <span className="block h-20 w-full overflow-hidden rounded-t-full ring-1 ring-inv-line sm:h-24">
                  <Swatch swatch={swatch} shape="block" />
                </span>
                {hasText(swatch.label) && (
                  <span className="text-[8.5px] leading-snug tracking-[0.14em] text-inv-ink-soft uppercase sm:text-[9px]">
                    {swatch.label}
                  </span>
                )}
              </li>
            ))}
          </ul>

          {content.action && (
            <ActionLink
              label={content.action.label}
              href={content.action.href}
              tone="onSurface"
              className="mt-10"
            />
          )}
          {hasText(content.note) && <BlockNote note={content.note} className="mt-8 max-w-sm" />}
        </div>
      </BlockContainer>
    </BlockSection>
  );
}
