import clsx from 'clsx';
import { paletteIsNamed } from '@/domain/invitation/blocks/dresscode';
import { requireDesignAsset } from '@/lib/design-assets';
import { ActionLink } from '../../shared/ActionLink';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { BowCard } from '../../shared/BowCard';
import { DesignAsset } from '../../shared/DesignAsset';
import { Swatch } from './dresscode-parts';
import type { DresscodeVariantProps } from './dresscode-variant';

const GOWN = requireDesignAsset('symbol-gown-line-001');
const ROSES = requireDesignAsset('corner-rose-line-001');

/**
 * Hasta cuántos caracteres la descripción se escribe a pincel, como la palabra «Formal» de la
 * referencia. Más larga, la manuscrita se vuelve ilegible y va en la serif.
 */
const SCRIPT_DESCRIPTION_MAX = 28;

/**
 * `dresscode.atelier` — la vestimenta en una tarjeta del moño, como la ficha de un taller de
 * costura: el vestido dibujado a línea, «CÓDIGO DE VESTIMENTA» en versalitas de la serif y, debajo,
 * la palabra que importa a pincel —«Formal»—, con los colores en una fila de botones.
 *
 * Es la vestimenta de `coquette`, y la segunda tarjeta de la referencia. Allí no hay colores: la
 * sección es el dibujo y una palabra. Aquí la palabra manda igual, y la paleta baja a una fila de
 * círculos pequeños, que es lo que hace `dresscode.label`; la diferencia es que aquel es pura
 * tipografía y este es **un objeto**, la tarjeta con su dibujo.
 *
 * ## Cuándo la descripción va a pincel
 *
 * Si es corta —una palabra o dos, hasta {@link SCRIPT_DESCRIPTION_MAX} caracteres— va a pincel y
 * grande, como en la referencia. Si es una frase, en la serif a cuerpo de lectura. No es gusto: una
 * manuscrita de pincel escrita en tres renglones no se lee.
 *
 * Sin nombres en los colores la fila es decorativa y se marca así (`paletteIsNamed`); con nombres,
 * cada círculo los lleva como etiqueta y van escritos en la leyenda.
 */
export function DresscodeAtelier({ content }: DresscodeVariantProps) {
  const named = paletteIsNamed(content.palette);
  const shortDescription =
    content.description !== null && content.description.length <= SCRIPT_DESCRIPTION_MAX;

  return (
    <BlockSection block="dresscode" variant="atelier">
      <BlockContainer className="max-w-md">
        {hasText(content.eyebrow) && (
          <p className="m-0 text-center font-inv-display text-[11px] tracking-[0.32em] text-inv-ink-soft uppercase">
            {content.eyebrow}
          </p>
        )}

        <div className="relative mx-auto mt-8 w-[min(84vw,20rem)]">
          <DesignAsset
            asset={ROSES}
            className="pointer-events-none absolute -bottom-8 -left-10 z-10 w-28 text-inv-primary opacity-60"
          />
          <DesignAsset
            asset={ROSES}
            flip="x"
            className="pointer-events-none absolute -right-8 -bottom-6 z-10 w-24 text-inv-primary opacity-50"
          />

          <BowCard innerClassName="pt-14 pb-10">
            <DesignAsset asset={GOWN} className="mx-auto w-28 text-inv-primary sm:w-32" />

            <h2 className="mt-6 mb-0 font-inv-display text-[clamp(1.15rem,5.4vw,1.4rem)] leading-[1.15] font-medium tracking-[0.04em] text-balance text-inv-ink uppercase">
              {content.title}
            </h2>
            {hasText(content.description) &&
              (shortDescription ? (
                <p className="mt-1 mb-0 font-inv-script text-[clamp(2.6rem,12vw,3.3rem)] leading-[1.1] text-inv-primary">
                  {content.description}
                </p>
              ) : (
                <p className="mx-auto mt-4 mb-0 max-w-[16rem] text-[14px] leading-relaxed text-pretty text-inv-ink-soft">
                  {content.description}
                </p>
              ))}

            <ul
              aria-hidden={named ? undefined : 'true'}
              aria-label={named ? 'Colores sugeridos' : undefined}
              className="m-0 mt-7 flex list-none flex-wrap justify-center gap-2.5 p-0"
            >
              {content.palette.map((swatch, index) => (
                <li key={index} title={swatch.label ?? undefined}>
                  <Swatch swatch={swatch} className="size-8! sm:size-9!" />
                  {hasText(swatch.label) && <span className="sr-only">{swatch.label}</span>}
                </li>
              ))}
            </ul>
            {named && (
              <p aria-hidden="true" className="mx-auto mt-4 mb-0 max-w-[16rem] text-[10px] leading-relaxed tracking-[0.18em] text-inv-ink-soft uppercase">
                {/* Solo los nombres que hay: una muestra sin nombre no deja un punto suelto. */}
                {content.palette
                  .map((swatch) => swatch.label)
                  .filter(hasText)
                  .join(' · ')}
              </p>
            )}
          </BowCard>
        </div>

        {/* El pie solo guarda el enlace y la nota: sin ninguno de los dos no se pinta, ni su margen. */}
        {(content.action || hasText(content.note)) && (
          <div className="mt-12 flex flex-col items-center text-center">
            {content.action && (
              <ActionLink label={content.action.label} href={content.action.href} tone="onSurface" />
            )}
            {hasText(content.note) && (
              <BlockNote note={content.note} className={clsx('max-w-sm', content.action && 'mt-8')} />
            )}
          </div>
        )}
      </BlockContainer>
    </BlockSection>
  );
}
