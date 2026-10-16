import clsx from 'clsx';
import { Heart } from 'lucide-react';
import { requireDesignAsset } from '@/lib/design-assets';
import { BlockImage } from '../../shared/BlockImage';
import { Countdown } from '../../shared/Countdown';
import { DesignAsset } from '../../shared/DesignAsset';
import { PolaroidFrame } from '../../shared/PolaroidFrame';
import { ScrollHint } from '../../shared/ScrollHint';
import type { HeroVariantProps } from './hero-variant';
import { hasText } from '../../shared/has-text';

const FLOWER = requireDesignAsset('symbol-flower-pink-001');
const CORNER = requireDesignAsset('corner-floral-blush-001');

/**
 * `hero.polaroid` — el nombre en manuscrita enorme, entre dos rótulos en versalitas, y debajo el
 * retrato en una instantánea girada con una flor apoyada en la esquina.
 *
 * Es la portada de `blush`, y la que fija su gramática: lo que se mira va en una polaroid **un
 * poco torcida**, y una flor de verdad —a color, no de línea— se apoya encima del marco, como si
 * alguien la hubiera dejado sobre la foto. Las otras portadas recortan el retrato (arco,
 * medallón, ventana) o lo ponen a sangre; esta es la única que lo enseña como un objeto que se
 * puede coger.
 *
 * El orden es el de la referencia: invitación, nombre, tipo de evento, foto, frase. El nombre va
 * en el acento y no en el principal porque el principal es el de los botones, y el nombre a ese
 * tamaño en el mismo color se leería como uno más.
 *
 * Sin foto, la polaroid no se pinta vacía: queda la flor sola, a buen tamaño. Un marco blanco
 * sin nada dentro se lee como una foto que no cargó.
 */
export function HeroPolaroid({ content }: HeroVariantProps) {
  return (
    <section
      data-block="hero"
      data-variant="polaroid"
      className="relative isolate flex min-h-[var(--inv-viewport,100svh)] w-full flex-col items-center justify-center overflow-hidden bg-inv-bg px-6 pt-16 pb-24 font-inv-body text-inv-ink sm:px-10 sm:pt-20"
    >
      <DesignAsset
        asset={CORNER}
        className="pointer-events-none absolute top-0 left-0 -z-10 w-36 opacity-90 sm:w-52"
      />
      <DesignAsset
        asset={CORNER}
        rotate={180}
        className="pointer-events-none absolute right-0 bottom-0 -z-10 w-40 opacity-80 sm:w-56"
      />

      <div className="inv-rise relative z-10 flex w-full max-w-md flex-col items-center text-center">
        {hasText(content.intro) && (
          <p className="m-0 max-w-xs text-[10.5px] leading-relaxed tracking-[0.3em] text-inv-ink-soft uppercase">
            {content.intro}
          </p>
        )}
        <h1
          className={clsx(
            hasText(content.intro) ? 'mt-3' : 'mt-0',
            'mb-0 font-inv-script text-[clamp(3.4rem,17vw,5.4rem)] leading-[1.05] font-normal text-inv-accent',
          )}
        >
          {content.celebrantName}
        </h1>
        {hasText(content.eventTypeLabel) && (
          <p className="mt-1 mb-0 flex items-center gap-3 font-inv-display text-[clamp(1.05rem,5vw,1.35rem)] tracking-[0.2em] text-inv-primary uppercase">
            <Heart size={10} strokeWidth={0} aria-hidden="true" className="fill-current opacity-70" />
            {content.eventTypeLabel}
            <Heart size={10} strokeWidth={0} aria-hidden="true" className="fill-current opacity-70" />
          </p>
        )}

        {content.image ? (
          <div className="relative mt-10 w-[min(72vw,18rem)]">
            <PolaroidFrame className="rotate-[-3deg]" photoClassName="aspect-[4/5]">
              <BlockImage
                image={content.image}
                priority
                sizes="(min-width: 640px) 18rem, 72vw"
                className="object-top"
              />
            </PolaroidFrame>
            <DesignAsset
              asset={FLOWER}
              rotate={-28}
              className="pointer-events-none absolute -right-9 -bottom-16 w-24 drop-shadow-[0_8px_8px_rgba(120,60,75,0.2)] sm:-right-12 sm:w-28"
            />
          </div>
        ) : (
          <DesignAsset asset={FLOWER} className="mt-8 w-28" />
        )}

        {hasText(content.tagline) && (
          <p className="mt-12 mb-0 max-w-xs font-inv-display text-[clamp(1rem,4.4vw,1.2rem)] leading-snug text-inv-ink">
            {content.tagline}
          </p>
        )}
        <Heart
          size={11}
          strokeWidth={0}
          aria-hidden="true"
          className="mt-5 fill-current text-inv-accent"
        />
        <p className="mt-5 mb-0 font-inv-display text-[13px] tracking-[0.24em] text-inv-primary uppercase">
          {content.dateLabel}
        </p>
        {hasText(content.city) && (
          <p className="mt-2 mb-0 text-[12.5px] tracking-[0.08em] text-inv-ink-soft">
            {content.city}
          </p>
        )}
        {content.showCountdown && (
          <Countdown startsAt={content.startsAt} variant="bead" tone="onSurface" className="mt-9" />
        )}
      </div>

      <ScrollHint tone="onSurface" />
    </section>
  );
}
