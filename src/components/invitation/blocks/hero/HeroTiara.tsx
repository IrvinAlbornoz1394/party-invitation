import { useId } from 'react';
import { requireDesignAsset } from '@/lib/design-assets';
import { Countdown } from '../../shared/Countdown';
import { DesignAsset } from '../../shared/DesignAsset';
import { HeartDate } from '../../shared/HeartDate';
import { ScrollHint } from '../../shared/ScrollHint';
import type { HeroVariantProps } from './hero-variant';
import { hasText } from '../../shared/has-text';

const ROSES = requireDesignAsset('corner-rose-line-001');
const BOW = requireDesignAsset('bow-ribbon-line-001');
const TIARA = requireDesignAsset('tiara-filigree-001');
const BUTTERFLY = requireDesignAsset('symbol-butterfly-line-001');

/**
 * `hero.tiara` — la participación como una tarjeta de doble filete con cantos redondos: el rótulo
 * en arco sobre un «15» enorme y pálido, el nombre a pincel, la fecha con el día en un corazón y
 * la tiara al pie, con rosas de línea desbordando dos esquinas.
 *
 * Es la portada de `coquette`, y la primera pantalla de la referencia tal cual. Las otras
 * portadas de XV hacen del número el titular (`hero.quince`) o ponen la corona encima del nombre
 * (`hero.crown`); esta hace del número **un fondo** —un «15» del acento a poca opacidad sobre el
 * que se curva el rótulo— y deja la tiara para el final, como el remate de una tarjeta impresa.
 *
 * ## El «15» no es contenido
 *
 * Como el «XV» de `hero.quince`: es la marca de la celebración, no un dato del evento, y la
 * plantilla solo se ofrece para XV. El rótulo que se curva encima sí es contenido
 * (`eventTypeLabel`), y sin él el número queda solo.
 *
 * ## Sin fotografía
 *
 * La referencia no lleva retrato en la portada: es una tarjeta, y el retrato llega en la sección
 * siguiente, en la tira de fotos de la historia. La foto de la portada no se pinta aquí; no se
 * pierde, porque sigue siendo la que se comparte al mandar el enlace.
 */
export function HeroTiara({ content }: HeroVariantProps) {
  const arcId = useId();

  return (
    <section
      data-block="hero"
      data-variant="tiara"
      className="relative isolate flex min-h-[var(--inv-viewport,100svh)] w-full flex-col items-center justify-center overflow-hidden bg-inv-bg px-5 pt-14 pb-24 font-inv-body text-inv-ink sm:pt-20"
    >
      <div className="inv-rise relative w-[min(88vw,24rem)]">
        <DesignAsset
          asset={ROSES}
          rotate={180}
          className="pointer-events-none absolute -top-12 -right-12 z-10 w-44 text-inv-primary opacity-75 sm:w-52"
        />
        <DesignAsset
          asset={ROSES}
          className="pointer-events-none absolute -bottom-12 -left-12 z-10 w-44 text-inv-primary opacity-75 sm:w-52"
        />
        <DesignAsset
          asset={BUTTERFLY}
          rotate={18}
          className="pointer-events-none absolute -top-9 left-6 z-10 w-14 text-inv-primary opacity-70"
        />

        <div className="rounded-[2.2rem] border border-solid border-inv-primary/40 bg-inv-surface p-2 shadow-[0_26px_50px_-34px_rgba(120,50,60,0.5)]">
          <div className="flex flex-col items-center rounded-[1.8rem] border border-solid border-inv-primary/35 px-6 pt-8 pb-10 text-center">
            {/* El rótulo en arco sobre el «15». Va en SVG porque el arco de texto no tiene
                equivalente en CSS; el número va dentro para que los dos se muevan juntos. */}
            <svg
              viewBox="0 0 300 120"
              aria-hidden="true"
              className="w-full max-w-[17rem] overflow-visible"
            >
              <text
                x="150"
                y="112"
                textAnchor="middle"
                className="fill-inv-accent font-inv-display"
                style={{ fontSize: 104, opacity: 0.32 }}
              >
                15
              </text>
              {hasText(content.eventTypeLabel) && (
                <>
                  <path id={arcId} d="M28 104A136 136 0 0 1 272 104" fill="none" />
                  <text
                    className="fill-inv-primary font-inv-display uppercase"
                    style={{ fontSize: 25, letterSpacing: '0.08em' }}
                  >
                    <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
                      {content.eventTypeLabel}
                    </textPath>
                  </text>
                </>
              )}
            </svg>
            {hasText(content.eventTypeLabel) && <p className="sr-only">{content.eventTypeLabel}</p>}

            <p aria-hidden="true" className="mt-3 mb-0 flex items-center gap-2 text-inv-primary">
              <span className="h-px w-14 bg-current opacity-50" />
              <DesignAsset asset={BOW} className="w-7" />
              <span className="h-px w-14 bg-current opacity-50" />
            </p>

            <h1 className="mt-2 mb-0 font-inv-script text-[clamp(3.6rem,19vw,5.2rem)] leading-[1.05] font-normal text-inv-primary">
              {content.celebrantName}
            </h1>
            {hasText(content.intro) && (
              <p className="mx-auto mt-4 mb-0 max-w-[15rem] font-inv-display text-[clamp(1.1rem,5vw,1.3rem)] leading-[1.15] text-inv-accent">
                {content.intro}
              </p>
            )}

            <HeartDate startsAt={content.startsAt} dateLabel={content.dateLabel} className="mt-6" />
            {hasText(content.city) && (
              <p className="mt-1 mb-0 text-[12.5px] tracking-[0.08em] text-inv-ink-soft">
                {content.city}
              </p>
            )}

            <DesignAsset asset={TIARA} className="mt-7 w-44 text-inv-primary opacity-80 sm:w-48" />

            {hasText(content.tagline) && (
              <p className="mx-auto mt-6 mb-0 max-w-[16rem] text-[14px] leading-relaxed text-inv-ink-soft">
                {content.tagline}
              </p>
            )}
          </div>
        </div>
      </div>

      {content.showCountdown && (
        <Countdown startsAt={content.startsAt} variant="colon" tone="onSurface" className="relative mt-14" />
      )}

      <ScrollHint tone="onSurface" />
    </section>
  );
}
