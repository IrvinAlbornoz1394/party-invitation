import { paletteIsNamed } from '@/domain/invitation/blocks/dresscode';
import { ActionLink } from '../../shared/ActionLink';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { Swatch } from './dresscode-parts';
import type { DresscodeVariantProps } from './dresscode-variant';

/**
 * `dresscode.petals` — la paleta como una flor: cada color es un pétalo, repartidos en círculo
 * alrededor de un botón dorado.
 *
 * Es la vestimenta de `blush`, que la referencia no tiene, y se dibuja con su motivo: la flor
 * rosa que se apoya en la portada, la galería y el cierre, aquí hecha de los colores que se
 * piden. Las otras diez muestras ponen los colores en fila —discos, retales, arcos, franjas—;
 * esta es la única que los **reúne en una sola figura**, que es como se recuerda una paleta
 * cuando se va a elegir el vestido.
 *
 * Funciona de dos a seis colores: los pétalos se reparten siempre la vuelta entera, y con dos
 * quedan enfrentados como un lazo. El giro de cada uno sí se calcula —no hay una clase por
 * ángulo posible— y va en línea; no es un estilo de diseño, es geometría.
 *
 * Los nombres, si los hay, van debajo en una leyenda con su punto de color: dentro de la flor no
 * caben, y alrededor se pisarían con los pétalos. Sin nombres la flor es decorativa y se marca así
 * (`paletteIsNamed`), como en las demás.
 */
export function DresscodePetals({ content }: DresscodeVariantProps) {
  const named = paletteIsNamed(content.palette);
  const step = 360 / content.palette.length;

  return (
    <BlockSection block="dresscode" variant="petals">
      <BlockContainer className="max-w-xl">
        <div className="flex flex-col items-center text-center">
          <BlockHeading
            eyebrow={content.eyebrow}
            title={content.title}
            align="center"
            titleFont="script"
          />
          {hasText(content.description) && (
            <p className="mt-6 mb-0 max-w-sm text-[14.5px] leading-relaxed text-inv-ink">
              {content.description}
            </p>
          )}

          <div aria-hidden="true" className="relative mt-12 size-56 sm:size-64">
            {content.palette.map((swatch, index) => (
              <span
                key={index}
                className="absolute bottom-1/2 left-1/2 h-[46%] w-[26%] origin-bottom -translate-x-1/2 overflow-hidden rounded-[50%_50%_50%_50%/62%_62%_38%_38%] shadow-[inset_0_-10px_18px_-12px_rgba(0,0,0,0.25)]"
                style={{ rotate: `${index * step}deg` }}
              >
                <Swatch swatch={swatch} shape="block" />
              </span>
            ))}
            <span className="absolute top-1/2 left-1/2 size-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_40%_35%,#f7d27a,#d9973a)] shadow-[0_4px_10px_-4px_rgba(120,70,20,0.6)]" />
          </div>

          {named && (
            <ul className="m-0 mt-10 flex list-none flex-wrap justify-center gap-x-6 gap-y-3 p-0">
              {/* Solo las muestras con nombre: el punto de color sin su rótulo no dice nada. */}
              {content.palette.filter((swatch) => hasText(swatch.label)).map((swatch, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-[10px] tracking-[0.18em] text-inv-ink-soft uppercase"
                >
                  <span
                    aria-hidden="true"
                    className="size-3 shrink-0 rounded-full ring-1 ring-inv-line"
                    style={{ backgroundColor: swatch.color }}
                  />
                  {swatch.label}
                </li>
              ))}
            </ul>
          )}

          {content.action && (
            <ActionLink
              label={content.action.label}
              href={content.action.href}
              tone="onSurface"
              className="mt-10"
            />
          )}
          {hasText(content.note) && <BlockNote note={content.note} className="mt-8 max-w-sm" />}
        </div>
      </BlockContainer>
    </BlockSection>
  );
}
