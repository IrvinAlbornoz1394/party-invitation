import { ActionLink } from '../../shared/ActionLink';
import { BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { Reveal } from '../../shared/Reveal';
import { staggerDelay } from '../../shared/stagger';
import {
  BRUSH_BUTTON,
  Blob,
  CLAY_TAN,
  LaurelSprig,
  Squiggle,
  TerracottaHeading,
} from '../../shared/terracotta-ornaments';
import { Swatch } from './dresscode-parts';
import type { DresscodeVariantProps } from './dresscode-variant';

/** Cada color, una mancha de contorno propio: la paleta se lee como gotas de pintura. */
const BLOB_SHAPES = [
  '60% 40% 52% 48% / 46% 58% 42% 54%',
  '44% 56% 62% 38% / 56% 44% 52% 48%',
  '52% 48% 40% 60% / 40% 52% 48% 60%',
  '38% 62% 50% 50% / 58% 40% 60% 42%',
] as const;

/**
 * `dresscode.blobs` — la vestimenta de `terracota`. La referencia no la tiene; sale de sus manchas
 * de barro: cada color de la paleta es una mancha de contorno propio, con un filete blanco que la
 * separa del papel, y el nombre del color debajo. Arriba, la indicación a pincel.
 */
export function DresscodeBlobs({ content }: DresscodeVariantProps) {
  return (
    <BlockSection block="dresscode" variant="blobs" className="relative isolate overflow-hidden">
      <Blob shape="wave" outline className={`-top-14 -left-20 -z-10 h-36 w-44 -scale-x-100 sm:-top-6 sm:h-40 sm:w-52 ${CLAY_TAN}`} />
      <Squiggle className="-right-10 bottom-10 -z-10 hidden w-48 lg:block" />

      <div className="mx-auto max-w-lg px-6 text-center">
        <Reveal>
          <TerracottaHeading eyebrow={content.eyebrow} title={content.title} />
        </Reveal>

        {hasText(content.description) && (
          <Reveal delay={0.06}>
            <p className="mx-auto mt-7 mb-0 max-w-md font-inv-display text-[clamp(1.4rem,6vw,1.75rem)] leading-snug text-inv-ink">
              {content.description}
            </p>
          </Reveal>
        )}

        <ul className="m-0 mt-10 flex list-none flex-wrap justify-center gap-x-5 gap-y-6 p-0">
          {content.palette.map((swatch, index) => {
            const shape = BLOB_SHAPES[index % BLOB_SHAPES.length];

            return (
              <li key={`${swatch.color}-${index}`} className="w-[4.75rem]">
                <Reveal delay={staggerDelay(index, 0.06)}>
                  <span
                    className="mx-auto block size-[4.75rem] overflow-hidden border-4 border-solid border-inv-bg shadow-inv-soft"
                    style={{ borderRadius: shape }}
                  >
                    <Swatch swatch={swatch} shape="block" />
                  </span>
                  {hasText(swatch.label) ? (
                    <span className="mt-2 block text-[13px] leading-tight text-inv-ink-soft">{swatch.label}</span>
                  ) : (
                    <span className="sr-only">{swatch.color}</span>
                  )}
                </Reveal>
              </li>
            );
          })}
        </ul>

        <LaurelSprig className="mt-10" />

        {content.action && (
          <ActionLink label={content.action.label} href={content.action.href} className={`mt-8 ${BRUSH_BUTTON}`} />
        )}
        {hasText(content.note) && (
          <p className="mx-auto mt-8 mb-0 max-w-sm text-[15px] leading-relaxed text-inv-ink-soft">{content.note}</p>
        )}
      </div>
    </BlockSection>
  );
}
