import { requireDesignAsset } from '@/lib/design-assets';
import { BlockImage } from '../../shared/BlockImage';
import { DesignAsset } from '../../shared/DesignAsset';
import { LeafSprig } from '../../shared/paper-ornaments';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';

const CORNER = requireDesignAsset('botanical-corner-top-001');

/**
 * `welcome.botanical` — papel claro enmarcado por dos esquinas de ramas, arriba y abajo.
 *
 * La de la papelería de boda civil: fondo casi blanco, ramas en las dos esquinas opuestas y el
 * texto alternando **versalitas y manuscrita** línea a línea, que es el recurso tipográfico que
 * define este estilo. Junto con `welcome.veil` es la otra que se sostiene sin fotografía —aquí la
 * imagen, si la hay, queda como un velo de luz detrás del papel—.
 *
 * ## Las dos esquinas son la misma, girada
 *
 * `botanical-corner-top-001` de la biblioteca de recursos: dos ramas que recorren los bordes y un
 * brote en diagonal. La de abajo es la de arriba con `rotate-180`, así que se leen como un marco y
 * no como dos dibujos distintos que casualmente van juntos. Es el mismo truco que la filigrana.
 *
 * Antes eran dos ramas sueltas; en la primera pantalla de la invitación se quedaban en un adorno
 * de esquina, y una esquina completa es lo que hace que el papel se lea como lámina enmarcada.
 *
 * ## Por qué el color de las ramas es el de acento y no un verde
 *
 * Porque un verde escrito aquí sería el único color del catálogo que no obedece al tema, y en una
 * invitación de tema nocturno saldría una rama de jardín sobre papel oscuro. Con `accent`, la
 * guirnalda es salvia en el tema floral y oro en el elegante, sin tocar este archivo.
 */
export function WelcomeBotanical({ content }: WelcomeVariantProps) {
  return (
    <WelcomeShell
      variant="botanical"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      className="bg-inv-surface"
      contentClassName="items-center justify-center px-9 py-16 text-center"
      backdrop={
        content.image ? (
          <>
            <BlockImage
              image={content.image}
              priority
              className="-z-20 scale-105 opacity-20 blur-[4px]"
            />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-inv-surface/60" />
          </>
        ) : null
      }
    >
      {/* Separadas del canto lo justo para que el vértice respire: pegadas al borde, el
          brote de la esquina se lee como recortado por la pantalla. */}
      <DesignAsset
        asset={CORNER}
        className="pointer-events-none absolute top-4 left-4 w-44 text-inv-accent opacity-75 sm:top-6 sm:left-6 sm:w-60"
      />
      <DesignAsset
        asset={CORNER}
        className="pointer-events-none absolute right-4 bottom-4 w-44 rotate-180 text-inv-accent opacity-75 sm:right-6 sm:bottom-6 sm:w-60"
      />

      <div className="relative flex max-w-xs flex-col items-center text-inv-ink">
        {content.eventTypeLabel && (
          <p className="m-0 text-[12px] tracking-[0.36em] text-inv-ink-soft uppercase">
            {content.eventTypeLabel}
          </p>
        )}

        <h2 className="mt-4 mb-0 font-inv-script text-[clamp(2.75rem,14vw,4rem)] leading-[0.95] font-normal text-inv-accent">
          {content.celebrantName}
        </h2>

        {content.celebrantLastName && (
          <p className="mt-3 mb-0 text-[11px] tracking-[0.36em] text-inv-ink-soft uppercase">
            {content.celebrantLastName}
          </p>
        )}

        {/* La ramita: la separación de una lámina botánica. Va aquí y no como ornamento del
            tema porque su sitio en la composición es este, entre el nombre y la frase. */}
        <LeafSprig className="mt-7 h-7 w-36 text-inv-accent opacity-80" />

        {content.note && (
          <p className="mt-7 mb-0 font-inv-display text-[clamp(1.05rem,5vw,1.35rem)] leading-snug text-inv-ink italic">
            {content.note}
          </p>
        )}

        {content.dateLabel && (
          <p className="mt-6 mb-0 text-[12px] tracking-[0.28em] text-inv-ink-soft uppercase">
            {content.dateLabel}
          </p>
        )}

        {content.venue && (
          <p className="mt-2 mb-0 text-[12.5px] leading-snug text-inv-ink-soft">{content.venue}</p>
        )}

        <WelcomeOpenButton label={content.openLabel} tone="onSurface" className="mt-10" />
      </div>
    </WelcomeShell>
  );
}
