import { BlockImage } from '../../shared/BlockImage';
import { BlockSection } from '../../shared/BlockSection';
import { blockIconComponent } from '../../shared/block-icons';
import { hasText } from '../../shared/has-text';
import { FloralSpray, NocturneHeading } from '../../shared/nocturne-ornaments';
import { WATERCOLOR } from '../../shared/nocturne-assets';
import { Reveal } from '../../shared/Reveal';
import { staggerDelay } from '../../shared/stagger';
import { TextLink } from '../../shared/TextLink';
import type { DetailsVariantProps } from './details-variant';

/**
 * `details.framed` — los avisos de `nocturne`: una tarjeta de filete fino por detalle, con un
 * medallón redondo encabalgado en el canto de arriba que lleva el dibujo, el título en
 * capitulares y la frase debajo. Detrás de las tarjetas, una peonía de acuarela a media luz.
 *
 * Es la tarjeta de los buenos deseos de la referencia —el retrato en un círculo montado sobre el
 * marco— con un dibujo donde allí había una cara. El medallón encabalgado es lo que la distingue de
 * `details.cards` (icono dentro de la ficha) y de `details.stack` (placa al margen).
 *
 * La foto del bloque, si la hay, abre la sección en un círculo con aro dorado, como las sedes.
 */
export function DetailsFramed({ content }: DetailsVariantProps) {
  return (
    <BlockSection block="details" variant="framed" className="relative isolate overflow-hidden">
      <FloralSpray
        asset={WATERCOLOR.peony}
        rotate={-12}
        className="top-1/3 -right-24 -z-10 w-72 opacity-25"
      />
      <FloralSpray
        asset={WATERCOLOR.hydrangea}
        rotate={30}
        className="bottom-0 -left-24 -z-10 w-64 opacity-20"
        style={{ ['--inv-breathe-duration' as string]: '19s' }}
      />

      <div className="mx-auto max-w-3xl px-6">
        <Reveal>
          <NocturneHeading eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        </Reveal>

        {content.image && (
          <Reveal className="relative mx-auto mt-10 aspect-square w-40 overflow-hidden rounded-full border-[3px] border-solid border-inv-accent/70 p-1">
            <div className="relative h-full w-full overflow-hidden rounded-full">
              <BlockImage image={content.image} sizes="160px" />
            </div>
          </Reveal>
        )}

        <ul className="m-0 mt-16 grid list-none gap-x-6 gap-y-16 p-0 sm:grid-cols-2">
          {content.items.map((item, index) => {
            const Icon = blockIconComponent(item.icon);

            return (
              <li key={`${item.title}-${index}`}>
                <Reveal delay={staggerDelay(index, 0.07)} className="h-full">
                  <article className="relative h-full border border-solid border-inv-line bg-inv-bg/85 px-6 pt-14 pb-8 text-center">
                    <span className="absolute -top-9 left-1/2 grid size-[4.5rem] -translate-x-1/2 place-items-center rounded-full border border-solid border-inv-line bg-inv-bg text-inv-primary shadow-inv-soft">
                      <Icon aria-hidden="true" size={28} strokeWidth={1.3} />
                    </span>
                    <h3 className="m-0 font-inv-display text-[1.3rem] leading-snug font-semibold text-inv-ink">
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
          <p className="mx-auto mt-12 mb-0 max-w-sm text-center text-[14.5px] leading-relaxed text-inv-ink-soft">
            {content.note}
          </p>
        )}
      </div>
    </BlockSection>
  );
}
