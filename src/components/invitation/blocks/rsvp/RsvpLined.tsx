import clsx from 'clsx';
import { requireDesignAsset } from '@/lib/design-assets';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DesignAsset } from '../../shared/DesignAsset';
import { hasText } from '../../shared/has-text';
import { PolaroidFrame } from '../../shared/PolaroidFrame';
import { RsvpAction, type RsvpVariantProps } from './rsvp-parts';

const TAPE = requireDesignAsset('sticker-tape-001');
const KISS = requireDesignAsset('sticker-kiss-001');

/**
 * `rsvp.lined` — la petición escrita en una hoja de cuaderno pegada al álbum con cinta.
 *
 * Es la de `scrapbook`: una hoja de renglones con su margen rojo y sus tres perforaciones,
 * sujeta arriba con una tira de washi, un poco torcida y con un beso de carmín en la esquina,
 * como la carta que se dobla y se mete entre las fotos. Lo que dice es lo de siempre —título,
 * bajada, fecha límite y el botón—; lo que cambia es que se lee como una **nota de alguien**,
 * no como un formulario.
 *
 * ## En qué se diferencia de `rsvp.postcard`
 *
 * Las dos son papel escrito, y por eso la diferencia tiene que verse de lejos. La postal es
 * horizontal, a dos columnas, recta y sin textura: la forma la dan el filete divisorio y el
 * sello. Esta es **una sola columna vertical**, girada, con la textura de renglones ocupando
 * toda la hoja y sujeta por algo —la cinta—. Una se manda por correo; esta se pega.
 *
 * ## Los renglones son el tema
 *
 * Un degradado repetido con el filete del tema (`--color-inv-line`) y no una imagen: salen del
 * color de la paleta en cualquier tema y no hay archivo que descargar. Van cada `2rem`, que es
 * también el interlineado de la bajada, así que el texto largo se acomoda al ritmo de la hoja en
 * lugar de cruzarla a medias. El margen es el primario a media tinta: el rojo del margen de un
 * cuaderno, sin ser el rojo de nadie.
 *
 * ## El texto va a la izquierda
 *
 * Una carta se escribe desde el margen, no centrada. Por eso el botón también se alinea a la
 * izquierda (`align="left"`), y el botón es exactamente el mismo `RsvpAction` que el resto de
 * variantes: los dos caminos, los cuatro estados y la salida de «no podré asistir» no cambian
 * por cambiar el papel.
 *
 * ## La fotografía
 *
 * Opcional, y aquí no va de fondo —una foto detrás de los renglones los haría ilegibles— sino
 * como una instantánea pequeña montada sobre la esquina de la hoja, que es lo que se haría en un
 * álbum de verdad.
 */
export function RsvpLined({ content }: RsvpVariantProps) {
  return (
    <BlockSection block="rsvp" variant="lined" className="relative isolate">
      <BlockContainer className="max-w-lg">
        {content.image && (
          /* La instantánea solapa la esquina de arriba de la hoja: el margen negativo de abajo es
             lo que la monta sobre el papel, y cae por encima del primer renglón con texto. */
          <div className="relative z-10 mr-1 ml-auto -mb-10 w-[min(36vw,8.5rem)] rotate-[5deg]">
            <PolaroidFrame className="pb-7 sm:pb-8" photoClassName="aspect-square">
              <BlockImage image={content.image} sizes="9rem" />
            </PolaroidFrame>
          </div>
        )}

        <article
          className={clsx(
            'relative -rotate-1 bg-inv-surface py-14 pr-6 pl-14 shadow-inv-soft sm:pr-10 sm:pl-20',
            /* Los renglones: un filete de 1px al pie de cada franja de 2rem. */
            'bg-[linear-gradient(to_bottom,transparent_calc(100%_-_1px),var(--color-inv-line)_calc(100%_-_1px))] bg-[size:100%_2rem]',
          )}
        >
          {/* La cinta que sujeta la hoja, cruzando el canto de arriba. */}
          <DesignAsset
            asset={TAPE}
            className="pointer-events-none absolute -top-4 left-1/2 z-10 w-24 -translate-x-1/2 rotate-[-4deg] opacity-90 sm:w-28"
          />

          {/* El margen rojo y las perforaciones: papelería, no contenido. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-10 w-px bg-inv-primary/45 sm:left-14"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-4 flex flex-col justify-evenly sm:left-5"
          >
            {[0, 1, 2].map((hole) => (
              <span key={hole} className="size-3 rounded-full bg-inv-bg ring-1 ring-inv-line ring-inset" />
            ))}
          </span>

          {hasText(content.eyebrow) && (
            <p className="m-0 text-[10.5px] tracking-[0.28em] text-inv-accent uppercase">
              {content.eyebrow}
            </p>
          )}

          <h2
            className={clsx(
              'mb-0 font-inv-script text-[clamp(2.3rem,9vw,3.2rem)] leading-[1.15] font-normal text-inv-primary',
              hasText(content.eyebrow) ? 'mt-3' : 'mt-0',
            )}
          >
            {content.title}
          </h2>

          {hasText(content.subtitle) && (
            <p className="mt-4 mb-0 text-[15px] leading-8 text-inv-ink-soft">{content.subtitle}</p>
          )}

          {/* La fecha límite en cursiva, como se apunta a mano al final de una nota. */}
          {hasText(content.deadlineLabel) && (
            <p className="mt-4 mb-0 font-inv-display text-[1.3rem] leading-8 text-inv-primary italic">
              {content.deadlineLabel}
            </p>
          )}

          <RsvpAction content={content} align="left" className="mt-8" />

          {hasText(content.note) && <BlockNote note={content.note} className="mt-8 leading-8" />}

          {/* El beso, sobre la esquina de abajo y medio fuera de la hoja: en la esquina de arriba
              competiría con la cinta y con la instantánea. */}
          <DesignAsset
            asset={KISS}
            className="pointer-events-none absolute -right-4 -bottom-6 w-20 rotate-[-14deg] sm:-right-8 sm:w-24"
          />
        </article>
      </BlockContainer>
    </BlockSection>
  );
}
