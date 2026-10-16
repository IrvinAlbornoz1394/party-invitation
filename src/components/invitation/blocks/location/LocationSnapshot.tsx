import clsx from 'clsx';
import { requireDesignAsset } from '@/lib/design-assets';
import type { LocationVenue } from '@/domain/invitation/blocks/location';
import { ActionLink } from '../../shared/ActionLink';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { hasText } from '../../shared/has-text';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DesignAsset } from '../../shared/DesignAsset';
import { PolaroidFrame } from '../../shared/PolaroidFrame';
import { RedThread } from '../../shared/RedThread';
import type { LocationVariantProps } from './location-parts';

const HEART = requireDesignAsset('symbol-heart-solid-001');
const TAPE = requireDesignAsset('sticker-tape-001');

/** El recorte que ocupa el sitio de la foto cuando una sede no la tiene. */
const STAND_INS = [
  requireDesignAsset('sticker-camera-instant-001'),
  requireDesignAsset('sticker-cocktail-glass-001'),
] as const;

/**
 * `location.snapshot` — cada sede como una ficha pegada en el álbum: los datos a un lado, con
 * el botón del mapa en píldora, y al otro la foto del lugar en dos instantáneas apiladas y
 * sujetas con cinta.
 *
 * Es la ubicación de `scrapbook` y sale de su referencia: el nombre del sitio en versalitas
 * sencillas, la dirección debajo y la foto **asomando por el canto** de la invitación, como una
 * foto pegada que se sale de la página. Las otras ubicaciones con polaroid (`location.polaroid`)
 * centran una sola foto encima de los datos; aquí van lado a lado, porque en la referencia la
 * sede se lee de un vistazo —nombre y foto a la vez— y no bajando.
 *
 * ## En el móvil, la foto sangra
 *
 * A 360px la columna de texto queda en unos 200px —cabe el nombre, la dirección y el botón— y
 * la pila de fotos se sale por el canto: el `-mr` la saca del margen y la sección la recorta
 * (`overflow-x-clip`), así que no hay desplazamiento lateral. Por debajo de 22rem ya no cabe y
 * la foto se apila encima del texto, sin sangrar. Con dos sedes, la segunda se refleja —foto a
 * la izquierda— para que la sección vaya y vuelva como el hilo.
 *
 * ## Sin foto, un recorte
 *
 * Una polaroid vacía se lee como una foto que no cargó, así que sin foto no se pinta: en su
 * sitio va un recorte —la cámara para la primera sede, la copa para la segunda— con un corazón.
 *
 * La pila son dos marcos: el de atrás, sin foto y girado al otro lado, es solo el canto de otra
 * instantánea que asoma; la foto es la de delante y es la única que se anuncia.
 */
export function LocationSnapshot({ content }: LocationVariantProps) {
  return (
    <BlockSection block="location" variant="snapshot">
      <BlockContainer className="max-w-2xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleFont="script"
        />

        <div className="relative mt-16 flex flex-col gap-16 sm:gap-20">
          {/* El hilo cruza la invitación de canto a canto entre el título y la primera sede; la
              sección recorta lo que sobra a los lados. */}
          <RedThread
            shape="swag"
            className="absolute -top-14 left-1/2 h-12 w-screen -translate-x-1/2 text-inv-primary opacity-75"
          />
          {content.venues.map((venue, index) => (
            <VenueSnapshot key={index} venue={venue} index={index} />
          ))}
        </div>

        {hasText(content.note) && <BlockNote note={content.note} className="mt-14 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}

function VenueSnapshot({ venue, index }: { readonly venue: LocationVenue; readonly index: number }) {
  const mirrored = index % 2 === 1;

  return (
    <article
      className={clsx(
        'grid grid-cols-1 items-center gap-8',
        'min-[22rem]:gap-4 sm:gap-10',
        mirrored
          ? 'min-[22rem]:grid-cols-[auto_minmax(0,1fr)]'
          : 'min-[22rem]:grid-cols-[minmax(0,1fr)_auto]',
      )}
    >
      <div className={clsx(mirrored && 'min-[22rem]:order-2')}>
        {hasText(venue.label) && (
          <p className="m-0 font-inv-display text-[1.2rem] leading-tight text-inv-primary italic">
            {venue.label}
          </p>
        )}
        <h3
          className={clsx(
            'mb-0 text-[13.5px] leading-snug font-medium tracking-[0.14em] text-balance text-inv-ink uppercase',
            hasText(venue.label) ? 'mt-2' : 'mt-0',
          )}
        >
          {venue.name}
        </h3>
        {hasText(venue.address) && (
          <p className="mt-2 mb-0 text-[13.5px] leading-relaxed text-pretty text-inv-ink-soft">
            {venue.address}
          </p>
        )}
        {hasText(venue.detail) && (
          <p className="mt-1.5 mb-0 text-[12.5px] leading-relaxed text-pretty text-inv-ink-soft opacity-85">
            {venue.detail}
          </p>
        )}
        {hasText(venue.timeLabel) && (
          <p className="mt-3 mb-0 font-inv-display text-[1.3rem] leading-none text-inv-primary italic tabular-nums">
            {venue.timeLabel}
          </p>
        )}
        {venue.mapAction && (
          <ActionLink label={venue.mapAction.label} href={venue.mapAction.href} className="mt-6" />
        )}
      </div>

      {venue.image ? (
        <div
          className={clsx(
            'relative mx-auto w-[min(62vw,13rem)] min-[22rem]:w-[9.5rem] sm:w-56',
            mirrored ? 'min-[22rem]:order-1 min-[22rem]:-ml-12 sm:ml-0' : 'min-[22rem]:-mr-12 sm:mr-0',
          )}
        >
          {/* El canto de otra instantánea debajo: decorado, sin foto y sin anunciarse. */}
          <div
            aria-hidden="true"
            className={clsx('absolute inset-0', mirrored ? 'rotate-[-6deg]' : 'rotate-[6deg]')}
          >
            <PolaroidFrame className="h-full" photoClassName="aspect-[4/5]">
              {null}
            </PolaroidFrame>
          </div>

          <PolaroidFrame
            className={mirrored ? 'rotate-[2deg]' : 'rotate-[-2.5deg]'}
            photoClassName="aspect-[4/5]"
          >
            <BlockImage image={venue.image} sizes="(min-width: 640px) 14rem, 9.5rem" />
          </PolaroidFrame>

          <DesignAsset
            asset={TAPE}
            rotate={mirrored ? 8 : -10}
            className="pointer-events-none absolute -top-3 left-1/2 w-16 -translate-x-1/2 sm:w-20"
          />
          <DesignAsset
            asset={HEART}
            rotate={-10}
            className={clsx(
              'absolute bottom-3 w-4 text-inv-primary sm:bottom-4 sm:w-5',
              mirrored ? 'left-4' : 'right-4',
            )}
          />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className={clsx(
            'relative mx-auto w-24 sm:w-32',
            mirrored && 'min-[22rem]:order-1',
          )}
        >
          <DesignAsset
            asset={STAND_INS[index % STAND_INS.length]}
            rotate={mirrored ? 8 : -8}
            className="w-full drop-shadow-sm"
          />
          <DesignAsset
            asset={HEART}
            rotate={12}
            className="absolute -right-1 -bottom-1 w-5 text-inv-primary"
          />
        </div>
      )}
    </article>
  );
}
