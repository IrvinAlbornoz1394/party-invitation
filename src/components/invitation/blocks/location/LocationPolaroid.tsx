import clsx from 'clsx';
import { Heart } from 'lucide-react';
import { requireDesignAsset } from '@/lib/design-assets';
import { ActionLink } from '../../shared/ActionLink';
import { blockIconComponent } from '../../shared/block-icons';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { hasText } from '../../shared/has-text';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DesignAsset } from '../../shared/DesignAsset';
import { PolaroidFrame } from '../../shared/PolaroidFrame';
import type { LocationVariantProps } from './location-parts';
import { venueIcon } from './venue-icon';

const FLOWER = requireDesignAsset('symbol-flower-pink-001');

/**
 * `location.polaroid` — cada sede como una instantánea del lugar, girada hacia un lado y luego
 * hacia el otro, con sus datos centrados debajo.
 *
 * Es la ubicación de `blush`, que la referencia no tiene: se dibuja con su misma pieza —la
 * polaroid— para que el salón se vea como una foto más del álbum de la fiesta y no como una
 * ficha. La primera sede lleva la flor apoyada en el marco; las demás no, porque una flor en
 * cada foto deja de ser un gesto y pasa a ser una cenefa.
 *
 * Sin foto del lugar, la polaroid no se pinta: el dibujo del tipo de sede va en un medallón
 * relleno, el mismo que marca los momentos del itinerario. Un marco blanco vacío se leería como
 * una foto que no cargó.
 *
 * El nombre del lugar va en la serif del tema y no en manuscrita: en `blush` la manuscrita es
 * para los nombres de personas y los títulos, y un salón escrito a mano se confunde con ellos.
 */
export function LocationPolaroid({ content }: LocationVariantProps) {
  return (
    <BlockSection block="location" variant="polaroid">
      <BlockContainer className="max-w-xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleFont="script"
        />

        <div className="mt-12 flex flex-col items-center gap-16">
          {content.venues.map((venue, index) => {
            const Icon = blockIconComponent(venueIcon(venue.kind));
            const tiltLeft = index % 2 === 0;

            return (
              <article key={index} className="flex w-full flex-col items-center text-center">
                {venue.image ? (
                  <div className="relative w-[min(70vw,17rem)]">
                    <PolaroidFrame
                      className={tiltLeft ? 'rotate-[-2.5deg]' : 'rotate-[2.5deg]'}
                      photoClassName="aspect-[4/3]"
                    >
                      <BlockImage image={venue.image} sizes="17rem" />
                    </PolaroidFrame>
                    {index === 0 && (
                      <DesignAsset
                        asset={FLOWER}
                        rotate={-30}
                        className="pointer-events-none absolute -right-8 -bottom-12 w-20 drop-shadow-[0_8px_8px_rgba(120,60,75,0.2)]"
                      />
                    )}
                  </div>
                ) : (
                  <span className="grid size-16 place-items-center rounded-full bg-inv-primary text-inv-on-primary">
                    <Icon size={28} strokeWidth={1.3} aria-hidden="true" />
                  </span>
                )}

                {hasText(venue.label) && (
                  <p
                    className={clsx(
                      'mb-0 text-[10px] tracking-[0.3em] text-inv-ink-soft uppercase',
                      venue.image ? 'mt-9' : 'mt-5',
                    )}
                  >
                    {venue.label}
                  </p>
                )}
                {/* Sin rótulo, el nombre hereda la distancia a la foto o al medallón que tenía el rótulo. */}
                <h3
                  className={clsx(
                    'mb-0 font-inv-display text-[clamp(1.3rem,5.6vw,1.6rem)] leading-tight font-normal text-inv-ink',
                    hasText(venue.label) ? 'mt-2' : venue.image ? 'mt-9' : 'mt-5',
                  )}
                >
                  {venue.name}
                </h3>
                {hasText(venue.address) && (
                  <p className="mx-auto mt-2 mb-0 max-w-[17rem] text-[13px] leading-relaxed text-inv-ink-soft">
                    {venue.address}
                  </p>
                )}
                {hasText(venue.detail) && (
                  <p className="mx-auto mt-1 mb-0 max-w-[17rem] text-[12px] leading-relaxed text-inv-ink-soft opacity-85">
                    {venue.detail}
                  </p>
                )}
                {hasText(venue.timeLabel) && (
                  <p className="mt-4 mb-0 flex items-center gap-2.5 font-inv-display text-[13px] tracking-[0.22em] text-inv-primary uppercase tabular-nums">
                    <Heart size={9} strokeWidth={0} aria-hidden="true" className="fill-current opacity-70" />
                    {venue.timeLabel}
                    <Heart size={9} strokeWidth={0} aria-hidden="true" className="fill-current opacity-70" />
                  </p>
                )}
                {venue.mapAction && (
                  <ActionLink
                    label={venue.mapAction.label}
                    href={venue.mapAction.href}
                    className="mt-6"
                  />
                )}
              </article>
            );
          })}
        </div>

        {hasText(content.note) && <BlockNote note={content.note} className="mt-12 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
