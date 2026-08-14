import { Stamp } from 'lucide-react';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { RsvpAction, type RsvpVariantProps } from './rsvp-parts';

/**
 * `rsvp.postcard` — el reverso de una postal.
 *
 * La cara escrita de una tarjeta postal: el mensaje a la izquierda, la línea divisoria en medio,
 * y a la derecha el sello y el matasellos con la fecha límite. El botón va abajo, donde iría la
 * dirección, que es exactamente donde el ojo espera encontrar el remate.
 *
 * ## El destinatario, más adelante
 *
 * En una postal, la mitad derecha es de quien la recibe. Aquí está deliberadamente vacía entre el
 * sello y el botón: es el hueco de la personalización por familia —«Familia Robles Cámara · 4
 * lugares»— que llegará con el plan superior, desde la lista de invitados del panel.
 *
 * No se dibujan renglones de relleno mientras tanto. Unas líneas vacías en una pantalla no se
 * leen como «aquí se escribe», se leen como algo que no cargó; y ese dato **no es contenido de
 * este bloque** sino contexto de quien abre el enlace, así que entrará por el mismo camino que la
 * pasarela de confirmación. Ver la nota de `domain/invitation/blocks/rsvp.ts`.
 *
 * Es la contraria de `rsvp.reply-card` aunque las dos vengan de la papelería: la tarjeta de
 * respuesta es vertical, simétrica y formal —una boda de etiqueta—; la postal es horizontal,
 * asimétrica y de viaje —una boda en la playa, una despedida, un evento fuera de la ciudad—.
 *
 * ## El matasellos lleva la fecha límite
 *
 * No es un adorno con la fecha metida a la fuerza: en una postal el matasellos es literalmente
 * la marca del día en que se envió, y aquí marca el día en que hay que contestar. El dato más
 * fácil de olvidar de este bloque queda dentro del elemento que más se mira.
 *
 * Sin fecha límite el matasellos desaparece y el sello se queda solo, que es como llega una
 * postal sin franquear. La composición no cambia.
 *
 * ## El sello va torcido
 *
 * Tres grados, con la propiedad `rotate` —no con `transform`— para no pelearse con nada. Un
 * sello perfectamente recto delata que es un dibujo; torcido, delata que alguien lo pegó.
 */
export function RsvpPostcard({ content }: RsvpVariantProps) {
  return (
    <BlockSection block="rsvp" variant="postcard">
      <BlockContainer className="max-w-4xl">
        <article className="grid overflow-hidden rounded-inv-sm border border-inv-line bg-inv-surface sm:grid-cols-2">
          <div className="flex flex-col justify-center px-7 py-10 sm:px-10 sm:py-12">
            {content.eyebrow && (
              <p className="m-0 text-[11px] tracking-[0.3em] text-inv-accent uppercase">
                {content.eyebrow}
              </p>
            )}

            <h2 className="mt-5 mb-0 font-inv-display text-[clamp(1.5rem,3.2vw,2.1rem)] leading-tight font-light text-inv-primary">
              {content.title}
            </h2>

            {content.subtitle && (
              <p className="mt-4 mb-0 text-[14.5px] leading-relaxed text-inv-ink-soft">
                {content.subtitle}
              </p>
            )}
          </div>

          <div className="flex flex-col border-t border-inv-line px-7 py-10 sm:border-t-0 sm:border-l sm:px-10 sm:py-12">
            <div className="flex items-start justify-between gap-6">
              {content.deadlineLabel ? (
                /* El matasellos: un círculo de trazo discontinuo, como el sellado de correos. */
                <p className="m-0 grid size-20 shrink-0 place-items-center sm:size-24 rounded-full border border-dashed border-inv-line px-3 text-center text-[10.5px] leading-tight tracking-[0.12em] text-inv-ink-soft uppercase">
                  {content.deadlineLabel}
                </p>
              ) : (
                <span aria-hidden="true" />
              )}

              <span
                aria-hidden="true"
                className="grid size-14 shrink-0 rotate-[3deg] place-items-center sm:size-16 border border-dashed border-inv-line text-inv-accent"
              >
                <Stamp size={26} strokeWidth={1.4} />
              </span>
            </div>

            {/* El hueco del destinatario: aquí irá el saludo a la familia y su cupo. El botón se
                empuja al pie de la columna con `mt-auto`, así que ese aire es el que ocupará
                cuando llegue y la composición no se moverá. */}
            <RsvpAction content={content} align="left" className="mt-auto pt-10" />
          </div>
        </article>

        {content.note && <BlockNote note={content.note} className="mt-8 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
