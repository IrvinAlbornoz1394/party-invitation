import clsx from 'clsx';
import { visibleHighlight } from '@/domain/invitation/blocks/story';
import { requireDesignAsset } from '@/lib/design-assets';
import { ArchFrame } from '../../shared/ArchFrame';
import { BlockImage } from '../../shared/BlockImage';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DesignAsset } from '../../shared/DesignAsset';
import { StoryProse, StorySignature } from './story-parts';
import type { StoryVariantProps } from './story-variant';
import { hasText } from '../../shared/has-text';

const FAN = requireDesignAsset('botanical-corner-bottom-001');
const CLUSTER = requireDesignAsset('botanical-sprig-cluster-001');

/**
 * `story.dedication` — la dedicatoria: la frase destacada abre en manuscrita, y el título llega
 * después, a cuerpo grande, como el remate de esa frase.
 *
 * Las demás historias abren con el título y dejan la cita para el medio. Esta invierte el orden,
 * que es como se escribe la dedicatoria de unos XV: primero el pensamiento —«los sueños se
 * vuelven aún más especiales cuando se comparten»—, luego a quién se invita y a qué, y solo
 * entonces el titular («Mis 15 años») en manuscrita grande. El cuerpo baja después, corto y
 * centrado.
 *
 * Es de `arbor`: la columna centrada con un ramillete asomando por cada margen, a distinta
 * altura, y la fotografía —si la hay— en una viñeta de medio punto, la misma ventana que el resto
 * de la plantilla.
 *
 * Sin cita, la sección empieza en el subtítulo y no deja hueco: la cita es la entrada natural,
 * no un requisito.
 */
export function StoryDedication({ content }: StoryVariantProps) {
  const highlight = visibleHighlight(content);
  /* Todo lo que va encima del título es opcional: cada pieza solo se separa de lo que de verdad
     tiene encima, para que la columna no arranque con un hueco. */
  const hasEyebrow = hasText(content.eyebrow);
  const hasSubtitle = hasText(content.subtitle);

  return (
    <BlockSection block="story" variant="dedication" className="relative isolate">
      {/* Un ramillete por margen y a distinta altura: enfrentados a la misma se leerían como los
          soportes de un cuadro, y aquí tienen que parecer crecidos en el borde del papel. */}
      <DesignAsset
        asset={CLUSTER}
        rotate={64}
        className="pointer-events-none absolute top-[38%] -left-10 -z-10 w-24 text-inv-primary opacity-65 sm:-left-4 sm:w-32"
      />
      <DesignAsset
        asset={FAN}
        flip="x"
        rotate={-20}
        className="pointer-events-none absolute -right-10 bottom-[16%] -z-10 w-28 text-inv-primary opacity-60 sm:-right-4 sm:w-36"
      />

      <BlockContainer className="max-w-md text-center">
        {hasText(content.eyebrow) && (
          <p className="m-0 text-[10.5px] tracking-[0.32em] text-inv-ink-soft uppercase">
            {content.eyebrow}
          </p>
        )}

        {highlight && (
          <figure className={clsx('m-0', hasEyebrow && 'mt-5')}>
            <blockquote className="m-0 font-inv-script text-[clamp(1.55rem,6.4vw,2.05rem)] leading-[1.3] text-inv-accent">
              {highlight.quote}
            </blockquote>
            {hasText(highlight.author) && (
              <figcaption className="mt-3 text-[10.5px] tracking-[0.26em] text-inv-ink-soft uppercase">
                {highlight.author}
              </figcaption>
            )}
          </figure>
        )}

        {hasSubtitle && (
          <p
            className={clsx(
              'mx-auto mb-0 max-w-xs text-[14.5px] leading-relaxed text-inv-ink',
              hasEyebrow || highlight ? 'mt-8' : 'mt-0',
            )}
          >
            {content.subtitle}
          </p>
        )}

        <h2
          className={clsx(
            'mb-0 font-inv-script text-[clamp(2.7rem,12vw,3.8rem)] leading-[1.1] font-normal text-inv-accent',
            hasEyebrow || highlight || hasSubtitle ? 'mt-5' : 'mt-0',
          )}
        >
          {content.title}
        </h2>

        <StoryProse body={content.body} className="mx-auto mt-6 max-w-sm" />

        {content.image && (
          <ArchFrame className="mx-auto mt-12 aspect-[3/4] w-40 sm:w-48">
            <BlockImage image={content.image} sizes="12rem" />
          </ArchFrame>
        )}

        {hasText(content.signature) && <StorySignature signature={content.signature} className="mt-10" />}
      </BlockContainer>
    </BlockSection>
  );
}
