import { ActionLink } from '../../shared/ActionLink';
import { BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { LeafBackdrop, NocturneHeading } from '../../shared/nocturne-ornaments';
import { Reveal } from '../../shared/Reveal';
import { staggerDelay } from '../../shared/stagger';
import { Swatch } from './dresscode-parts';
import type { DresscodeVariantProps } from './dresscode-variant';

const HEX = 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)';

/**
 * `dresscode.hexagons` — la vestimenta de `nocturne`: la instrucción en capitulares y la paleta en
 * hexágonos, cada uno dentro de un hexágono dorado un poco mayor. Es el marco de los retratos de la
 * plantilla en pequeño, y es lo que ata la vestimenta al resto de la invitación: los colores que se
 * piden llevan el mismo marco que los novios.
 *
 * El filete dorado se hace con dos hexágonos recortados uno dentro de otro —el de fuera del acento
 * y el de dentro del papel— porque `clip-path` recorta también los bordes: un `border` sobre un
 * hexágono no se vería.
 */
export function DresscodeHexagons({ content }: DresscodeVariantProps) {
  return (
    <BlockSection block="dresscode" variant="hexagons" className="relative isolate bg-inv-surface">
      <LeafBackdrop />

      <div className="mx-auto max-w-lg px-6 text-center">
        <Reveal>
          <NocturneHeading eyebrow={content.eyebrow} title={content.title} />
        </Reveal>

        {hasText(content.description) && (
          <Reveal delay={0.06}>
            <p className="mx-auto mt-7 mb-0 max-w-md font-inv-display text-[clamp(1.15rem,5.2vw,1.4rem)] leading-snug text-inv-ink">
              {content.description}
            </p>
          </Reveal>
        )}

        <ul className="m-0 mt-10 flex list-none flex-wrap justify-center gap-x-5 gap-y-7 p-0">
          {content.palette.map((swatch, index) => (
            <li key={`${swatch.color}-${index}`} className="w-[4.6rem]">
              <Reveal delay={staggerDelay(index, 0.06)}>
                <span
                  className="mx-auto grid aspect-[100/115.47] w-full place-items-center bg-inv-accent"
                  style={{ clipPath: HEX }}
                >
                  <span className="grid aspect-[100/115.47] w-[88%] place-items-center bg-inv-surface" style={{ clipPath: HEX }}>
                    <span className="block aspect-[100/115.47] w-[86%]" style={{ clipPath: HEX }}>
                      <Swatch swatch={swatch} shape="block" />
                    </span>
                  </span>
                </span>
                {hasText(swatch.label) && (
                  <span className="mt-2 block text-[13px] leading-tight text-inv-ink-soft">{swatch.label}</span>
                )}
                {!hasText(swatch.label) && <span className="sr-only">{swatch.color}</span>}
              </Reveal>
            </li>
          ))}
        </ul>

        {content.action && (
          <ActionLink label={content.action.label} href={content.action.href} className="mt-10" />
        )}

        {hasText(content.note) && (
          <p className="mx-auto mt-8 mb-0 max-w-sm text-[14.5px] leading-relaxed text-inv-ink-soft">
            {content.note}
          </p>
        )}
      </div>
    </BlockSection>
  );
}
