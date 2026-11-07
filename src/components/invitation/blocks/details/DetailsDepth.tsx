import { BlockNote } from '../../shared/BlockNote';
import { hasText } from '../../shared/has-text';
import { IconBadge } from '../../shared/IconBadge';
import { DepthCard, DepthHeading, DepthPhoto } from '../../shared/mirador-parts';
import { ParallaxScene } from '../../shared/Parallax';
import { Reveal } from '../../shared/Reveal';
import { staggerDelay } from '../../shared/stagger';
import { TextLink } from '../../shared/TextLink';
import type { DetailsVariantProps } from './details-variant';

/**
 * `details.depth` — los detalles de `mirador`, en una ventana.
 *
 * La foto del bloque se queda atrás bajo el velo y los detalles suben por delante en tarjetas de
 * papel: una columna en el teléfono, dos desde `sm`. Sin foto, la ventana da al cielo del tema
 * (`DepthPhoto` ya lo resuelve) y la composición no cambia.
 */
export function DetailsDepth({ content }: DetailsVariantProps) {
  return (
    <ParallaxScene
      block="details"
      variant="depth"
      className="inv-on-photo bg-inv-ink py-[var(--inv-space-block)] font-inv-body"
    >
      <DepthPhoto image={content.image} />

      <div className="mx-auto w-full max-w-4xl px-6 sm:px-10">
        <Reveal>
          <DepthHeading eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} tone="photo" />
        </Reveal>

        <ul className="m-0 mt-14 grid list-none gap-5 p-0 sm:grid-cols-2 sm:gap-6">
          {content.items.map((item, index) => (
            <li key={`${item.title}-${index}`}>
              <Reveal delay={staggerDelay(index, 0.07)} className="h-full">
                <DepthCard className="flex h-full flex-col items-center text-center">
                  <IconBadge icon={item.icon} />
                  <h3 className="mt-5 mb-0 font-inv-display text-[1.35rem] leading-snug font-normal text-inv-ink italic">
                    {item.title}
                  </h3>
                  {hasText(item.description) && (
                    <p className="mx-auto mt-3 mb-0 max-w-xs text-[15.5px] leading-relaxed text-inv-ink-soft">
                      {item.description}
                    </p>
                  )}
                  {item.action && <TextLink action={item.action} className="mt-4" />}
                </DepthCard>
              </Reveal>
            </li>
          ))}
        </ul>

        {hasText(content.note) && (
          <BlockNote note={content.note} tone="inverse" className="mx-auto mt-12 max-w-sm text-center" />
        )}
      </div>
    </ParallaxScene>
  );
}
