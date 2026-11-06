import { Fragment } from 'react';
import { ActionLink } from '../../shared/ActionLink';
import { BlockImage } from '../../shared/BlockImage';
import { BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { Reveal } from '../../shared/Reveal';
import {
  BRUSH_BUTTON,
  Blob,
  CLAY_TAN,
  CupidArrow,
  DoodleHearts,
  LaurelSprig,
  Squiggle,
} from '../../shared/terracotta-ornaments';
import type { ClosingVariantProps } from './closing-parts';

/** El mensaje con cada `#etiqueta` en terracota, para que la etiqueta se lea de un vistazo. */
function withHashtags(message: string) {
  return message.split(/(#[\p{L}\p{N}_]+)/u).map((part, index) =>
    part.startsWith('#') ? (
      <span key={index} className="font-medium text-inv-primary">
        {part}
      </span>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

/**
 * `closing.hashtag` — la despedida de `terracota`, la «Spread The Love» de la referencia: el título
 * a pincel, el mensaje con la etiqueta de la boda resaltada, la firma y, al lado, la foto del
 * bloque en el marco orgánico de la plantilla sobre una mancha de barro.
 *
 * Sin teléfono ni interfaz de red social a propósito: una captura de pantalla imitada se lee como
 * anuncio y no como invitación. La etiqueta en terracota basta para pedir las fotos. Sin foto, el
 * marco se queda en crema con los corazones.
 */
export function ClosingHashtag({ content }: ClosingVariantProps) {
  return (
    <BlockSection block="closing" variant="hashtag" className="relative isolate overflow-hidden bg-inv-surface">
      <Blob shape="slab" className="top-16 -left-24 -z-10 h-72 w-36 text-inv-accent" />
      <Squiggle className="right-0 bottom-10 -z-10 hidden w-48 lg:block" />

      <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 lg:grid-cols-2">
        <Reveal className="text-center lg:text-left">
          {hasText(content.eyebrow) && (
            <p className="m-0 text-[12.5px] font-semibold tracking-[0.2em] text-inv-primary uppercase">
              {content.eyebrow}
            </p>
          )}
          <h2 className="mt-2 mb-0 font-inv-display text-[clamp(2rem,9vw,2.9rem)] leading-[1.15] font-normal text-inv-ink">
            {content.title}
          </h2>
          {hasText(content.message) && (
            <p className="mx-auto mt-4 mb-0 max-w-sm text-[16.5px] leading-relaxed text-inv-ink-soft lg:mx-0">
              {withHashtags(content.message)}
            </p>
          )}
          <CupidArrow className="mt-6 lg:mx-0" />
          {hasText(content.signature) && (
            <p className="mt-5 mb-0 font-inv-display text-[1.6rem] leading-tight text-inv-primary">
              {content.signature}
            </p>
          )}
          {content.action && (
            <ActionLink label={content.action.label} href={content.action.href} className={`mt-7 ${BRUSH_BUTTON}`} />
          )}
        </Reveal>

        <Reveal delay={0.08} className="relative mx-auto w-[min(78vw,22rem)]">
          <Blob shape="drop" className={`-right-10 -bottom-8 -z-10 h-[85%] w-[85%] ${CLAY_TAN}`} />
          <div className="inv-squircle relative aspect-[4/5] overflow-hidden bg-inv-line">
            {content.image ? (
              <BlockImage image={content.image} sizes="(min-width: 1024px) 352px, 78vw" />
            ) : (
              <div className="grid h-full place-items-center">
                <DoodleHearts className="w-16" />
              </div>
            )}
          </div>
          <LaurelSprig className="mx-auto mt-5 w-28" />
        </Reveal>
      </div>
    </BlockSection>
  );
}
