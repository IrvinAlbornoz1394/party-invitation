import clsx from 'clsx';
import { requireDesignAsset } from '@/lib/design-assets';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DesignAsset } from '../../shared/DesignAsset';
import { RsvpAction, type RsvpVariantProps } from './rsvp-parts';
import { hasText } from '../../shared/has-text';

const FAN = requireDesignAsset('botanical-corner-bottom-001');

/**
 * `rsvp.arch` — la pregunta dentro de un arco de filete, con las ramas brotando de los pies.
 *
 * Es la confirmación de `arbor`, y la última vez que la plantilla repite su vano. A diferencia de
 * la ubicación, aquí el arco **no se tiñe**: es solo contorno, sobre el papel, porque esta es la
 * sección que pide algo y el botón tiene que ser la única mancha de color. Las otras nueve
 * confirmaciones son tarjetas, franjas, pases o cartuchos rectangulares; ninguna lleva la forma de
 * la invitación.
 *
 * La nota va en manuscrita al pie, que es donde la referencia pone su frase más personal. El
 * título también: «¿Asistirás?» escrito a mano, no compuesto.
 *
 * La imagen de la confirmación no se pinta: dentro de un arco abierto sobre el papel, una foto
 * cerraría la ventana que el resto de la sección deja respirar.
 */
export function RsvpArch({ content }: RsvpVariantProps) {
  return (
    <BlockSection block="rsvp" variant="arch">
      <BlockContainer className="max-w-md">
        <div className="relative mx-auto max-w-[22rem]">
          <div className="rounded-t-full border border-inv-accent/45 px-7 pt-20 pb-12 text-center sm:px-10">
            {hasText(content.eyebrow) && (
              <p className="m-0 text-[10px] tracking-[0.3em] text-inv-ink-soft uppercase">
                {content.eyebrow}
              </p>
            )}
            <h2
              className={clsx(
                'mb-0 font-inv-script text-[clamp(2.4rem,10vw,3.2rem)] leading-[1.1] font-normal text-inv-accent',
                hasText(content.eyebrow) ? 'mt-3' : 'mt-0',
              )}
            >
              {content.title}
            </h2>
            {hasText(content.subtitle) && (
              <p className="mx-auto mt-5 mb-0 max-w-[16rem] text-[14px] leading-relaxed font-medium text-inv-ink">
                {content.subtitle}
              </p>
            )}
            {hasText(content.deadlineLabel) && (
              <p className="mt-5 mb-0 text-[10.5px] tracking-[0.24em] text-inv-primary uppercase">
                {content.deadlineLabel}
              </p>
            )}

            <RsvpAction content={content} align="center" className="mt-8" />

            {hasText(content.note) && (
              <p className="mx-auto mt-8 mb-0 max-w-[16rem] font-inv-script text-[clamp(1.35rem,5.6vw,1.65rem)] leading-[1.25] text-inv-accent">
                {content.note}
              </p>
            )}
          </div>

          <DesignAsset
            asset={FAN}
            className="pointer-events-none absolute -bottom-6 -left-9 w-32 text-inv-primary opacity-85 sm:-left-12 sm:w-36"
          />
          <DesignAsset
            asset={FAN}
            flip="x"
            className="pointer-events-none absolute -right-7 -bottom-5 w-20 text-inv-primary opacity-75 sm:-right-9 sm:w-24"
          />
        </div>
      </BlockContainer>
    </BlockSection>
  );
}
