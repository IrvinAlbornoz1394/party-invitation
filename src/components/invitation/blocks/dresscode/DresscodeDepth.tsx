import { ActionLink } from '../../shared/ActionLink';
import { BlockNote } from '../../shared/BlockNote';
import { hasText } from '../../shared/has-text';
import { DepthHeading, DepthWash, DepthWord } from '../../shared/mirador-parts';
import { ParallaxLayer, ParallaxScene } from '../../shared/Parallax';
import { Reveal } from '../../shared/Reveal';
import { staggerDelay } from '../../shared/stagger';
import { Swatch } from './dresscode-parts';
import type { DresscodeVariantProps } from './dresscode-variant';

/**
 * A qué velocidad flota cada disco. Tres valores que no siguen el orden de la paleta: así dos
 * vecinos nunca se mueven juntos y la fila se desacomoda un poco al bajar, como muestras de tela
 * colgadas.
 */
const FLOAT = [-0.05, -0.14, -0.09, -0.16, -0.04, -0.11] as const;

/**
 * `dresscode.depth` — el código de vestimenta de `mirador`, sobre papel.
 *
 * La paleta en discos grandes, cada uno en su propio plano: al bajar, los colores se separan y
 * se vuelven a juntar. Detrás, el campo de color se aleja y «Dress code» cruza en filete gigante.
 * El acabado metálico lo pone `Swatch`, igual que en el resto del catálogo.
 */
export function DresscodeDepth({ content }: DresscodeVariantProps) {
  return (
    <ParallaxScene block="dresscode" variant="depth" className="bg-inv-bg py-[var(--inv-space-block)] font-inv-body text-inv-ink">
      <DepthWash />
      {/* Una palabra corta: más larga, el filete se cortaba por los lados y parecía un error. */}
      <DepthWord className="top-[8%]">Estilo</DepthWord>

      <div className="mx-auto w-full max-w-3xl px-6 text-center sm:px-10">
        <Reveal>
          <DepthHeading eyebrow={content.eyebrow} title={content.title} />
        </Reveal>

        {hasText(content.description) && (
          <Reveal delay={0.06}>
            <p className="mx-auto mt-6 mb-0 max-w-md font-inv-display text-[clamp(1.15rem,5vw,1.4rem)] leading-snug text-inv-ink italic">
              {content.description}
            </p>
          </Reveal>
        )}

        <ul className="m-0 mt-14 flex list-none flex-wrap justify-center gap-x-6 gap-y-10 p-0 sm:gap-x-9">
          {content.palette.map((swatch, index) => (
            <li key={`${swatch.color}-${index}`} className="w-[5.5rem] sm:w-28">
              <ParallaxLayer depth={FLOAT[index % FLOAT.length]}>
                <Reveal delay={staggerDelay(index, 0.06)}>
                  {/* El disco lo da el envoltorio: `Swatch` redondo trae su propia medida. */}
                  <span className="mx-auto block size-[5.5rem] overflow-hidden rounded-full shadow-inv-soft ring-4 ring-inv-bg sm:size-28">
                    <Swatch swatch={swatch} shape="block" />
                  </span>
                  {hasText(swatch.label) ? (
                    <span className="mt-3 block text-[11px] leading-tight tracking-[0.2em] text-inv-ink-soft uppercase">
                      {swatch.label}
                    </span>
                  ) : (
                    <span className="sr-only">{swatch.color}</span>
                  )}
                </Reveal>
              </ParallaxLayer>
            </li>
          ))}
        </ul>

        {content.action && (
          <ActionLink label={content.action.label} href={content.action.href} className="mt-14" />
        )}

        {hasText(content.note) && <BlockNote note={content.note} className="mx-auto mt-10 max-w-sm text-center" />}
      </div>
    </ParallaxScene>
  );
}
