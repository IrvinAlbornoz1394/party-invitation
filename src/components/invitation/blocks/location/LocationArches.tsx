import { ActionLink } from '../../shared/ActionLink';
import { BlockImage } from '../../shared/BlockImage';
import { BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { Reveal } from '../../shared/Reveal';
import { staggerDelay } from '../../shared/stagger';
import {
  BRUSH_BUTTON,
  Blob,
  CLAY_TAN,
  DoodleHearts,
  Feather,
  LaurelSprig,
  TerracottaHeading,
} from '../../shared/terracotta-ornaments';
import type { LocationVariantProps } from './location-parts';

/**
 * `location.arches` — las sedes de `terracota`, como «The Wedding Event» de la referencia: sobre el
 * crema, una tarjeta blanca de lados abombados por sede, con el nombre del momento a pincel
 * («La ceremonia»), los dos corazones, la hora, el lugar y su dirección, el laurel y el botón de
 * «Ver ubicación» con el rótulo a pincel.
 *
 * En escritorio van en fila y la del centro baja un poco, como en la referencia; detrás de ella
 * asoma una pluma. Si la sede trae foto, abre la tarjeta en un medallón redondo.
 */
export function LocationArches({ content }: LocationVariantProps) {
  return (
    <BlockSection block="location" variant="arches" className="relative isolate overflow-hidden bg-inv-surface">
      <Blob shape="slab" className="top-40 -left-24 -z-10 h-80 w-40 text-inv-primary" />
      <Blob shape="wave" outline className={`-top-10 -right-14 -z-10 h-32 w-40 sm:-top-2 sm:h-40 sm:w-48 ${CLAY_TAN}`} />

      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <TerracottaHeading eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        </Reveal>

        <ul className="m-0 mt-14 grid list-none gap-10 p-0 md:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] md:gap-8">
          {content.venues.map((venue, index) => (
            <li key={`${venue.name}-${index}`} className={index % 2 === 1 ? 'md:mt-12' : undefined}>
              <Reveal delay={staggerDelay(index, 0.1)} className="relative h-full">
                {index % 2 === 1 && <Feather className="-top-4 -left-6 z-10 w-12" rotate={-20} />}
                <article className="inv-squircle flex h-full flex-col items-center bg-inv-bg px-6 pt-12 pb-12 text-center">
                  {venue.image && (
                    <div className="relative mb-6 aspect-square w-32 overflow-hidden rounded-full border-4 border-solid border-inv-surface">
                      <BlockImage image={venue.image} sizes="128px" />
                    </div>
                  )}
                  <h3 className="m-0 font-inv-display text-[1.75rem] leading-tight font-normal text-inv-ink">
                    {hasText(venue.label) ? venue.label : venue.name}
                  </h3>
                  <DoodleHearts className="mt-3 w-10" />
                  {hasText(venue.timeLabel) && (
                    <p className="mt-4 mb-0 text-[15.5px] text-inv-ink">{venue.timeLabel}</p>
                  )}
                  {hasText(venue.label) && (
                    <p className="mt-3 mb-0 text-[15.5px] font-medium text-inv-ink">{venue.name}</p>
                  )}
                  {hasText(venue.address) && (
                    <p className="mt-1 mb-0 max-w-[16rem] text-[15px] leading-relaxed text-inv-ink-soft">
                      {venue.address}
                    </p>
                  )}
                  {hasText(venue.detail) && (
                    <p className="mt-2 mb-0 max-w-[16rem] text-[14px] leading-relaxed text-inv-ink-soft">
                      {venue.detail}
                    </p>
                  )}
                  <LaurelSprig className="mt-5" />
                  {venue.mapAction && (
                    <ActionLink
                      label={venue.mapAction.label}
                      href={venue.mapAction.href}
                      className={`mt-6 ${BRUSH_BUTTON}`}
                    />
                  )}
                </article>
              </Reveal>
            </li>
          ))}
        </ul>

        {hasText(content.note) && (
          <p className="mx-auto mt-10 mb-0 max-w-sm text-center text-[15px] leading-relaxed text-inv-ink-soft">
            {content.note}
          </p>
        )}
      </div>
    </BlockSection>
  );
}
