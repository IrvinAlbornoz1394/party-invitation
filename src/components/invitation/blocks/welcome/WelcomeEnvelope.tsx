import { BlockImage } from '../../shared/BlockImage';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';
import { initials } from './welcome-name';

/**
 * `welcome.envelope` — un sobre cerrado con su sello de lacre: se rompe el sello y se entra.
 *
 * Es la variante con **gesto**. Las otras dos ponen un botón; esta convierte el botón en el
 * sello, que es el objeto que en la vida real hay que romper para leer una invitación. Es la
 * que mejor justifica que exista una pantalla de bienvenida: no es un peaje, es el sobre.
 *
 * ## El sello ES el botón, y aun así hay texto debajo
 *
 * Un sello que abre y no lo parece es una adivinanza, y en una invitación que se reparte por
 * WhatsApp a gente de todas las edades eso se paga en llamadas al organizador. El sello lleva la
 * etiqueta accesible completa —lo que oye un lector de pantalla— y debajo va el mismo texto a la
 * vista, en pequeño. Quien reconoce el gesto pulsa el sello; quien no, lee qué hacer.
 *
 * ## Las iniciales
 *
 * Salen del nombre, no de un campo aparte. Un campo «iniciales» en el contenido sería una cosa
 * más que el organizador puede dejar vacía o escribir mal —y que se contradiría con el nombre de
 * al lado— para ahorrar dos líneas de código.
 */
export function WelcomeEnvelope({ content }: WelcomeVariantProps) {
  return (
    <WelcomeShell
      variant="envelope"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      className="text-inv-on-primary"
      contentClassName="items-center justify-center px-6 py-12 text-center"
      backdrop={
        <>
          {/* El color del tema es el forro del sobre; la foto, si la hay, solo lo matiza. */}
          <div aria-hidden="true" className="absolute inset-0 -z-20 bg-inv-primary" />
          {content.image && (
            <BlockImage image={content.image} priority className="-z-10 opacity-25" />
          )}
        </>
      }
    >
      {/*
        La tarjeta. `shadow-inv-soft` la levanta del forro: sin sombra, un rectángulo claro sobre
        un fondo de color se lee como un hueco recortado y no como un papel encima.
      */}
      <div className="relative w-full max-w-sm rounded-inv-lg bg-inv-surface px-8 py-12 text-inv-ink shadow-inv-soft sm:px-10 sm:py-14">
        {content.eventTypeLabel && (
          <p className="m-0 text-[10.5px] tracking-[0.32em] text-inv-ink-soft uppercase">
            {content.eventTypeLabel}
          </p>
        )}

        <h2 className="mt-5 mb-0 font-inv-display text-[clamp(2rem,8vw,2.9rem)] leading-tight font-light">
          {content.celebrantName}
          {content.celebrantLastName && (
            <span className="mt-3 block text-[12px] tracking-[0.36em] text-inv-ink-soft uppercase">
              {content.celebrantLastName}
            </span>
          )}
        </h2>

        {content.dateLabel && (
          <p className="mt-6 mb-0 text-[12px] tracking-[0.22em] text-inv-ink-soft uppercase">
            {content.dateLabel}
          </p>
        )}

        {content.note && (
          <p className="mt-6 mb-0 text-[14px] leading-relaxed text-inv-ink-soft">{content.note}</p>
        )}

        {/* El filete separa la tarjeta del sello: sin él, el círculo se lee como parte del texto
            y pierde la condición de objeto que hay que tocar. */}
        <span aria-hidden="true" className="mt-10 mb-8 block h-px w-full bg-inv-line" />

        <WelcomeOpenButton
          label={content.openLabel}
          className="mx-auto grid size-[5.5rem] place-items-center rounded-full bg-inv-accent text-inv-on-primary shadow-inv-soft hover:scale-[1.04] active:scale-[0.98]"
        >
          {/* Dos anillos concéntricos y las iniciales: el vocabulario de un lacre, sin una imagen
              que habría que dibujar por tema. */}
          <span
            aria-hidden="true"
            className="grid size-[4.4rem] place-items-center rounded-full border border-current/35"
          >
            <span className="font-inv-display text-[1.6rem] leading-none tracking-[0.08em]">
              {initials(content.celebrantName, content.celebrantLastName)}
            </span>
          </span>
        </WelcomeOpenButton>

        <p
          /* Decorativo: el botón de arriba ya anuncia lo mismo, y leerlo dos veces seguidas es
             ruido para quien escucha la página. */
          aria-hidden="true"
          className="mt-5 mb-0 text-[11px] tracking-[0.26em] text-inv-ink-soft uppercase"
        >
          {content.openLabel}
        </p>
      </div>
    </WelcomeShell>
  );
}
