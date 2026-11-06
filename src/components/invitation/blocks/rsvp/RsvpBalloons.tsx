import { BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { Reveal } from '../../shared/Reveal';
import {
  Blob,
  CLAY_TAN,
  DoodleHearts,
  HeartBalloon,
  LaurelSprig,
  Squiggle,
  TerracottaHeading,
} from '../../shared/terracotta-ornaments';
import { RsvpAction, RsvpDeadline, type RsvpVariantProps } from './rsvp-parts';

/**
 * `rsvp.balloons` — la confirmación de `terracota`, como la de la referencia: una tarjeta de
 * filete fino con la cabecera en terracota y el título a pincel en blanco, flanqueada por los dos
 * globos de corazón que laten; dentro, la fecha límite y el botón de confirmar.
 *
 * El formulario de la referencia no se copia: la confirmación la resuelve `RsvpAction` —por
 * WhatsApp o en la plataforma, según el plan—, y la tarjeta es su marco. Encima, el encabezado de
 * la sección («Ven a celebrar con nosotros»); la cabecera terracota de la tarjeta lleva el
 * subtítulo a pincel, que hace de «Are You Attending?».
 */
export function RsvpBalloons({ content }: RsvpVariantProps) {
  return (
    <BlockSection block="rsvp" variant="balloons" className="relative isolate overflow-hidden">
      <Blob shape="wave" outline className={`-top-6 -left-10 -z-10 h-44 w-52 -scale-x-100 ${CLAY_TAN}`} />
      <Blob shape="drop" rotate={-20} className="top-1/2 -right-28 -z-10 h-72 w-52 text-inv-accent" />
      <Squiggle className="-right-6 bottom-6 -z-10 hidden w-56 lg:block" />

      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <TerracottaHeading eyebrow={content.eyebrow} title={content.title} />
        </Reveal>

        <Reveal className="relative mx-auto mt-12 w-full max-w-sm px-6">
          <HeartBalloon letter="♥" className="-bottom-6 -left-1 z-10 w-14" />
          <HeartBalloon
            letter="♥"
            tone="accent"
            className="top-[38%] -right-1 z-10 w-14"
            style={{ animationDelay: '0.4s' }}
          />
          <div className="border border-solid border-inv-line bg-inv-bg shadow-inv-soft">
            <div className="bg-inv-primary px-6 py-5 text-center text-inv-on-primary">
              {hasText(content.subtitle) ? (
                <p className="m-0 font-inv-display text-[1.6rem] leading-tight">{content.subtitle}</p>
              ) : (
                <DoodleHearts className="w-10 [&_path]:stroke-inv-on-primary" />
              )}
            </div>
            <div className="flex flex-col items-center px-6 pt-8 pb-10 text-center">
              {hasText(content.subtitle) && <DoodleHearts />}
              {hasText(content.deadlineLabel) && (
                <RsvpDeadline deadlineLabel={content.deadlineLabel} className="mt-5" />
              )}
              <RsvpAction content={content} className="mt-7" />
              {hasText(content.note) && (
                <p className="mx-auto mt-6 mb-0 max-w-xs text-[14.5px] leading-relaxed text-inv-ink-soft">
                  {content.note}
                </p>
              )}
            </div>
          </div>
        </Reveal>
        <LaurelSprig className="mt-10" />
      </div>
    </BlockSection>
  );
}
