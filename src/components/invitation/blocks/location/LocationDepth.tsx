'use client';

import { hasText } from '../../shared/has-text';
import { DepthCard, DepthHeading, DepthPhoto, DepthWash } from '../../shared/mirador-parts';
import { ParallaxLayer, ParallaxScene } from '../../shared/Parallax';
import { VenueFacts, type LocationVariantProps } from './location-parts';

/**
 * `location.depth` — las sedes de `mirador`: el encabezado sobre papel y **una ventana por sede**,
 * con su foto quedándose atrás y la ficha en una tarjeta clara que sube por delante.
 *
 * La tarjeta lleva `inv-on-surface` (vía `DepthCard`), así que `VenueFacts` va en su tono de
 * superficie aunque la ventana esté velada. Sin foto, la ventana es el campo de color del tema.
 */
export function LocationDepth({ content }: LocationVariantProps) {
  return (
    <section data-block="location" data-variant="depth" className="w-full font-inv-body">
      <ParallaxScene as="div" className="bg-inv-bg py-[calc(var(--inv-space-block)*0.7)] text-inv-ink">
        <DepthWash />
        <DepthHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          className="px-6"
        />
      </ParallaxScene>

      {content.venues.map((venue, index) => (
        // El índice como clave es correcto: las sedes se pintan una vez desde contenido guardado.
        <ParallaxScene
          key={index}
          as="div"
          className="inv-on-photo flex min-h-[calc(var(--inv-viewport,100svh)*0.9)] items-center bg-inv-ink"
        >
          <DepthPhoto image={venue.image} />
          <div className="relative mx-auto w-full max-w-5xl px-5 py-20 sm:px-10">
            <ParallaxLayer
              depth={-0.1}
              className={index % 2 === 1 ? 'ml-auto max-w-md' : 'max-w-md'}
            >
              <DepthCard>
                <VenueFacts venue={venue} emphasis="hero" />
              </DepthCard>
            </ParallaxLayer>
          </div>
        </ParallaxScene>
      ))}

      {hasText(content.note) && (
        <ParallaxScene as="div" className="bg-inv-bg py-12 text-inv-ink">
          <DepthWash flip />
          <p className="mx-auto m-0 max-w-md px-6 text-center text-[15px] leading-relaxed text-inv-ink-soft">
            {content.note}
          </p>
        </ParallaxScene>
      )}
    </section>
  );
}
