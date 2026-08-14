import { BlockImage } from '../../shared/BlockImage';
import { BlockOrnament } from '../../shared/BlockOrnament';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';

/**
 * `welcome.veil` — la puerta de papelería: papel del tema, filete doble y nada más.
 *
 * Es la que se elige por defecto y la única de las tres que **no depende de una fotografía**.
 * Eso no es una carencia: es su razón de ser. Una pantalla de bienvenida se decide al principio
 * del encargo, cuando muchas veces todavía no hay sesión de fotos, y las otras dos variantes sin
 * imagen se quedan en un color plano. Esta se sostiene con tipografía, que es como se sostiene
 * una participación impresa.
 *
 * ## La fotografía, si la hay, va de filigrana
 *
 * Al fondo, muy lavada y desenfocada. Es deliberado que no se lea como una foto: el retrato
 * tiene su sitio en la portada de la invitación, a un clic de aquí, y repetirlo a sangre en la
 * puerta le quita el efecto a la portada. Aquí solo aporta una textura que evita el color plano.
 *
 * ## El filete doble
 *
 * Dos marcos concéntricos con muy poca separación. Es el recurso más viejo de la papelería fina
 * y el más barato de imitar mal: la clave es que el segundo esté a dos o tres píxeles y sea más
 * tenue, para que se lea como un realce del papel y no como dos rectángulos.
 */
export function WelcomeVeil({ content }: WelcomeVariantProps) {
  return (
    <WelcomeShell
      variant="veil"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      contentClassName="items-center justify-center px-8 py-14 text-center sm:px-12"
      backdrop={
        content.image ? (
          <>
            {/* `-z-20`/`-z-10`: la foto detrás del velo, y los dos detrás del contenido. */}
            <BlockImage
              image={content.image}
              priority
              className="-z-20 scale-105 opacity-15 blur-[3px]"
            />
            <div aria-hidden="true" className="absolute inset-0 -z-10 bg-inv-bg/55" />
          </>
        ) : null
      }
    >
      {/* Los dos filetes. Van dentro del contenido y no del fondo a propósito: al abrir suben con
          el texto, y es ese conjunto —marco y letras juntos— lo que se lee como «la tarjeta se
          va» en lugar de «el texto se desvanece». */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-4 border border-inv-line sm:inset-7"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[1.35rem] border border-inv-line/45 sm:inset-[2.1rem]"
      />

      <div className="relative flex max-w-md flex-col items-center">
        {content.eventTypeLabel && (
          <p className="m-0 text-[11px] tracking-[0.34em] text-inv-ink-soft uppercase">
            {content.eventTypeLabel}
          </p>
        )}

        <BlockOrnament className="mt-6 text-inv-accent" />

        <h2 className="mt-6 mb-0 font-inv-display text-[clamp(2.5rem,11vw,4.5rem)] leading-[0.95] font-light text-inv-ink">
          {content.celebrantName}
          {content.celebrantLastName && (
            <span className="mt-4 block text-[13px] tracking-[0.4em] text-inv-ink-soft uppercase">
              {content.celebrantLastName}
            </span>
          )}
        </h2>

        {content.note && (
          <p className="mt-7 mb-0 max-w-xs text-[14px] leading-relaxed text-inv-ink-soft">
            {content.note}
          </p>
        )}

        {content.dateLabel && (
          <p className="mt-5 mb-0 text-[12px] tracking-[0.24em] text-inv-ink-soft uppercase">
            {content.dateLabel}
          </p>
        )}

        <WelcomeOpenButton label={content.openLabel} tone="onSurface" className="mt-11" />
      </div>
    </WelcomeShell>
  );
}
