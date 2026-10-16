import clsx from 'clsx';
import { requireDesignAsset } from '@/lib/design-assets';
import { BlockImage } from '../../shared/BlockImage';
import { DesignAsset } from '../../shared/DesignAsset';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';
import { hasText } from '../../shared/has-text';

const FAN = requireDesignAsset('botanical-corner-bottom-001');
const DIVIDER = requireDesignAsset('botanical-divider-002');
const FERN = requireDesignAsset('botanical-fern-001');

/**
 * `welcome.arbor` — la puerta como un arco de jardín: el nombre escrito dentro de un doble
 * filete de medio punto, con ramas brotando de los dos pies.
 *
 * Es la bienvenida de `arbor` y la única del bloque que se compone **dentro de una forma**: las
 * demás reparten la pantalla —foto y banda, papel y esquinas, sobre y sello—; esta pone en medio
 * la misma ventana que luego enmarca el retrato de la portada, solo que vacía de foto y llena de
 * texto. Al abrir, la portada repite el arco con la fotografía dentro, y las dos primeras
 * pantallas riman.
 *
 * El doble filete y no uno: con uno solo, a tamaño de pantalla, el arco se lee como el borde de
 * una tarjeta; con dos, como un vano dibujado.
 *
 * ## La fotografía, si la hay, queda detrás
 *
 * Velada y desenfocada, igual que en `welcome.botanical`. La foto entera vive en la portada, a un
 * clic, y repetirla aquí a sangre haría que la primera pantalla y la segunda contaran lo mismo.
 */
export function WelcomeArbor({ content }: WelcomeVariantProps) {
  return (
    <WelcomeShell
      variant="arbor"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      className="bg-inv-bg"
      contentClassName="items-center justify-center px-6 py-12"
      backdrop={
        content.image ? (
          <>
            <BlockImage
              image={content.image}
              priority
              className="-z-20 scale-105 opacity-25 blur-[5px]"
            />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-inv-bg/70" />
          </>
        ) : null
      }
    >
      <DesignAsset
        asset={FERN}
        rotate={168}
        className="pointer-events-none absolute -top-14 left-[8%] w-10 text-inv-primary opacity-55 sm:w-14"
      />
      <DesignAsset
        asset={FERN}
        rotate={196}
        className="pointer-events-none absolute -top-16 right-[10%] w-12 text-inv-primary opacity-50 sm:w-16"
      />

      <div className="relative w-[min(82vw,21rem)]">
        <div className="relative rounded-t-full border border-inv-accent/55 p-[6px]">
          <div className="flex min-h-[min(62svh,27rem)] flex-col items-center justify-center rounded-t-full border border-inv-accent/30 px-7 pt-20 pb-12 text-center">
            {hasText(content.eventTypeLabel) && (
              <p className="m-0 text-[10.5px] tracking-[0.34em] text-inv-ink-soft uppercase">
                {content.eventTypeLabel}
              </p>
            )}
            <h2
              className={clsx(
                hasText(content.eventTypeLabel) ? 'mt-3' : 'mt-0',
                'mb-0 font-inv-script text-[clamp(3rem,15vw,4.4rem)] leading-[1.05] font-normal text-inv-accent',
              )}
            >
              {content.celebrantName}
            </h2>
            {hasText(content.celebrantLastName) && (
              <p className="mt-1 mb-0 text-[10px] tracking-[0.32em] text-inv-ink-soft uppercase">
                {content.celebrantLastName}
              </p>
            )}
            {/* El divisor separa el nombre de los datos de abajo; sin ninguno, no separa nada. */}
            {(hasText(content.note) || hasText(content.dateLabel) || hasText(content.venue)) && (
              <DesignAsset asset={DIVIDER} className="mt-6 w-28 text-inv-primary opacity-85" />
            )}
            {hasText(content.note) && (
              <p className="mt-6 mb-0 font-inv-display text-[clamp(1rem,4.6vw,1.2rem)] leading-snug text-inv-ink italic">
                {content.note}
              </p>
            )}
            {hasText(content.dateLabel) && (
              <p className="mt-5 mb-0 text-[11px] tracking-[0.24em] text-inv-primary uppercase">
                {content.dateLabel}
              </p>
            )}
            {hasText(content.venue) && (
              <p className="mt-2 mb-0 text-[12px] leading-snug text-inv-ink-soft">
                {content.venue}
              </p>
            )}
          </div>
        </div>

        {/* Las ramas nacen en los pies del arco y suben por fuera del filete. */}
        <DesignAsset
          asset={FAN}
          flip="x"
          className="pointer-events-none absolute -right-9 -bottom-6 w-32 text-inv-primary opacity-90 sm:-right-12 sm:w-40"
        />
        <DesignAsset
          asset={FAN}
          className="pointer-events-none absolute -bottom-5 -left-7 w-24 text-inv-primary opacity-80 sm:-left-10 sm:w-28"
        />
      </div>

      <WelcomeOpenButton label={content.openLabel} tone="onSurface" className="relative mt-10" />
    </WelcomeShell>
  );
}
