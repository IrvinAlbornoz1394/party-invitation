import { BlockImage } from '../../shared/BlockImage';
import { BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { LeafBackdrop, NocturneHeading } from '../../shared/nocturne-ornaments';
import { Reveal } from '../../shared/Reveal';
import type { StoryVariantProps } from './story-variant';

/**
 * `story.ceremony` — el relato de `nocturne`, compuesto como la sección «ceremonia oficial» de su
 * referencia: franja celeste con hojas de línea casi transparentes que suben y bajan, el título
 * en capitulares, la foto a lo ancho y, debajo, el subtítulo convertido en **una frase grande en
 * capitulares** antes del texto corrido.
 *
 * Es la única historia del catálogo que pone el subtítulo después de la foto y a cuerpo de
 * titular: en las demás es una entradilla bajo el título. Aquí funciona de dedicatoria —«hoy
 * celebramos el amor de…»—, y la foto entre el título y ella es la pausa.
 *
 * Sin foto, la frase sube y la sección queda como una columna de texto sobre el celeste.
 */
export function StoryCeremony({ content }: StoryVariantProps) {
  return (
    <BlockSection block="story" variant="ceremony" className="relative isolate bg-inv-surface">
      <LeafBackdrop />

      <div className="mx-auto max-w-xl px-6">
        <Reveal>
          <NocturneHeading eyebrow={content.eyebrow} title={content.title} flourish="none" />
        </Reveal>

        {content.image && (
          <Reveal delay={0.08} className="relative mt-10 aspect-[4/3.5] w-full overflow-hidden">
            <BlockImage image={content.image} sizes="(min-width: 640px) 576px, 92vw" />
          </Reveal>
        )}

        {hasText(content.subtitle) && (
          <Reveal delay={0.12}>
            <p className="mx-auto mt-10 mb-0 max-w-lg text-center font-inv-display text-[clamp(1.5rem,7vw,2rem)] leading-[1.25] text-inv-ink">
              {content.subtitle}
            </p>
          </Reveal>
        )}

        <Reveal delay={0.16} className="mt-8 grid gap-4 text-center">
          {content.body.map((paragraph, index) => (
            <p key={index} className="m-0 text-[16px] leading-[1.75] text-inv-ink-soft">
              {paragraph}
            </p>
          ))}
        </Reveal>

        {content.highlight && (
          <Reveal delay={0.2}>
            <figure className="mx-auto mt-10 mb-0 max-w-md text-center">
              <blockquote className="m-0 font-inv-display text-[18px] leading-relaxed text-inv-primary">
                “{content.highlight.quote}”
              </blockquote>
              {hasText(content.highlight.author) && (
                <figcaption className="mt-3 text-[13px] tracking-[0.16em] text-inv-ink-soft uppercase">
                  {content.highlight.author}
                </figcaption>
              )}
            </figure>
          </Reveal>
        )}

        {hasText(content.signature) && (
          <p className="mt-10 mb-0 text-center font-inv-script text-[2.6rem] leading-none text-inv-ink">
            {content.signature}
          </p>
        )}
      </div>
    </BlockSection>
  );
}
