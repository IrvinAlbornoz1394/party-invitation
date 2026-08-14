import { CalendarCheck } from 'lucide-react';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { RsvpAction, type RsvpVariantProps } from './rsvp-parts';

/**
 * `rsvp.ticket` — la confirmación con forma de pase.
 *
 * Un cuerpo con la petición y el botón, un talón con la fecha límite, y entre los dos una línea
 * troquelada con sus muescas. Es la más lúdica de las tres y la que mejor funciona en eventos
 * con carácter —quince años, una fiesta temática, algo de empresa— porque convierte confirmar en
 * recoger tu pase en lugar de rellenar un trámite.
 *
 * La forma no es un adorno gratuito: un boleto se entiende sin leer nada. Alguien que baja
 * deprisa por la invitación reconoce la silueta antes que el texto, y eso es media batalla en el
 * único bloque que necesita que se detengan.
 *
 * ## El troquel
 *
 * Es un borde punteado más dos muescas: dos círculos del color del papel de la sección, medio
 * salidos del pase por los extremos de la línea. Ese detalle —y no la línea— es lo que hace que
 * se lea como papel troquelado; sin las muescas es una tarjeta con una raya en medio.
 *
 * En móvil el troquel es horizontal y en escritorio vertical, así que hay dos pares de muescas y
 * cada uno aparece con su retícula. La alternativa —una sola pareja recolocada— exigiría
 * calcular posiciones en JavaScript para algo que el CSS resuelve con dos clases.
 *
 * ## Sin fecha límite
 *
 * El talón se queda con el icono de calendario y el texto del botón. Un pase sin talón deja de
 * ser un pase, así que el talón no desaparece: cambia de contenido.
 */
export function RsvpTicket({ content }: RsvpVariantProps) {
  return (
    <BlockSection block="rsvp" variant="ticket">
      <BlockContainer className="max-w-4xl">
        <article className="grid overflow-hidden rounded-inv-lg border border-inv-line bg-inv-surface sm:grid-cols-[1fr_auto]">
          <div className="flex flex-col items-center px-6 py-12 text-center sm:px-14">
            <BlockHeading
              eyebrow={content.eyebrow}
              title={content.title}
              subtitle={content.subtitle}
              align="center"
            />

            <RsvpAction content={content} align="center" className="mt-9" />
          </div>

          {/* El talón. El troquel es el borde de este bloque: arriba en móvil, a la izquierda
              en escritorio. */}
          <div className="relative flex flex-col items-center justify-center gap-4 border-t border-dashed border-inv-line px-6 py-9 text-center sm:w-56 sm:px-8 sm:py-10 sm:border-t-0 sm:border-l">
            <span
              aria-hidden="true"
              className="absolute -top-3 -left-3 size-6 rounded-full bg-inv-bg sm:-top-3 sm:left-0 sm:-translate-x-1/2"
            />
            <span
              aria-hidden="true"
              className="absolute -top-3 -right-3 size-6 rounded-full bg-inv-bg sm:top-auto sm:right-auto sm:-bottom-3 sm:left-0 sm:-translate-x-1/2"
            />

            <CalendarCheck size={24} strokeWidth={1.5} aria-hidden="true" className="text-inv-accent" />

            {content.deadlineLabel ? (
              <>
                <p className="m-0 text-[11px] tracking-[0.28em] text-inv-ink-soft uppercase">
                  Confirma
                </p>
                <p className="m-0 font-inv-display text-[1.35rem] leading-tight text-inv-primary">
                  {content.deadlineLabel}
                </p>
              </>
            ) : (
              <p className="m-0 text-[12px] tracking-[0.22em] text-inv-ink-soft uppercase">
                {content.confirmLabel}
              </p>
            )}
          </div>
        </article>

        {content.note && <BlockNote note={content.note} className="mt-8 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
