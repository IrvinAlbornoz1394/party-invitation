import clsx from 'clsx';
import type { ComponentType } from 'react';
import type { LocationContent, LocationVenue } from '@/domain/invitation/blocks/location';
import { ActionLink } from '../../shared/ActionLink';
import { BlockImage } from '../../shared/BlockImage';
import { IconBadge } from '../../shared/IconBadge';
import { TextLink } from '../../shared/TextLink';
import { venueIcon } from './venue-icon';

/**
 * Las piezas de una sede, compartidas por los seis componentes de ubicación.
 *
 * Lo que cambia entre ellos es la retícula —una sede a sangre, dos en columnas, en zigzag—; los
 * datos de una sede se componen igual en todos: el para qué encima, el nombre grande, la
 * dirección legible y el enlace al mapa al final. Es el orden en que se leen cuando alguien
 * abre la invitación dentro de un coche, y no conviene que dependa del componente que se eligió.
 */

export interface LocationVariantProps {
  readonly content: LocationContent;
}

/** El tipo con el que el registro guarda una ubicación, sea cual sea su forma. */
export type LocationVariant = ComponentType<LocationVariantProps>;

/**
 * La foto de una sede, o su icono cuando no la hay.
 *
 * Mismo criterio que en el cronograma: el hueco existe siempre y lo llena una cosa o la otra,
 * porque una invitación con foto del templo y sin foto del salón no puede verse a medio hacer.
 * El respaldo es un panel con un tinte del color principal, no un icono suelto sobre el fondo
 * —eso se ve como una imagen que no cargó—.
 */
export function VenueMedia({
  venue,
  className,
  sizes = '(min-width: 768px) 50vw, 100vw',
  priority = false,
}: {
  readonly venue: LocationVenue;
  readonly className?: string;
  readonly sizes?: string;
  readonly priority?: boolean;
}) {
  if (venue.image) {
    return (
      <figure className={clsx('relative isolate m-0 overflow-hidden bg-inv-primary/5', className)}>
        <BlockImage image={venue.image} sizes={sizes} priority={priority} />
      </figure>
    );
  }

  return (
    <div className={clsx('grid place-items-center bg-inv-primary/5', className)}>
      <IconBadge icon={venueIcon(venue.kind)} size="lg" />
    </div>
  );
}

/**
 * Los datos de una sede: para qué, dónde, cuándo y cómo llegar.
 *
 * `tone` distingue apoyarse en el papel del tema o sobre una fotografía. En el segundo caso
 * todo se pinta con `onPrimary` y el botón del mapa cambia a su versión translúcida, porque el
 * color de tinta del tema no está garantizado sobre una foto que sube el cliente.
 *
 * El botón del mapa es un botón de verdad —y no el enlace discreto de los detalles— en el tono
 * sobre imagen y en las composiciones donde la sede manda: es **la** acción del bloque, la que
 * alguien busca con el coche en marcha, y ahí un enlace subrayado es un blanco demasiado
 * pequeño para el pulgar.
 */
export function VenueFacts({
  venue,
  tone = 'onSurface',
  align = 'left',
  emphasis = 'card',
  className,
}: {
  readonly venue: LocationVenue;
  readonly tone?: 'onSurface' | 'onImage';
  readonly align?: 'left' | 'center';
  /** `hero` agranda el nombre para las composiciones donde la sede ocupa la sección entera. */
  readonly emphasis?: 'card' | 'hero';
  readonly className?: string;
}) {
  const onImage = tone === 'onImage';
  const centered = align === 'center';

  return (
    <div className={clsx(centered && 'text-center', onImage && 'text-inv-on-primary', className)}>
      {venue.label && (
        <p
          className={clsx(
            'm-0 flex items-center gap-3 text-[11px] tracking-[0.3em] uppercase',
            onImage ? 'opacity-85' : 'text-inv-accent',
            centered && 'justify-center',
          )}
        >
          <span aria-hidden="true" className="h-px w-6 bg-current opacity-60" />
          {venue.label}
          {centered && <span aria-hidden="true" className="h-px w-6 bg-current opacity-60" />}
        </p>
      )}

      <h3
        className={clsx(
          'mt-4 mb-0 font-inv-display leading-tight font-light',
          emphasis === 'hero'
            ? 'text-[clamp(1.9rem,4.5vw,3rem)]'
            : 'text-[clamp(1.45rem,2.6vw,1.9rem)]',
          onImage ? 'text-inv-on-primary' : 'text-inv-primary',
        )}
      >
        {venue.name}
      </h3>

      {venue.timeLabel && (
        <p
          className={clsx(
            'mt-3 mb-0 font-inv-display text-[1.15rem] leading-none tabular-nums',
            onImage ? 'opacity-90' : 'text-inv-accent',
          )}
        >
          {venue.timeLabel}
        </p>
      )}

      {venue.address && (
        <p
          className={clsx(
            'mt-4 mb-0 max-w-sm text-[14.5px] leading-relaxed',
            onImage ? 'opacity-90' : 'text-inv-ink-soft',
            centered && 'mx-auto',
          )}
        >
          {venue.address}
        </p>
      )}

      {venue.detail && (
        <p
          className={clsx(
            'mt-2 mb-0 max-w-sm text-[13.5px] leading-relaxed',
            onImage ? 'opacity-75' : 'text-inv-ink-soft opacity-80',
            centered && 'mx-auto',
          )}
        >
          {venue.detail}
        </p>
      )}

      {venue.mapAction &&
        (emphasis === 'hero' || onImage ? (
          <ActionLink
            label={venue.mapAction.label}
            href={venue.mapAction.href}
            tone={onImage ? 'onImage' : 'onSurface'}
            className="mt-7"
          />
        ) : (
          <TextLink action={venue.mapAction} className="mt-5" />
        ))}
    </div>
  );
}
