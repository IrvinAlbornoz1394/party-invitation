import { BlockImage } from '../../shared/BlockImage';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';
import { couple, initials } from './welcome-name';

/**
 * `welcome.monogram` — el monograma enorme sobre la fotografía, como una marca de agua.
 *
 * La pieza es la letra. Dos iniciales a cuerpo descomunal —hasta el 34 % del ancho de la
 * pantalla— con una «&» manuscrita encajada en medio, y el resto del texto reducido a lo mínimo
 * para no competir con ellas. Es el lenguaje de la identidad visual de una boda, el que los
 * novios acaban poniendo en las servilletas.
 *
 * ## Qué pasa cuando no hay pareja
 *
 * `couple()` devuelve las dos partes solo si el nombre trae un símbolo de unión —«Ana & Diego»,
 * «Ana y Diego»—. En unos XV el nombre es uno solo, y ahí el monograma de dos letras con «&» no
 * significa nada: se pinta **una** inicial, la del nombre, a cuerpo aún mayor. No hay ninguna
 * pregunta sobre el tipo de evento, que es lo que el catálogo prohíbe — la forma del nombre es la
 * que decide.
 *
 * ## La cápsula del rótulo
 *
 * El rótulo va dentro de una pastilla oscura y no suelto sobre la foto. Es la única forma de que
 * un texto de once píxeles sobreviva encima de una fotografía cualquiera: el velo general aclara
 * la imagen lo justo para las letras grandes, y para las pequeñas hace falta un fondo propio.
 */
export function WelcomeMonogram({ content }: WelcomeVariantProps) {
  const pair = couple(content.celebrantName);

  return (
    <WelcomeShell
      variant="monogram"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      className="text-inv-on-primary"
      contentClassName="items-center justify-center px-6 py-14 text-center"
      backdrop={
        <>
          {content.image ? (
            <BlockImage image={content.image} priority className="-z-20" />
          ) : (
            <div aria-hidden="true" className="absolute inset-0 -z-20 bg-inv-primary" />
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-linear-to-b from-inv-overlay/70 via-inv-overlay/35 to-inv-overlay/75"
          />
        </>
      }
    >
      <div className="relative flex w-full max-w-sm flex-col items-center">
        {content.eventTypeLabel && (
          <p className="m-0 rounded-full bg-black/45 px-5 py-1.5 text-[11px] tracking-[0.22em] uppercase backdrop-blur-[2px]">
            {content.eventTypeLabel}
          </p>
        )}

        <p className="mt-3 mb-0 font-inv-script text-[clamp(1.4rem,6vw,2rem)] leading-none opacity-95">
          {content.celebrantName}
        </p>

        {/*
          El monograma. `leading-[0.78]` y no el interlineado normal: a este cuerpo, el espacio que
          la tipografía reserva por encima y por debajo de la letra es mayor que la propia letra, y
          sin apretarlo el bloque flota separado del nombre que va arriba.
        */}
        <p
          aria-hidden="true"
          className="mt-1 mb-0 flex items-center justify-center font-inv-display text-[clamp(5rem,34vw,10rem)] leading-[0.78] font-light"
        >
          {pair ? (
            <>
              <span>{initials(pair[0], null)}</span>
              {/* La «&» a un tercio del cuerpo y en manuscrita: es lo que separa un monograma de
                  dos letras sueltas. */}
              <span className="mx-[-0.06em] self-center font-inv-script text-[0.34em] opacity-90">
                &amp;
              </span>
              <span>{initials(pair[1], null)}</span>
            </>
          ) : (
            <span>{initials(content.celebrantName, null)}</span>
          )}
        </p>

        {content.celebrantLastName && (
          <p className="mt-1 mb-0 text-[11px] tracking-[0.34em] uppercase opacity-85">
            {content.celebrantLastName}
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
