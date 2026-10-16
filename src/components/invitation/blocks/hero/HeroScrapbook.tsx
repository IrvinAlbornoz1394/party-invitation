import clsx from 'clsx';
import { eventDateParts } from '@/domain/invitation/event-date';
import { requireDesignAsset } from '@/lib/design-assets';
import { BlockImage } from '../../shared/BlockImage';
import { Countdown } from '../../shared/Countdown';
import { DesignAsset } from '../../shared/DesignAsset';
import { PolaroidFrame } from '../../shared/PolaroidFrame';
import { RedThread } from '../../shared/RedThread';
import { ScrollHint } from '../../shared/ScrollHint';
import type { HeroVariantProps } from './hero-variant';
import { hasText } from '../../shared/has-text';

const HEART = requireDesignAsset('symbol-heart-solid-001');

/** Cuántas veces se repite el rótulo en cada copia de la cinta. */
const REPEATS = 6;

/**
 * La fecha en cifras con puntos, «27.06.2026», como se escribe a mano en el reverso de una foto.
 *
 * Se valida con `eventDateParts` —que rechaza un 31 de febrero— y solo entonces se leen las
 * cifras de la cadena tal como vienen, por la misma razón que allí: sin `Date` no hay huso que
 * elegir. Si no se puede, `null`, y la portada escribe la frase del organizador.
 */
function dottedDate(startsAt: string): string | null {
  if (!eventDateParts(startsAt)) return null;

  const fields = /^(\d{4})-(\d{2})-(\d{2})/.exec(startsAt.trim());

  return fields ? `${fields[3]}.${fields[2]}.${fields[1]}` : null;
}

/**
 * `hero.scrapbook` — una cinta granate corriendo arriba, los nombres a pincel, el retrato en dos
 * instantáneas apiladas con un corazón pegado en la esquina, y la fecha en cifras escrita a mano.
 * Un hilo rojo da una vuelta por detrás de las fotos.
 *
 * Es la portada de `scrapbook`, y la primera pantalla de la referencia. Las otras portadas con
 * polaroid (`hero.polaroid`) enseñan **una** foto apoyada; aquí son dos, la de atrás más torcida
 * asomando por debajo, porque es un álbum y no una foto suelta: lo que lo hace álbum es que haya
 * más de una cosa pegada en la página.
 *
 * ## La cinta
 *
 * Repite el rótulo del evento con un corazón entre copias, con la misma mecánica que
 * `footer.marquee` —dos copias, `.inv-marquee`, quieta con movimiento reducido—. Es decorativa:
 * el rótulo se expone una sola vez, en `sr-only`. Sin rótulo, la cinta lleva los nombres; es
 * parte de la composición de la página y quitarla dejaría la portada sin su borde de arriba.
 *
 * ## La fecha
 *
 * En cifras —«27.06.2026»— y en manuscrita, que es como la escribe la referencia. Sale del
 * instante; la frase del organizador (`dateLabel`) va como etiqueta para quien escucha, y es lo
 * que se pinta si el instante no se deja partir.
 *
 * ## Sin fotografía
 *
 * No se pintan dos marcos vacíos: queda un corazón grande sobre el hilo, entre los nombres y la
 * frase, y la composición sigue centrada.
 */
