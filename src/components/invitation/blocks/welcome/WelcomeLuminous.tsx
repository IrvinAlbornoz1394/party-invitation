import { BlockImage } from '../../shared/BlockImage';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';
import { RingsGlyph } from './welcome-ornaments';

/**
 * `welcome.luminous` — la manuscrita encendida sobre un fondo de flores en penumbra.
 *
 * El efecto es el de un rótulo de neón cálido: la manuscrita lleva un halo del propio color del
 * texto, así que **brilla en el color del tema** —marfil en uno claro, dorado en uno cálido— sin
 * una sola condición. Con `drop-shadow` y no con `text-shadow` a propósito: el halo sigue el
 * contorno real de la letra y no su caja, que en una caligrafía con trazos finos y largos es la
 * diferencia entre un resplandor y una mancha rectangular.
 *
 * Debajo, el nombre en el color de acento y las alianzas: la jerarquía de la referencia, donde lo
 * que se lee primero es «Nuestra boda» y solo después quiénes se casan.
 *
 * ## El coste de un halo
 *
 * `drop-shadow` obliga al navegador a rasterizar el texto en una capa aparte. Sobre un rótulo de
 * dos líneas no se nota; aplicado a un párrafo largo, en un teléfono de gama baja, sí. Por eso
 * está solo en el rótulo y no en el resto del bloque.
 */
export function WelcomeLuminous({ content }: WelcomeVariantProps) {
  return (
    <WelcomeShell
      variant="luminous"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      className="text-inv-on-primary"
      contentClassName="items-center justify-center px-7 py-14 text-center sm:px-10"
      backdrop={
        <>
          {content.image ? (
            /* La fotografía se oscurece y se desenfoca un punto: es el fondo del rótulo, no el
               tema de la pantalla. Sin el desenfoque, los pétalos compiten con la caligrafía. */
            <BlockImage image={content.image} priority className="-z-20 scale-105 blur-[2px]" />
          ) : (
            <div aria-hidden="true" className="absolute inset-0 -z-20 bg-inv-primary" />
          )}
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-inv-overlay/80" />
        </>
      }
    >
      <div className="relative flex max-w-sm flex-col items-center">
        {content.eventTypeLabel && (
          <p className="m-0 font-inv-script text-[clamp(2.75rem,15vw,4.75rem)] leading-[0.9] drop-shadow-[0_0_16px_currentColor]">
            {content.eventTypeLabel}
          </p>
        )}

        <h2 className="mt-8 mb-0 font-inv-display text-[clamp(1.6rem,7vw,2.4rem)] leading-tight font-normal text-inv-accent">
          {content.celebrantName}
          {content.celebrantLastName && (
            <span className="mt-2 block text-[11px] tracking-[0.34em] uppercase opacity-90">
              {content.celebrantLastName}
            </span>
          )}
        </h2>

        <RingsGlyph className="mt-6 h-9 w-14 text-inv-accent" />

        {content.note && (
          <p className="mt-6 mb-0 max-w-[19rem] text-[13.5px] leading-relaxed tracking-[0.02em] opacity-90">
            {content.note}
          </p>
        )}

        {content.dateLabel && (
          <p className="mt-6 mb-0 text-[12px] tracking-[0.26em] uppercase opacity-85">
            {content.dateLabel}
          </p>
        )}

        <WelcomeOpenButton label={content.openLabel} tone="onImage" className="mt-10" />
      </div>
    </WelcomeShell>
  );
}
