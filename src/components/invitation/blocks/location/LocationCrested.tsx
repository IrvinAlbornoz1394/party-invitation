import { Fragment } from 'react';
import { ActionLink } from '../../shared/ActionLink';
import { BlockImage } from '../../shared/BlockImage';
import { BlockSection } from '../../shared/BlockSection';
import { blockIconComponent } from '../../shared/block-icons';
import { hasText } from '../../shared/has-text';
import { BeadRule, Crest, NocturneHeading } from '../../shared/nocturne-ornaments';
import { Reveal } from '../../shared/Reveal';
import type { LocationVariantProps } from './location-parts';
import { venueIcon } from './venue-icon';

/**
 * `location.crested` — las sedes de `nocturne`, cada una en una tarjeta de filete frambuesa con
 * un remate barroco colgando del canto de abajo y otro, al revés, coronando el de arriba de la
 * siguiente: la sección «organización» de su referencia.
 *
 * Dentro, sobre un papel gris muy claro, la foto de la sede en un círculo con aro dorado y una
 * medalla blanca encabalgada con el dibujo del tipo de sede —anillos para la ceremonia, copas para
 * la recepción—, el nombre en capitulares, la hora, el filete de cuentas y la dirección.
 *
 * Los remates **entre** tarjetas son lo que la hace distinta de una lista de fichas: se miran el
 * uno al otro y convierten el hueco en un ornamento, de modo que dos sedes se leen como una sola
 * pieza. Con una sola sede, la tarjeta lleva los dos remates por fuera.
 */
export function LocationCrested({ content }: LocationVariantProps) {
  return (
    <BlockSection block="location" variant="crested">
      <div className="mx-auto max-w-md px-5">
        <Reveal>
          <NocturneHeading eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        </Reveal>

        <div className="mt-10">
          <Crest direction="up" />
          {content.venues.map((venue, index) => {
            const Icon = blockIconComponent(venueIcon(venue.kind));
            const last = index === content.venues.length - 1;

            return (
              <Fragment key={`${venue.name}-${index}`}>
                <Reveal delay={0.05}>
                  <article className="border-[3px] border-solid border-inv-primary bg-inv-bg p-3.5 sm:p-4">
                    <div className="flex flex-col items-center bg-[color-mix(in_srgb,var(--inv-color-line)_45%,#f3f3f3)] px-5 pt-8 pb-9 text-center">
                      {venue.image && (
                        <div className="relative mb-7 w-[min(66vw,15rem)]">
                          <div className="relative aspect-square overflow-hidden rounded-full border-[3px] border-solid border-inv-accent/70 p-1.5">
                            <div className="relative h-full w-full overflow-hidden rounded-full">
                              <BlockImage image={venue.image} sizes="240px" />
                            </div>
                          </div>
                          <span className="absolute -bottom-3 -left-2 grid size-[4.6rem] place-items-center rounded-full bg-inv-bg text-inv-ink-soft shadow-inv-soft">
                            <Icon aria-hidden="true" size={30} strokeWidth={1.2} />
                          </span>
                        </div>
                      )}

                      {hasText(venue.label) && (
                        <p className="m-0 text-[13px] font-semibold tracking-[0.18em] text-inv-accent uppercase">
                          {venue.label}
                        </p>
                      )}
                      <h3 className="mt-1.5 mb-0 font-inv-display text-[clamp(1.45rem,6.6vw,1.7rem)] leading-tight font-semibold text-inv-ink">
                        {venue.name}
                      </h3>
                      {hasText(venue.timeLabel) && (
                        <p className="mt-3 mb-0 text-[17px] text-inv-ink">{venue.timeLabel}</p>
                      )}

                      <BeadRule className="my-6" />

                      {hasText(venue.address) && (
                        <p className="m-0 max-w-[17rem] text-[15.5px] leading-relaxed text-inv-ink-soft">
                          {venue.address}
                        </p>
                      )}
                      {hasText(venue.detail) && (
                        <p className="mt-2 mb-0 max-w-[17rem] text-[14px] leading-relaxed text-inv-ink-soft">
                          {venue.detail}
                        </p>
                      )}
                      {venue.mapAction && (
                        <ActionLink
                          label={venue.mapAction.label}
                          href={venue.mapAction.href}
                          className="mt-6 font-inv-display font-bold"
                        />
                      )}
                    </div>
                  </article>
                </Reveal>
                <Crest direction="down" className="-mt-[3px]" />
                {!last && <Crest direction="up" className="mt-8" />}
              </Fragment>
            );
          })}
        </div>

        {hasText(content.note) && (
          <p className="mx-auto mt-8 mb-0 max-w-sm text-center text-[14.5px] leading-relaxed text-inv-ink-soft">
            {content.note}
          </p>
        )}
      </div>
    </BlockSection>
  );
}
