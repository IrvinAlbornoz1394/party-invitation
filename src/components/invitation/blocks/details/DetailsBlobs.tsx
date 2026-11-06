import { BlockImage } from '../../shared/BlockImage';
import { BlockSection } from '../../shared/BlockSection';
import { blockIconComponent } from '../../shared/block-icons';
import { hasText } from '../../shared/has-text';
import { Reveal } from '../../shared/Reveal';
import { staggerDelay } from '../../shared/stagger';
import { TextLink } from '../../shared/TextLink';
import { Blob, CLAY_TAN, Confetti, DoodleHearts, TerracottaHeading } from '../../shared/terracotta-ornaments';
import type { DetailsVariantProps } from './details-variant';

const BADGE_SHAPES = [
  '62% 38% 54% 46% / 50% 60% 40% 50%',
  '42% 58% 48% 52% / 58% 42% 56% 44%',
  '55% 45% 36% 64% / 44% 54% 46% 56%',
] as const;

/**
 * `details.blobs` — los avisos de `terracota`: sobre el crema, una tarjeta blanca de lados
 * abombados por aviso, con el dibujo dentro de una mancha de barro durazno, el título a pincel y
 * la frase. La referencia no tiene esta sección; la tarjeta es la de sus eventos, y la mancha es
 * la de sus esquinas puesta a escala de icono.
 *
 * La foto del bloque, si la hay, abre la sección en el marco abombado con confeti.
 */
export function DetailsBlobs({ content }: DetailsVariantProps) {
  return (
    <BlockSection block="details" variant="blobs" className="relative isolate overflow-hidden bg-inv-surface">
      <Blob shape="slab" className="top-1/3 -right-20 -z-10 h-72 w-32 text-inv-accent" />
      <Blob shape="pebble" className={`-bottom-28 -left-28 -z-10 h-52 w-52 ${CLAY_TAN}`} />

      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <TerracottaHeading eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        </Reveal>

        {content.image && (
          <Reveal className="relative mx-auto mt-10 w-[min(80vw,22rem)]">
            <Confetti className="-top-[12%] -right-[10%] z-10 w-[32%]" />
            <div className="inv-squircle relative aspect-[4/3] overflow-hidden">
              <BlockImage image={content.image} sizes="352px" />
            </div>
          </Reveal>
        )}

        <ul className="m-0 mt-12 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {content.items.map((item, index) => {
            const Icon = blockIconComponent(item.icon);

            return (
              <li key={`${item.title}-${index}`}>
                <Reveal delay={staggerDelay(index, 0.07)} className="h-full">
                  <article className="inv-squircle flex h-full flex-col items-center bg-inv-bg px-6 pt-10 pb-10 text-center">
                    <span
                      aria-hidden="true"
                      className="grid size-16 place-items-center bg-inv-accent text-inv-bg"
                      style={{ borderRadius: BADGE_SHAPES[index % BADGE_SHAPES.length] }}
                    >
                      <Icon size={28} strokeWidth={1.5} />
                    </span>
                    <h3 className="mt-5 mb-0 font-inv-display text-[1.55rem] leading-tight font-normal text-inv-ink">
                      {item.title}
                    </h3>
                    {hasText(item.description) && (
                      <p className="mx-auto mt-3 mb-0 max-w-xs text-[15.5px] leading-relaxed text-inv-ink-soft">
                        {item.description}
                      </p>
                    )}
                    {item.action && <TextLink action={item.action} className="mt-4" />}
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ul>

        {hasText(content.note) && (
          <div className="mt-12 text-center">
            <DoodleHearts />
            <p className="mx-auto mt-3 mb-0 max-w-sm text-[15px] leading-relaxed text-inv-ink-soft">{content.note}</p>
          </div>
        )}
      </div>
    </BlockSection>
  );
}
