import { ActionLink } from '../../shared/ActionLink';
import { BlockImage } from '../../shared/BlockImage';
import { hasText } from '../../shared/has-text';
import { Reveal } from '../../shared/Reveal';
import {
  BRUSH_BUTTON,
  Blob,
  CLAY_TAN,
  DoodleHearts,
  Feather,
  LaurelSprig,
  Squiggle,
} from '../../shared/terracotta-ornaments';
import type { GiftsVariantProps } from './gifts-variant';

/**
 * `gifts.card` — la mesa de regalos de `terracota`, como «Your Presence is a Gift» de la
 * referencia: la foto a todo lo ancho y, encima, a la izquierda en escritorio, una tarjeta blanca
 * de lados abombados con el título a pincel, los corazones, el mensaje y cada mesa con su dato y
 * su botón. El laurel la cierra.
 *
 * En el teléfono la tarjeta baja sobre la foto, que se queda como una franja arriba: leer el
 * número de evento encima de una cara no sirve a nadie.
 *
 * Sin foto, el fondo es el crema con una mancha de barro, y la tarjeta queda centrada.
 */
export function GiftsCard({ content }: GiftsVariantProps) {
  return (
    <section
      data-block="gifts"
      data-variant="card"
      className="relative isolate w-full overflow-hidden bg-inv-surface font-inv-body text-inv-ink"
    >
      {content.image ? (
        <div className="relative h-64 sm:h-80 lg:absolute lg:inset-0 lg:h-auto">
          <BlockImage image={content.image} sizes="100vw" />
        </div>
      ) : (
        <>
          <Blob shape="slab" className="top-10 -left-16 -z-10 h-72 w-36 text-inv-primary" />
          <Blob shape="drop" className={`-right-20 -bottom-16 -z-10 h-64 w-64 ${CLAY_TAN}`} />
        </>
      )}

      <div
        className={
          content.image
            ? 'relative mx-auto -mt-24 max-w-6xl px-5 pb-[var(--inv-space-block)] lg:mt-0 lg:py-24'
            : 'relative mx-auto max-w-6xl px-5 py-[var(--inv-space-block)]'
        }
      >
        <Reveal className={content.image ? 'relative mx-auto max-w-md lg:mx-0' : 'relative mx-auto max-w-md'}>
          <Feather className="-top-8 -right-3 z-10 w-14" rotate={24} />
          <article className="inv-squircle bg-inv-bg px-6 pt-12 pb-11 text-center sm:px-10">
            {hasText(content.eyebrow) && (
              <p className="m-0 text-[12.5px] font-semibold tracking-[0.2em] text-inv-primary uppercase">
                {content.eyebrow}
              </p>
            )}
            <h2 className="mt-2 mb-0 font-inv-display text-[clamp(1.8rem,8vw,2.4rem)] leading-[1.15] font-normal text-inv-ink">
              {content.title}
            </h2>
            <DoodleHearts className="mt-4" />
            {hasText(content.message) && (
              <p className="mx-auto mt-5 mb-0 max-w-sm text-[15.5px] leading-[1.75] text-inv-ink-soft">
                {content.message}
              </p>
            )}

            {content.registries.length > 0 && (
              <ul className="m-0 mt-8 grid list-none gap-6 p-0">
                {content.registries.map((registry, index) => (
                  <li key={`${registry.label}-${index}`} className="flex flex-col items-center">
                    <p className="m-0 font-inv-display text-[1.45rem] leading-tight text-inv-primary">
                      {registry.label}
                    </p>
                    {hasText(registry.detail) && (
                      <p className="mt-1 mb-0 max-w-xs text-[15px] leading-relaxed break-words text-inv-ink">
                        {registry.detail}
                      </p>
                    )}
                    {registry.action && (
                      <ActionLink
                        label={registry.action.label}
                        href={registry.action.href}
                        className={`mt-3 ${BRUSH_BUTTON}`}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}

            <LaurelSprig className="mt-8" />
            {hasText(content.note) && (
              <p className="mx-auto mt-4 mb-0 max-w-xs text-[14px] leading-relaxed text-inv-ink-soft">
                {content.note}
              </p>
            )}
          </article>
        </Reveal>
      </div>
      {content.image && <Squiggle className="-bottom-2 -left-6 hidden w-64 lg:block" />}
    </section>
  );
}
