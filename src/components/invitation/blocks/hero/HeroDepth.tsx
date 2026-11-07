'use client';

import { Countdown } from '../../shared/Countdown';
import { hasText } from '../../shared/has-text';
import { DepthPhoto } from '../../shared/mirador-parts';
import { ParallaxFade, ParallaxLayer, ParallaxScene } from '../../shared/Parallax';
import type { HeroVariantProps } from './hero-variant';

/** Parte «Ana & Diego» en sus dos nombres; con un solo festejado devuelve uno. */
function splitNames(name: string): readonly string[] {
  const match = /\s+(?:&|y)\s+/.exec(name);
  if (!match) return [name];
  return [name.slice(0, match.index), name.slice(match.index + match[0].length)];
}

/**
 * `hero.depth` — la portada de `mirador`: la foto a pantalla completa, quieta como una ventana,
 * y el texto subiendo por delante en **tres planos**.
 *
 * - La foto se queda atrás (`DEPTH.far`).
 * - Los nombres suben un poco más rápido que la página y se desvanecen al salir.
 * - El «&» gigante en caligrafía va en su propio plano, más rápido todavía: al bajar, se separa
 *   de los nombres y se cruza con ellos. Es el gesto que hace que la portada parezca tener fondo.
 *
 * Con un solo nombre (XV años) el plano del «&» lo ocupa el rótulo del evento en caligrafía
 * —«Mis XV años»— y la composición no cambia.
 */
export function HeroDepth({ content }: HeroVariantProps) {
  const names = splitNames(content.celebrantName);
  const couple = names.length === 2;
  const flourish = content.eventTypeLabel;

  return (
    <ParallaxScene
      block="hero"
      variant="depth"
      className="inv-on-photo flex min-h-[var(--inv-viewport,100svh)] flex-col bg-inv-ink font-inv-body"
    >
      <DepthPhoto image={content.image} veil="soft" priority />

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <ParallaxFade rate={1.8} className="flex flex-col items-center">
          <ParallaxLayer depth={-0.1}>
            {hasText(content.intro) && (
              <p className="inv-rise m-0 max-w-xs text-[12px] tracking-[0.3em] uppercase opacity-90">
                {content.intro}
              </p>
            )}

            <h1 className="relative mt-6 mb-0 flex flex-col items-center font-inv-display leading-[0.95] font-normal italic">
              <span className="inv-rise text-[clamp(3.4rem,16vw,7.5rem)]">{names[0]}</span>
              {couple && (
                <>
                  <span className="sr-only"> y </span>
                  {/* El hueco donde nace el «&»: arranca centrado aquí y su plano lo separa al bajar. */}
                  <span aria-hidden="true" className="relative block h-[clamp(3.5rem,15vw,6.5rem)] w-full">
                    <ParallaxLayer depth={-0.22} className="absolute inset-0 grid place-items-center">
                      <span className="font-inv-script text-[clamp(5rem,26vw,11rem)] leading-none not-italic text-inv-accent">
                        &amp;
                      </span>
                    </ParallaxLayer>
                  </span>
                  <span className="inv-rise text-[clamp(3.4rem,16vw,7.5rem)]">{names[1]}</span>
                </>
              )}
            </h1>

            {hasText(content.celebrantLastName) && (
              <p className="mt-4 mb-0 text-[12px] tracking-[0.34em] uppercase opacity-85">
                {content.celebrantLastName}
              </p>
            )}
          </ParallaxLayer>

          {/* XV: el rótulo del evento en caligrafía, encima del nombre y en su propio plano. */}
          {!couple && hasText(flourish) && (
            <ParallaxLayer depth={-0.22} className="order-first mb-6">
              <p className="m-0 text-center font-inv-script text-[clamp(2.6rem,11vw,4.5rem)] leading-none text-inv-accent">
                {flourish}
              </p>
            </ParallaxLayer>
          )}

          <ParallaxLayer depth={-0.04} className="mt-10 flex flex-col items-center">
            <span aria-hidden="true" className="h-12 w-px bg-current opacity-50" />
            <p className="mt-5 mb-0 text-[13px] tracking-[0.28em] uppercase">
              {content.dateLabel}
              {hasText(content.city) && (
                <>
                  <span aria-hidden="true" className="mx-3 opacity-60">
                    ·
                  </span>
                  {content.city}
                </>
              )}
            </p>
            {hasText(content.tagline) && (
              <p className="mx-auto mt-5 mb-0 max-w-sm text-[16px] leading-relaxed opacity-90">{content.tagline}</p>
            )}
            {content.showCountdown && (
              <Countdown startsAt={content.startsAt} variant="rule" tone="onImage" className="mt-9" />
            )}
          </ParallaxLayer>
        </ParallaxFade>
      </div>

      {/* La invitación a bajar: un filete que se descuelga, sin flecha. */}
      <div aria-hidden="true" className="relative flex justify-center pb-8">
        <span className="inv-drop h-16 w-px bg-current opacity-60" />
      </div>
    </ParallaxScene>
  );
}
