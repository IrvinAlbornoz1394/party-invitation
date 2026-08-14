import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { RsvpAction, type RsvpVariantProps } from './rsvp-parts';

/**
 * `rsvp.reply-card` — la tarjeta de respuesta que venía dentro del sobre.
 *
 * Es la pieza de papelería más reconocible de una invitación formal: una tarjeta pequeña con
 * doble filete y «R.S.V.P.» en versalitas. La forma dice «esto es formal, esto se contesta» con
 * un vocabulario que todo el mundo reconoce de una boda, y el mecanismo es el de una invitación
 * digital: un botón que abre WhatsApp o registra la confirmación.
 *
 * ## Dónde irá el nombre de la familia
 *
 * La tarjeta de papel lleva aquí dos renglones para escribir a mano el nombre y los
 * acompañantes. En esta versión **no están**, y no es un olvido: ese hueco es el de la
 * personalización por familia —«Familia Robles Cámara · 4 lugares»— que llegará con el plan
 * superior, cuando el organizador tenga su lista de invitados en el panel.
 *
 * Se ha dejado sin dibujar en lugar de poner unos renglones vacíos porque un renglón en blanco
 * en una pantalla no invita a escribir: invita a pensar que algo no cargó. Y sobre todo porque
 * ese dato **no es contenido de este bloque** sino contexto de quien abre el enlace; entrará por
 * el mismo camino que la pasarela de confirmación, sin tocar el contrato. Ver la nota de
 * `domain/invitation/blocks/rsvp.ts`.
 *
 * Entre el subtítulo y la fecha límite queda el aire donde encajará, así que añadirlo será
 * escribir una línea y no recomponer la tarjeta.
 *
 * ## El doble filete
 *
 * Dos marcos con dos milímetros de aire entre ellos. Es un recurso de imprenta —el mismo de un
 * diploma o una participación— y es lo único que separa esta tarjeta de una caja con borde. El
 * marco de dentro lleva el radio pequeño del tema y el de fuera ninguno, que es como se comporta
 * el papel troquelado de verdad.
 */
export function RsvpReplyCard({ content }: RsvpVariantProps) {
  return (
    <BlockSection block="rsvp" variant="reply-card">
      <BlockContainer className="max-w-xl">
        <article className="border border-inv-line bg-inv-surface p-2">
          <div className="flex flex-col items-center rounded-inv-sm border border-inv-line px-6 py-12 text-center sm:px-10">
            <p className="m-0 font-inv-display text-[clamp(1.6rem,4vw,2.2rem)] leading-none tracking-[0.35em] text-inv-primary">
              R.S.V.P.
            </p>

            {content.eyebrow && (
              <p className="mt-5 mb-0 text-[11px] tracking-[0.3em] text-inv-accent uppercase">
                {content.eyebrow}
              </p>
            )}

            <span aria-hidden="true" className="mt-8 h-px w-16 bg-inv-line" />

            <h2 className="mt-8 mb-0 font-inv-display text-[clamp(1.4rem,3vw,1.9rem)] leading-tight font-light text-inv-ink">
              {content.title}
            </h2>

            {content.subtitle && (
              <p className="mt-4 mb-0 max-w-sm text-[14.5px] leading-relaxed text-inv-ink-soft">
                {content.subtitle}
              </p>
            )}

            {/* Aquí es donde irá el saludo a la familia y su cupo. Ver la nota de arriba. */}

            {content.deadlineLabel && (
              <p className="mt-10 mb-0 font-inv-script text-[clamp(1.3rem,3vw,1.7rem)] leading-none text-inv-accent">
                Se agradece respuesta {content.deadlineLabel.toLowerCase()}
              </p>
            )}

            <RsvpAction content={content} align="center" className="mt-9" />
          </div>
        </article>

        {content.note && <BlockNote note={content.note} className="mt-8 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
