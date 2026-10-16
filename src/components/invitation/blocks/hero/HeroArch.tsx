import { requireDesignAsset } from '@/lib/design-assets';
import { ArchFrame } from '../../shared/ArchFrame';
import { BlockImage } from '../../shared/BlockImage';
import { Countdown } from '../../shared/Countdown';
import { DesignAsset } from '../../shared/DesignAsset';
import { ScrollHint } from '../../shared/ScrollHint';
import type { HeroVariantProps } from './hero-variant';
import { hasText } from '../../shared/has-text';

const FAN = requireDesignAsset('botanical-corner-bottom-001');
const EUCALYPTUS = requireDesignAsset('botanical-eucalyptus-001');
const FERN = requireDesignAsset('botanical-fern-001');
const CLUSTER = requireDesignAsset('botanical-sprig-cluster-001');

/**
 * `hero.arch` — el nombre en manuscrita encima y el retrato dentro de un arco, con las ramas
 * desbordándolo por el pie.
 *
 * Es la portada de `arbor`, y la que fija su gramática: lo que se mira va dentro de un arco y la
 * vegetación **se sale** de él. Las ramas no enmarcan la foto desde fuera, como la ramita de
 * `hero.framed`; nacen en las dos esquinas de la base y suben por encima del filete, que es lo
 * que hace que el arco se lea como la entrada de un jardín y no como un recorte.
 *
 * El orden es el de la referencia: primero el nombre —la portada de unos XV se reconoce por él,
 * no por la cifra, que es lo que separa a esta de `hero.quince`— y debajo el retrato. Lo demás
 * (la invitación, la fecha, la ciudad) va después de la foto, en cuerpo pequeño.
 *
 * ## Arriba cuelga follaje
 *
 * Eucalipto a la izquierda y un helecho a la derecha, girados para que **caigan** desde el canto
 * superior. Es el otro gesto de la referencia —la invitación vista desde debajo de las ramas— y
 * va en `primary` muy tenue para que no compita con el nombre, que va justo debajo.
 *
 * Sin foto, el arco no se pinta vacío: queda un ramillete en su sitio. Un arco sin nada dentro
 * se lee como una imagen que no cargó.
 */
export function HeroArch({ content }: HeroVariantProps) {
  return (
    <section
      data-block="hero"
      data-variant="arch"
      className="relative isolate flex min-h-[var(--inv-viewport,100svh)] w-full flex-col items-center justify-center overflow-hidden bg-inv-bg px-6 pt-16 pb-24 font-inv-body text-inv-ink sm:px-10 sm:pt-20"
    >
      <DesignAsset
        asset={EUCALYPTUS}
        rotate={180}
        className="pointer-events-none absolute -top-10 left-[4%] w-16 text-inv-primary opacity-60 sm:w-24"
      />
      <DesignAsset
        asset={FERN}
        rotate={192}
        className="pointer-events-none absolute -top-12 right-[7%] w-9 text-inv-primary opacity-55 sm:w-14"
      />

      <div className="inv-rise relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <h1 className="m-0 font-inv-script text-[clamp(3.2rem,16vw,5rem)] leading-[1.05] font-normal text-inv-accent">
          {content.celebrantName}
        </h1>
        {hasText(content.celebrantLastName) && (
          <p className="mt-1 mb-0 text-[10.5px] tracking-[0.34em] text-inv-ink-soft uppercase">
            {content.celebrantLastName}
          </p>
        )}

        {content.image ? (
          <div className="relative mt-9 w-[min(74vw,19rem)]">
            <ArchFrame className="aspect-[3/4] w-full">
              <BlockImage
                image={content.image}
                priority
                sizes="(min-width: 640px) 19rem, 74vw"
                className="object-top"
              />
            </ArchFrame>
            {/* Las dos ramas de la base, la derecha más grande: simétricas se leerían como un
                marco impreso, y aquí tienen que parecer plantadas. */}
            <DesignAsset
              asset={FAN}
              flip="x"
              className="pointer-events-none absolute -right-10 -bottom-7 w-36 text-inv-primary opacity-90 sm:-right-14 sm:w-44"
            />
            <DesignAsset
              asset={FAN}
              className="pointer-events-none absolute -bottom-6 -left-8 w-24 text-inv-primary opacity-80 sm:-left-12 sm:w-32"
            />
          </div>
        ) : (
          <DesignAsset asset={CLUSTER} className="mt-8 w-28 text-inv-primary opacity-90" />
        )}

        {hasText(content.intro) && (
          <p className="mt-10 mb-0 max-w-xs font-inv-display text-[clamp(1.05rem,4.6vw,1.3rem)] leading-snug text-inv-ink italic">
            {content.intro}
          </p>
        )}
        {hasText(content.eventTypeLabel) && (
          <p className="mt-4 mb-0 font-inv-script text-[clamp(2rem,9vw,2.7rem)] leading-none text-inv-accent">
            {content.eventTypeLabel}
          </p>
        )}
        {hasText(content.tagline) && (
          <p className="mt-5 mb-0 max-w-xs text-[14px] leading-relaxed text-inv-ink-soft">
            {content.tagline}
          </p>
        )}
        <p className="mt-7 mb-0 text-[11.5px] tracking-[0.26em] text-inv-primary uppercase">
          {content.dateLabel}
        </p>
        {hasText(content.city) && (
          <p className="mt-2 mb-0 text-[12.5px] tracking-[0.1em] text-inv-ink-soft">
            {content.city}
          </p>
        )}
        {content.showCountdown && (
          <Countdown startsAt={content.startsAt} variant="arch" tone="onSurface" className="mt-9" />
        )}
      </div>

      <ScrollHint tone="onSurface" />
    </section>
  );
}
