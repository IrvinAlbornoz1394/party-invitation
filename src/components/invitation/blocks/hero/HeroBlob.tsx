import { BlockImage } from '../../shared/BlockImage';
import { Countdown } from '../../shared/Countdown';
import { hasText } from '../../shared/has-text';
import { Blob, CLAY_TAN, Confetti, CupidArrow, DoodleHearts, Squiggle } from '../../shared/terracotta-ornaments';
import type { HeroVariantProps } from './hero-variant';

/**
 * `hero.blob` — la portada de `terracota`: sobre el crema, los nombres a pincel dentro de un
 * rótulo de filete terracota, una frase grande a pincel debajo —«Junto a sus familias»— y la
 * invitación en una línea; al lado (debajo, en el teléfono) la foto en el marco abombado, montada
 * sobre una mancha de barro, con confeti en la esquina y un sendero de puntos que la cruza.
 *
 * La foto crece muy despacio y vuelve, quince segundos cada ida (`inv-breathe`), como la de la
 * referencia. El orden en el teléfono es el de la referencia: primero los nombres, luego la foto.
 *
 * `intro` hace de frase a pincel; sin ella, la portada pasa de los nombres a la invitación.
 */
export function HeroBlob({ content }: HeroVariantProps) {
  return (
    <section
      data-block="hero"
      data-variant="blob"
      className="relative isolate w-full overflow-hidden bg-inv-surface font-inv-body text-inv-ink"
    >
      <Blob shape="slab" motion="drift" className="top-[52%] -left-14 -z-10 h-64 w-32 text-inv-accent lg:top-0 lg:h-80 lg:w-44" />
      <Blob shape="wave" outline className={`-top-6 -right-8 -z-10 h-48 w-56 lg:h-72 lg:w-96 ${CLAY_TAN}`} />
      <Blob shape="drop" className={`-right-24 -bottom-24 -z-10 hidden h-80 w-80 lg:block ${CLAY_TAN}`} />
      <Squiggle className="-bottom-2 left-1/2 -z-10 hidden w-72 lg:block" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-20 pb-16 lg:grid-cols-2 lg:gap-16 lg:pt-28 lg:pb-24">
        <div className="flex flex-col items-center text-center lg:order-2">
          {hasText(content.eventTypeLabel) && (
            <p className="inv-rise m-0 text-[12.5px] font-semibold tracking-[0.22em] text-inv-primary uppercase">
              {content.eventTypeLabel}
            </p>
          )}
          <h1 className="inv-rise mt-4 mb-0 border-2 border-solid border-inv-primary px-5 py-2 font-inv-display text-[clamp(2rem,9.5vw,3rem)] leading-[1.15] font-normal text-inv-primary">
            {content.celebrantName}
            {hasText(content.celebrantLastName) && <span className="sr-only"> {content.celebrantLastName}</span>}
          </h1>
          {hasText(content.intro) && (
            <p className="inv-rise mt-6 mb-0 font-inv-display text-[clamp(1.6rem,7.4vw,2.3rem)] leading-[1.2] text-inv-ink">
              {content.intro}
            </p>
          )}
          {hasText(content.tagline) && (
            <p className="inv-rise mx-auto mt-4 mb-0 max-w-md text-[16.5px] leading-relaxed text-inv-ink-soft">
              {content.tagline}
            </p>
          )}
          <p className="inv-rise mt-5 mb-0 text-[15px] font-medium tracking-[0.06em] text-inv-ink">
            {content.dateLabel}
            {hasText(content.city) && <span className="text-inv-ink-soft"> · {content.city}</span>}
          </p>
          <CupidArrow className="mt-6" />
          {content.showCountdown && (
            <Countdown startsAt={content.startsAt} variant="boxes" tone="onSurface" className="mt-8" />
          )}
        </div>

        <div className="relative mx-auto w-[min(84vw,26rem)] lg:order-1 lg:w-[min(40vw,32rem)]">
          <Blob shape="slab" className="-right-[12%] -bottom-[6%] -z-10 h-[62%] w-[70%] text-inv-primary" />
          <Confetti className="-top-[6%] -right-[10%] z-10 w-[34%]" />
          <div className="inv-squircle relative aspect-[4/5] overflow-hidden bg-inv-line">
            {content.image ? (
              <div className="inv-breathe absolute inset-0" style={{ ['--inv-breathe-scale' as string]: '1.14' }}>
                <BlockImage image={content.image} priority sizes="(min-width: 1024px) 512px, 84vw" />
              </div>
            ) : (
              <div className="grid h-full place-items-center">
                <DoodleHearts className="w-20 opacity-70" />
              </div>
            )}
          </div>
          <svg
            aria-hidden="true"
            viewBox="0 0 80 120"
            className="pointer-events-none absolute -right-[8%] -bottom-[4%] w-[22%] text-inv-bg"
          >
            <path d="M70 0C40 20 70 50 40 70S10 100 30 120h20C34 100 66 92 60 66S90 20 70 0Z" fill="currentColor" />
            <path
              d="M62 14c-6 10 2 18-6 28M52 52c-8 8-2 16-10 24M40 86c-6 8 0 14-4 22"
              stroke="var(--inv-color-primary)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="4 7"
              fill="none"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
