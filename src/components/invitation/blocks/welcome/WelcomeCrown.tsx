import { BlockImage } from '../../shared/BlockImage';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';
import { CrownGlyph } from '../../shared/paper-ornaments';

/**
 * `welcome.crown` — la corona grabada sobre el retrato, para unos XV.
 *
 * Es la hermana de `welcome.luminous`, y existe por una razón muy concreta: aquella lleva las
 * **alianzas** (`RingsGlyph`), que son un símbolo nupcial incrustado en el componente. Puesta
 * sobre unos XV promete una boda. Y la solución no podía ser preguntarle al bloque de qué tipo de
 * evento es —`docs/PROJECT.md` lo prohíbe y con razón: añadir «bautizo» obligaría a tocar los
 * sesenta componentes—, así que es otra entrada del catálogo. La plantilla de XV la elige; la de
 * boda, no.
 *
 * ## Qué cambia respecto de su hermana
 *
 * El símbolo y el peso del nombre. En una boda lo que se lee primero es «Nuestra boda» y después
 * quiénes se casan, porque son dos nombres. En unos XV **el nombre es el titular**: hay una sola
 * protagonista y el rótulo es solo la ocasión. Por eso aquí el orden está invertido y la
 * manuscrita se reserva para el nombre.
 *
 * ## Por qué no lleva halo
 *
 * `luminous` es un rótulo de neón y esto es papelería grabada: la corona pide filete fino y
 * contraste limpio, no resplandor. Además, el halo obliga al navegador a rasterizar el texto en
 * una capa aparte, y aquí no compra nada.
 */
export function WelcomeCrown({ content }: WelcomeVariantProps) {
  return (
    <WelcomeShell
      variant="crown"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      className="text-inv-on-primary inv-on-photo"
      contentClassName="items-center justify-center px-7 py-14 text-center sm:px-10"
      backdrop={
        <>
          {content.image ? (
            <BlockImage image={content.image} priority className="-z-20 scale-105" />
          ) : (
            <div aria-hidden="true" className="absolute inset-0 -z-20 bg-inv-primary" />
          )}
          {/* Un velo algo más denso que en `luminous`: aquí el texto va sin halo y necesita que la
              fotografía ceda contraste para leerse encima. */}
          <div aria-hidden="true" className="absolute inset-0 -z-10 inv-scrim" data-from="all" />
        </>
      }
    >
      <div className="relative flex max-w-sm flex-col items-center">
        <CrownGlyph className="h-10 w-16 text-inv-accent" />

        {content.eventTypeLabel && (
          <p className="mt-7 mb-0 text-[11.5px] tracking-[0.34em] uppercase opacity-85">
            {content.eventTypeLabel}
          </p>
        )}

        {/* El nombre en manuscrita y en cuerpo grande: en unos XV hay una sola protagonista, y es
            lo que la pantalla tiene que decir antes que nada. */}
        <h2 className="mt-4 mb-0 font-inv-script text-[clamp(2.9rem,16vw,5rem)] leading-[0.85] font-normal">
          {content.celebrantName}
        </h2>

        {content.celebrantLastName && (
          <p className="mt-4 mb-0 font-inv-display text-[12.5px] tracking-[0.3em] uppercase opacity-90">
            {content.celebrantLastName}
          </p>
        )}

        {/* Un filete entre el nombre y lo práctico, del ancho del texto: es lo que separa el
            titular del dato sin meter una línea de más. */}
        <span
          aria-hidden="true"
          className="mt-7 block h-px w-16 bg-current opacity-40"
        />

        {content.note && (
          <p className="mt-7 mb-0 max-w-[19rem] text-[13.5px] leading-relaxed tracking-[0.02em] opacity-90">
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
