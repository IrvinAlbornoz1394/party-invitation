import clsx from 'clsx';
import { requireDesignAsset, type DesignAsset as DesignAssetData } from '@/lib/design-assets';
import type { LocationVenue } from '@/domain/invitation/blocks/location';
import { ActionLink } from '../../shared/ActionLink';
import { blockIconComponent } from '../../shared/block-icons';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { BowCard } from '../../shared/BowCard';
import { DesignAsset } from '../../shared/DesignAsset';
import type { LocationVariantProps } from './location-parts';
import { venueIcon } from './venue-icon';

const CHAMPAGNE = requireDesignAsset('symbol-champagne-001');
const BOUQUET = requireDesignAsset('symbol-bouquet-001');
const ROSES = requireDesignAsset('corner-rose-line-001');

/**
 * El dibujo de cada tipo de sede. La iglesia no tiene pieza en la biblioteca y va con el icono del
 * catálogo, a trazo fino para que no pese más que las otras.
 */
const DRAWINGS: Partial<Record<LocationVenue['kind'], DesignAssetData>> = {
  reception: CHAMPAGNE,
  other: BOUQUET,
};

/**
 * `location.vignette` — cada sede en su tarjeta del moño: el rótulo a pincel («Recepción»), un
 * dibujo de línea del lugar, la hora en el principal, el nombre del salón y el botón de cómo
 * llegar, con un ramillete de rosas asomando por un lado de la tarjeta.
 *
 * Es la ubicación de `coquette`, y las tarjetas de la segunda columna de la referencia. Las otras
 * ubicaciones enseñan el sitio —una foto, un mapa, una escena— o lo escriben como una ficha; esta
 * lo cuenta como **una viñeta**: lo que importa es qué pasa allí (las copas del brindis, el ramo)
 * y a qué hora, y el sitio queda en el nombre y en el botón.
 *
 * Si la sede tiene foto, ocupa el lugar del dibujo, recortada con los mismos cantos que la
 * tarjeta. El rótulo de la sede es el titular de la tarjeta; sin rótulo, lo es el nombre, y no se
 * escribe dos veces.
 *
 * Los ramilletes se alternan de lado de una tarjeta a la siguiente, como en la referencia.
 */
export function LocationVignette({ content }: LocationVariantProps) {
  return (
    <BlockSection block="location" variant="vignette">
      <BlockContainer className="max-w-xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleFont="script"
          className="[&_h2]:text-inv-accent"
        />

        <div className="mt-14 flex flex-col items-center gap-16">
          {content.venues.map((venue, index) => {
            const drawing = DRAWINGS[venue.kind];
            const Icon = blockIconComponent(venueIcon(venue.kind));
            const left = index % 2 === 0;

            return (
              <div key={index} className="relative w-[min(84vw,20rem)]">
                <DesignAsset
                  asset={ROSES}
                  flip={left ? undefined : 'x'}
                  className={clsx(
                    'pointer-events-none absolute -bottom-6 z-10 w-28 text-inv-primary opacity-65',
                    left ? '-left-10' : '-right-10',
                  )}
                />
                <BowCard>
                  <article className="flex flex-col items-center">
                    <h3 className="m-0 font-inv-script text-[clamp(2.4rem,11vw,3rem)] leading-[1.1] font-normal text-inv-ink">
                      {venue.label ?? venue.name}
                    </h3>

                    {venue.image ? (
                      <div className="relative mt-5 aspect-[4/3] w-full overflow-hidden rounded-[0.8rem]">
                        <BlockImage image={venue.image} sizes="18rem" />
                      </div>
                    ) : drawing ? (
                      <DesignAsset asset={drawing} className="mt-4 w-24 text-inv-primary" />
                    ) : (
                      <Icon size={64} strokeWidth={0.9} aria-hidden="true" className="mt-4 text-inv-primary" />
                    )}

                    {venue.timeLabel && (
                      <p className="mt-5 mb-0 font-inv-display text-[1.45rem] leading-none text-inv-primary tabular-nums">
                        {venue.timeLabel}
                      </p>
                    )}
                    {venue.label && (
                      <p className="mt-3 mb-0 font-inv-display text-[1.3rem] leading-tight text-inv-ink">
                        {venue.name}
                      </p>
                    )}
                    {venue.address && (
                      <p className="mx-auto mt-2 mb-0 max-w-[15rem] text-[13px] leading-relaxed text-inv-ink-soft">
                        {venue.address}
                      </p>
                    )}
                    {venue.detail && (
                      <p className="mx-auto mt-1 mb-0 max-w-[15rem] text-[12.5px] leading-relaxed text-inv-ink-soft">
                        {venue.detail}
                      </p>
                    )}
                    {venue.mapAction && (
                      <ActionLink
                        label={venue.mapAction.label}
                        href={venue.mapAction.href}
                        className="mt-6 shadow-[0_10px_18px_-10px_rgba(120,50,60,0.7)]"
                      />
                    )}
                  </article>
                </BowCard>
              </div>
            );
          })}
        </div>

        {content.note && <BlockNote note={content.note} className="mt-12 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
