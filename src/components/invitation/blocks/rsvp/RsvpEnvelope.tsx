import clsx from 'clsx';
import { requireDesignAsset } from '@/lib/design-assets';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { BowCard } from '../../shared/BowCard';
import { DesignAsset } from '../../shared/DesignAsset';
import { RsvpAction, type RsvpVariantProps } from './rsvp-parts';
import { hasText } from '../../shared/has-text';

const ENVELOPE = requireDesignAsset('symbol-envelope-bow-001');
const ROSES = requireDesignAsset('corner-rose-line-001');
const BUTTERFLY = requireDesignAsset('symbol-butterfly-line-001');

/**
 * `rsvp.envelope` — la confirmación en una tarjeta apaisada del moño: el título a pincel arriba,
 * el sobre atado con su moño a un lado y la invitación a responder al otro, con el botón debajo.
 * Una mariposa y un ramillete de rosas se posan en las esquinas de la tarjeta.
 *
 * Es la confirmación de `coquette`, y la última tarjeta de la referencia. Las otras
 * confirmaciones son tarjetas, pases, postales o cartuchos con la pregunta; esta es la única con
 * **el sobre dibujado**: responder se presenta como devolver la carta, y el dibujo lo dice antes
 * de leer el texto.
 *
 * El botón va a lo ancho debajo y no en la columna del texto, como en la referencia: allí cabe
 * «CONFIRMAR», pero la etiqueta la escribe el cliente, y «Confirmar asistencia» en media tarjeta
 * se parte en dos renglones.
 *
 * La foto del bloque no se pinta: el sobre ya es la ilustración.
 */
export function RsvpEnvelope({ content }: RsvpVariantProps) {
  return (
    <BlockSection block="rsvp" variant="envelope">
      <BlockContainer className="max-w-md">
        {hasText(content.eyebrow) && (
          <p className="m-0 text-center font-inv-display text-[11px] tracking-[0.32em] text-inv-ink-soft uppercase">
            {content.eyebrow}
          </p>
        )}

        <div
          className={clsx(
            'relative mx-auto w-[min(90vw,24rem)]',
            hasText(content.eyebrow) && 'mt-8',
          )}
        >
          <DesignAsset
            asset={BUTTERFLY}
            rotate={16}
            className="pointer-events-none absolute -top-12 -right-3 z-10 w-14 text-inv-primary opacity-70"
          />
          <DesignAsset
            asset={ROSES}
            flip="x"
            className="pointer-events-none absolute -right-9 -bottom-8 z-10 w-28 text-inv-primary opacity-60"
          />

          <BowCard innerClassName="px-4 pt-12 pb-8 sm:px-6">
            <h2 className="m-0 font-inv-script text-[clamp(2.3rem,10.5vw,3rem)] leading-[1.1] font-normal text-inv-primary">
              {content.title}
            </h2>
            {hasText(content.deadlineLabel) && (
              <p className="mt-2 mb-0 font-inv-display text-[11px] tracking-[0.22em] text-inv-ink-soft uppercase">
                {content.deadlineLabel}
              </p>
            )}

            {/* Sin texto, el sobre se queda solo y centrado: la columna vacía de al lado se leería
                como un párrafo que no cargó. */}
            {hasText(content.subtitle) ? (
              <div className="mt-6 grid grid-cols-[42%_1fr] items-center gap-4 text-left">
                <DesignAsset asset={ENVELOPE} className="w-full text-inv-primary" />
                <p className="m-0 font-inv-display text-[clamp(0.9rem,3.8vw,1rem)] leading-snug text-pretty text-inv-ink-soft">
                  {content.subtitle}
                </p>
              </div>
            ) : (
              <DesignAsset asset={ENVELOPE} className="mx-auto mt-6 w-32 text-inv-primary" />
            )}

            <RsvpAction content={content} align="center" className="mt-7" />

            {hasText(content.note) && (
              <p className="mx-auto mt-6 mb-0 max-w-[17rem] text-[12.5px] leading-relaxed text-inv-ink-soft">
                {content.note}
              </p>
            )}
          </BowCard>
        </div>
      </BlockContainer>
    </BlockSection>
  );
}
