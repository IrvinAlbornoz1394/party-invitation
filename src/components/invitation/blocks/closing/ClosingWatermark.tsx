import { ActionLink } from '../../shared/ActionLink';
import { BlockImage } from '../../shared/BlockImage';
import { BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { FloralSpray, Flourish } from '../../shared/nocturne-ornaments';
import { WATERCOLOR } from '../../shared/nocturne-assets';
import { Reveal } from '../../shared/Reveal';
import type { ClosingVariantProps } from './closing-parts';

/**
 * `closing.watermark` — la despedida de `nocturne`: sobre el celeste, la firma escrita enorme en
 * capitulares del color de las líneas, como una marca de agua, y encima el título, el mensaje y la
 * misma firma a mano. Dos ramos de acuarela cierran la sección por abajo, uno a cada lado.
 *
 * La marca de agua sale de la referencia, que estampa el nombre de la marca a cuerpo de cartel
 * detrás de la ceremonia. Aquí es la firma de quien invita —«Ana & Diego»—, que es lo único de la
 * página que tiene sentido repetir dos veces: una como sello, otra como rúbrica.
 *
 * Sin firma no hay marca de agua, y la sección queda en una columna limpia.
 */
export function ClosingWatermark({ content }: ClosingVariantProps) {
  return (
    <BlockSection block="closing" variant="watermark" className="relative isolate overflow-hidden bg-inv-surface pb-[calc(var(--inv-space-block)+5rem)]">
      {hasText(content.signature) && (
        <p
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 m-0 -translate-y-1/2 text-center font-inv-display text-[clamp(4rem,24vw,9rem)] leading-[0.95] font-bold break-words text-inv-line"
        >
          {content.signature}
        </p>
      )}

      <FloralSpray
        asset={WATERCOLOR.bouquet}
        rotate={-14}
        className="-bottom-8 -left-12 -z-10 w-44 sm:w-56"
      />
      <FloralSpray
        asset={WATERCOLOR.lilac}
        motion="sway"
        rotate={18}
        flip="x"
        className="-right-10 -bottom-10 -z-10 w-40 sm:w-52"
      />

      <div className="mx-auto max-w-lg px-6 text-center">
        {content.image && (
          <Reveal className="relative mx-auto mb-10 aspect-square w-44 overflow-hidden rounded-full border-[3px] border-solid border-inv-accent/70 p-1">
            <div className="relative h-full w-full overflow-hidden rounded-full">
              <BlockImage image={content.image} sizes="176px" />
            </div>
          </Reveal>
        )}

        <Reveal>
          {hasText(content.eyebrow) && (
            <p className="m-0 font-inv-display text-[13px] tracking-[0.22em] text-inv-ink uppercase">
              {content.eyebrow}
            </p>
          )}
          <h2 className="mt-3 mb-0 font-inv-display text-[clamp(1.9rem,8.6vw,2.6rem)] leading-[1.15] font-semibold text-inv-ink">
            {content.title}
          </h2>
          <Flourish className="mt-5" />
          {hasText(content.message) && (
            <p className="mx-auto mt-6 mb-0 max-w-sm text-[16px] leading-[1.75] text-inv-ink-soft">
              {content.message}
            </p>
          )}
          {hasText(content.signature) && (
            <p className="mt-8 mb-0 font-inv-script text-[2.8rem] leading-none text-inv-primary">
              {content.signature}
            </p>
          )}
          {content.action && (
            <ActionLink label={content.action.label} href={content.action.href} className="mt-9" />
          )}
        </Reveal>
      </div>
    </BlockSection>
  );
}
