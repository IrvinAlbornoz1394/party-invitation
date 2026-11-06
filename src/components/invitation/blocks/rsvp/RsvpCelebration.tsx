import { BlockImage } from '../../shared/BlockImage';
import { hasText } from '../../shared/has-text';
import { DoodleHeart, FloralSpray, Flourish, LeafBackdrop } from '../../shared/nocturne-ornaments';
import { WATERCOLOR } from '../../shared/nocturne-assets';
import { Reveal } from '../../shared/Reveal';
import { RsvpAction, RsvpDeadline, type RsvpVariantProps } from './rsvp-parts';

/**
 * `rsvp.celebration` — la confirmación de `nocturne`: la foto del bloque a sangre bajo un velo
 * azul medianoche, el corazón dorado, el título en capitulares blancas a cuerpo de cartel y, debajo,
 * una tarjeta de papel claro encabalgada en el canto de la foto con el plazo y el botón.
 *
 * Es el «¡Feliz día! No vemos la hora…» de la referencia seguido de su formulario. Aquí no hay
 * formulario: el botón es el de siempre (`RsvpAction`) y decide él si abre WhatsApp o confirma en
 * la plataforma, así que la tarjeta solo tiene que darle sitio.
 *
 * El dibujo es un corazón y no las alianzas de la referencia: unas alianzas sobre unos XV
 * prometerían una boda (ver `welcome.crown`).
 *
 * Sin foto, el velo se queda sobre el azul liso del tema y la sección se lee igual.
 */
export function RsvpCelebration({ content }: RsvpVariantProps) {
  return (
    <section
      data-block="rsvp"
      data-variant="celebration"
      className="relative w-full bg-inv-bg pb-[var(--inv-space-block)] font-inv-body text-inv-ink"
    >
      <div className="relative isolate overflow-hidden bg-inv-ink px-6 pt-[var(--inv-space-block)] pb-36 text-center">
        {content.image && <BlockImage image={content.image} sizes="100vw" className="-z-20" />}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-inv-ink/72" />

        <Reveal>
          <DoodleHeart className="mx-auto w-24 text-inv-bg" />
          {hasText(content.eyebrow) && (
            <p className="mt-6 mb-0 font-inv-display text-[13px] tracking-[0.22em] text-inv-bg/85 uppercase">
              {content.eyebrow}
            </p>
          )}
          <h2 className="mx-auto mt-3 mb-0 max-w-md font-inv-display text-[clamp(2.1rem,10vw,2.9rem)] leading-[1.12] font-semibold text-inv-bg">
            {content.title}
          </h2>
          {hasText(content.subtitle) && (
            <p className="mx-auto mt-5 mb-0 max-w-sm text-[16px] leading-relaxed text-inv-bg/85">
              {content.subtitle}
            </p>
          )}
        </Reveal>
      </div>

      <Reveal delay={0.08} className="relative mx-5 -mt-24 sm:mx-auto sm:max-w-md">
        <div className="relative isolate overflow-hidden bg-[color-mix(in_srgb,var(--inv-color-line)_40%,#f4f4f4)] px-6 pt-10 pb-11 text-center shadow-inv-soft">
          <LeafBackdrop />
          <FloralSpray
            asset={WATERCOLOR.bouquet}
            rotate={150}
            className="-right-12 -bottom-14 -z-10 w-36 opacity-90"
          />
          <Flourish className="w-40" />
          {hasText(content.deadlineLabel) && (
            <RsvpDeadline deadlineLabel={content.deadlineLabel} className="mt-6" />
          )}
          <RsvpAction content={content} className="mt-7" />
          {hasText(content.note) && (
            <p className="mx-auto mt-6 mb-0 max-w-xs text-[14.5px] leading-relaxed text-inv-ink-soft">
              {content.note}
            </p>
          )}
        </div>
      </Reveal>
    </section>
  );
}
