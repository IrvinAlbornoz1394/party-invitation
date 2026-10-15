import { requireDesignAsset } from '@/lib/design-assets';
import { ActionLink } from '../../shared/ActionLink';
import { blockIconComponent } from '../../shared/block-icons';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DesignAsset } from '../../shared/DesignAsset';
import type { LocationVariantProps } from './location-parts';
import { venueIcon } from './venue-icon';

const CORNER = requireDesignAsset('botanical-corner-top-001');
const DIVIDER = requireDesignAsset('botanical-divider-002');

/**
 * `location.arch` — todas las sedes dentro de un mismo arco teñido, una debajo de otra, cada
 * una con su dibujo, su nombre en manuscrita y la hora entre guiones.
 *
 * Es la ubicación de `arbor`. Las otras diez ponen cada sede en su propia pieza —tarjeta,
 * franja, lámina, columna— o al aire sin ninguna; esta mete **el día entero** en una sola: un
 * vano de medio punto, con un velo del color principal y una rama apoyada en el hombro. La misa
 * arriba y la recepción debajo se leen como un recorrido sin necesidad de flechas, porque el
 * arco se recorre de arriba abajo.
 *
 * Está pensada para dos sedes y aguanta una o tres: con una el arco se acorta, con tres se
 * alarga. Lo que no hace es partirse en dos piezas.
 *
 * ## Sin fotografías de la sede
 *
 * El icono del tipo de sede —el templo, la copa— es la ilustración de esta variante, y una foto
 * dentro de un arco ya teñido sería una ventana dentro de otra. La foto del lugar sigue en el
 * contenido y la usan las otras diez; esta la deja fuera a propósito, como `story.greeting`
 * deja fuera la suya.
 */
export function LocationArch({ content }: LocationVariantProps) {
  return (
    <BlockSection block="location" variant="arch">
      <BlockContainer className="max-w-xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleFont="script"
        />

        <div className="relative mx-auto mt-12 max-w-[23rem]">
          <div className="rounded-t-full rounded-b-[2.5rem] border border-inv-accent/30 bg-inv-primary/[0.07] px-6 pt-24 pb-14 text-center sm:px-10">
            {content.venues.map((venue, index) => {
              const Icon = blockIconComponent(venueIcon(venue.kind));

              return (
                <article key={index}>
                  {index > 0 && (
                    <DesignAsset
                      asset={DIVIDER}
                      className="mx-auto my-11 w-24 text-inv-primary opacity-75"
                    />
                  )}
                  {venue.label && (
                    <p className="m-0 text-[10px] tracking-[0.3em] text-inv-ink-soft uppercase">
                      {venue.label}
                    </p>
                  )}
                  <Icon
                    size={44}
                    strokeWidth={1}
                    aria-hidden="true"
                    className="mx-auto mt-5 block text-inv-primary"
                  />
                  <h3 className="mt-4 mb-0 font-inv-script text-[clamp(1.6rem,7vw,2rem)] leading-[1.15] font-normal text-inv-accent">
                    {venue.name}
                  </h3>
                  {venue.address && (
                    <p className="mx-auto mt-2 mb-0 max-w-[16rem] text-[13px] leading-relaxed text-inv-ink">
                      {venue.address}
                    </p>
                  )}
                  {venue.detail && (
                    <p className="mx-auto mt-1 mb-0 max-w-[16rem] text-[12px] leading-relaxed text-inv-ink-soft">
                      {venue.detail}
                    </p>
                  )}
                  {venue.timeLabel && (
                    <p className="mt-4 mb-0 flex items-center justify-center gap-2.5 font-inv-display text-[1.3rem] leading-none text-inv-primary tabular-nums">
                      <span aria-hidden="true">-</span>
                      {venue.timeLabel}
                      <span aria-hidden="true">-</span>
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

          {/* La rama apoyada en el hombro izquierdo del arco, por encima del filete. */}
          <DesignAsset
            asset={CORNER}
            className="pointer-events-none absolute -top-5 -left-6 w-32 text-inv-primary opacity-90 sm:-left-10 sm:w-40"
          />
        </div>

        {content.note && <BlockNote note={content.note} className="mt-10 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
