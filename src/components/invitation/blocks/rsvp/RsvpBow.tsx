import { Heart } from 'lucide-react';
import { requireDesignAsset } from '@/lib/design-assets';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DesignAsset } from '../../shared/DesignAsset';
import { RsvpAction, type RsvpVariantProps } from './rsvp-parts';

const BOW = requireDesignAsset('symbol-bow-satin-001');

/**
 * `rsvp.bow` — «RS / VP» en dos renglones de letra de cartel, con un moño de satín atado encima,
 * y debajo la fecha límite, la pregunta y el botón.
 *
 * Es la confirmación de `blush`, y la página más reconocible de la referencia: las siglas a
 * cuerpo enorme en la serif de alto contraste, partidas en dos como un monograma, y el moño
 * cerrando el canto. Las otras nueve confirmaciones son tarjetas, franjas, pases, cartuchos o
 * arcos; esta es la única que hace de **la palabra** la pieza.
 *
 * Las siglas son decoración (`aria-hidden`): para un lector de pantalla «R S V P» deletreado no
 * dice nada, y el título del bloque —«¿Asistirás?»— va justo debajo como encabezado de verdad.
 * Por eso el título no se sustituye por las siglas aunque digan lo mismo: las siglas no se
 * traducen, y una invitación en español necesita la pregunta escrita.
 *
 * La foto del bloque no se pinta: el moño y las siglas ya son la ilustración, y una imagen debajo
 * empujaría el botón fuera de la primera pantalla de la sección.
 */
export function RsvpBow({ content }: RsvpVariantProps) {
  return (
    <BlockSection block="rsvp" variant="bow" className="relative isolate">
      <DesignAsset
        asset={BOW}
        className="pointer-events-none mx-auto w-48 drop-shadow-[0_8px_8px_rgba(120,60,75,0.18)] sm:w-56"
      />

      <BlockContainer className="max-w-md text-center">
        {content.eyebrow && (
          <p className="mt-6 mb-0 text-[10.5px] tracking-[0.34em] text-inv-ink-soft uppercase">
            {content.eyebrow}
          </p>
        )}
        <Heart
          size={10}
          strokeWidth={0}
          aria-hidden="true"
          className="mx-auto mt-3 block fill-current text-inv-accent"
        />

        <p
          aria-hidden="true"
          className="mt-4 mb-0 font-inv-display text-[clamp(5.5rem,30vw,8rem)] leading-[0.82] font-normal tracking-[0.02em] text-inv-primary"
        >
          RS
          <br />
          VP
        </p>

        {content.deadlineLabel && (
          <p className="mt-7 mb-0 font-inv-display text-[12.5px] tracking-[0.26em] text-inv-ink-soft uppercase">
            {content.deadlineLabel}
          </p>
        )}

        <h2 className="mt-7 mb-0 font-inv-script text-[clamp(2.1rem,9vw,2.7rem)] leading-[1.1] font-normal text-inv-accent">
          {content.title}
        </h2>
        {content.subtitle && (
          <p className="mx-auto mt-4 mb-0 max-w-[17rem] text-[14px] leading-relaxed text-inv-ink">
            {content.subtitle}
          </p>
        )}

        <RsvpAction content={content} align="center" className="mt-8" />

        {content.note && (
          <p className="mx-auto mt-8 mb-0 max-w-[17rem] text-[12.5px] leading-relaxed text-inv-ink-soft">
            {content.note}
          </p>
        )}
        <Heart
          size={10}
          strokeWidth={0}
          aria-hidden="true"
          className="mx-auto mt-8 block fill-current text-inv-accent"
        />
      </BlockContainer>
    </BlockSection>
  );
}