export function HeroScrapbook({ content }: HeroVariantProps) {
  const dotted = dottedDate(content.startsAt);
  const bandLabel = hasText(content.eventTypeLabel) ? content.eventTypeLabel : content.celebrantName;
  const copy = Array.from({ length: REPEATS }, (_, index) => index);

  return (
    <section
      data-block="hero"
      data-variant="scrapbook"
      className="relative isolate flex min-h-[var(--inv-viewport,100svh)] w-full flex-col items-center overflow-hidden bg-inv-bg pb-24 font-inv-body text-inv-ink"
    >
      <div aria-hidden="true" className="w-full overflow-hidden bg-inv-primary py-2 select-none">
        <div className="inv-marquee flex w-max">
          {[0, 1].map((track) => (
            <div key={track} className="flex">
              {copy.map((index) => (
                <span
                  key={index}
                  className="flex items-center gap-4 pr-4 text-[11px] tracking-[0.22em] whitespace-nowrap text-inv-on-primary uppercase sm:text-[12px]"
                >
                  {bandLabel}
                  <DesignAsset asset={HEART} className="w-2.5 text-inv-on-primary" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      {hasText(content.eventTypeLabel) && <p className="sr-only">{content.eventTypeLabel}</p>}

      <div className="inv-rise relative z-10 flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 pt-10 text-center sm:pt-14">
        {hasText(content.intro) && (
          <p className="m-0 max-w-xs text-[10.5px] leading-relaxed tracking-[0.28em] text-inv-ink-soft uppercase">
            {content.intro}
          </p>
        )}
        <h1
          className={clsx(
            hasText(content.intro) ? 'mt-3' : 'mt-0',
            'mb-0 font-inv-script text-[clamp(3rem,15vw,4.8rem)] leading-[1.1] font-normal text-balance text-inv-primary',
          )}
        >
          {content.celebrantName}
        </h1>
        {hasText(content.celebrantLastName) && (
          <p className="mt-1 mb-0 text-[10.5px] tracking-[0.34em] text-inv-ink-soft uppercase">
            {content.celebrantLastName}
          </p>
        )}

        {content.image ? (
          <div className="relative mt-9 w-[min(74vw,19rem)]">
            {/* El hilo da su vuelta por detrás de las fotos y sale por los dos cantos: se le da
                más ancho que la pila para que entre y salga de la pantalla, no de la foto. */}
            <RedThread
              shape="swag"
              className="absolute top-[38%] left-1/2 -z-10 h-28 w-[150vw] max-w-[44rem] -translate-x-1/2 text-inv-primary"
            />
            {/* La de atrás no lleva foto: es otra instantánea asomando, velada, y un segundo
                retrato idéntico debajo se leería como un error de impresión. Es el mismo marco
                para que el blanco y el faldón coincidan con los de la de delante. */}
            <div aria-hidden="true" className="absolute inset-0 translate-x-3 -translate-y-3 rotate-[5deg]">
              <PolaroidFrame photoClassName="aspect-[4/5] bg-inv-ink/5">{null}</PolaroidFrame>
            </div>
            <PolaroidFrame className="rotate-[-2.5deg]" photoClassName="aspect-[4/5]">
              <BlockImage
                image={content.image}
                priority
                sizes="(min-width: 640px) 19rem, 74vw"
                className="object-top"
              />
            </PolaroidFrame>
            <DesignAsset
              asset={HEART}
              rotate={-12}
              className="pointer-events-none absolute right-4 bottom-2 w-7 text-inv-primary sm:right-5 sm:bottom-3 sm:w-8"
            />
          </div>
        ) : (
          <div aria-hidden="true" className="relative mt-8 flex h-24 w-full items-center justify-center">
            <RedThread
              shape="swag"
              className="absolute inset-y-0 left-1/2 w-[150vw] max-w-[44rem] -translate-x-1/2 text-inv-primary"
            />
            <DesignAsset asset={HEART} rotate={-8} className="relative w-12 text-inv-primary" />
          </div>
        )}

        {hasText(content.tagline) && (
          <p className="mt-10 mb-0 max-w-[17rem] font-inv-script text-[clamp(1.35rem,6vw,1.65rem)] leading-[1.25] text-inv-ink">
            {content.tagline}
          </p>
        )}

        {dotted ? (
          <p
            aria-label={content.dateLabel}
            className={clsx(
              hasText(content.tagline) ? 'mt-6' : 'mt-10',
              'mb-0 font-inv-script text-[clamp(2.6rem,13vw,3.6rem)] leading-[1.1] text-inv-primary',
            )}
          >
            <span aria-hidden="true">{dotted}</span>
          </p>
        ) : (
          <p
            className={clsx(
              hasText(content.tagline) ? 'mt-6' : 'mt-10',
              'mb-0 font-inv-display text-[clamp(1.2rem,5.4vw,1.5rem)] leading-snug text-inv-primary italic',
            )}
          >
            {content.dateLabel}
          </p>
        )}
        {hasText(content.city) && (
          <p className="mt-2 mb-0 font-inv-display text-[15px] text-inv-ink-soft italic">
            {content.city}
          </p>
        )}
        {content.showCountdown && (
          <Countdown startsAt={content.startsAt} variant="script" tone="onSurface" className="mt-9" />
        )}
      </div>

      <ScrollHint tone="onSurface" />
    </section>
  );
}
