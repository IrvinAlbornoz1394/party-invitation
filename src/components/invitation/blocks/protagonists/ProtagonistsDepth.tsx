'use client';

import clsx from 'clsx';
import { hasText } from '../../shared/has-text';
import { DepthHeading, DepthPhoto, DepthWash } from '../../shared/mirador-parts';
import { ParallaxLayer, ParallaxScene } from '../../shared/Parallax';
import type { ProtagonistsVariantProps } from './protagonists-variant';

/**
 * `protagonists.depth` — los protagonistas de `mirador`: un encabezado sobre papel y luego **una
 * ventana por persona**, casi a pantalla completa, con su foto quedándose atrás.
 *
 * Las ventanas alternan el lado del texto —la primera a la izquierda, la segunda a la derecha—
 * para que dos fotos seguidas no se lean como la misma sección repetida. El nombre va en su propio
 * plano, un poco más rápido que la página.
 */
export function ProtagonistsDepth({ content }: ProtagonistsVariantProps) {
  return (
    <section data-block="protagonists" data-variant="depth" className="w-full font-inv-body">
      <ParallaxScene as="div" className="bg-inv-bg py-[calc(var(--inv-space-block)*0.7)] text-inv-ink">
        <DepthWash flip />
        <DepthHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          className="px-6"
        />
      </ParallaxScene>

      {content.people.map((person, index) => {
        const right = index % 2 === 1;
        return (
          // El índice como clave es correcto: las personas se pintan una vez desde contenido guardado.
          <ParallaxScene
            key={index}
            as="div"
            className="inv-on-photo flex min-h-[calc(var(--inv-viewport,100svh)*0.85)] items-end bg-inv-ink"
          >
            <DepthPhoto image={person.image} sizes="100vw" />

            <div
              className={clsx(
                'relative mx-auto w-full max-w-5xl px-6 pt-24 pb-16 sm:px-10 sm:pb-20',
                right ? 'text-right' : 'text-left',
              )}
            >
              <ParallaxLayer depth={-0.08}>
                {hasText(person.role) && (
                  <p
                    className={clsx(
                      'm-0 flex items-center gap-3 text-[11px] tracking-[0.32em] uppercase opacity-90',
                      right && 'justify-end',
                    )}
                  >
                    {!right && <span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />}
                    {person.role}
                    {right && <span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />}
                  </p>
                )}
                <h3 className="mt-4 mb-0 font-inv-display text-[clamp(3rem,14vw,6.5rem)] leading-[0.95] font-normal italic">
                  {person.name}
                </h3>
                {hasText(person.bio) && (
                  <p
                    className={clsx(
                      'mt-6 mb-0 max-w-sm text-[16px] leading-relaxed opacity-90',
                      right && 'ml-auto',
                    )}
                  >
                    {person.bio}
                  </p>
                )}
              </ParallaxLayer>
            </div>
          </ParallaxScene>
        );
      })}
    </section>
  );
}
