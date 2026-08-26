import { ActionLink } from '../../shared/ActionLink';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { paletteIsNamed } from '@/domain/invitation/blocks/dresscode';
import { Swatch } from './dresscode-parts';
import type { DresscodeVariantProps } from './dresscode-variant';

/**
 * `dresscode.cards` — cada color en su ficha, como un muestrario de pintura.
 *
 * Es la que le toca a `classic`, la estructura de la participación impresa, y comparte su recurso:
 * ahí los detalles van en tarjetas (`details.cards`) y la confirmación también (`rsvp.card`). Una
 * fila de círculos sueltos —lo de `palette`— se leería como la única sección sin caja de toda la
 * plantilla.
 *
 * ## Cuadrados, no círculos
 *
 * Es la diferencia que se ve a un metro de la pantalla y la que la separa de `palette`. Un círculo
 * es un botón de color; un cuadrado con su rótulo debajo es una **muestra de catálogo**, que es
 * exactamente lo que alguien mira antes de comprar una corbata. El cuadrado además llena la ficha
 * de canto a canto, así que el color se ve en superficie y no en una moneda — y un marfil y un
 * arena, que en círculos pequeños se confunden, aquí se distinguen.
 *
 * ## La rejilla es `auto-fit`
 *
 * Con dos colores salen dos fichas anchas y con seis, dos filas llenas. Un número fijo de columnas
 * dejaría media fila vacía justo en el caso más común —cinco muestras—, que es como se ve una
 * rejilla mal llena.
 */
export function DresscodeCards({ content }: DresscodeVariantProps) {
  const named = paletteIsNamed(content.palette);

  return (
    <BlockSection block="dresscode" variant="cards">
      <BlockContainer className="max-w-3xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.description}
          align="center"
        />

        <ul
          aria-hidden={named ? undefined : 'true'}
          className="mx-auto mt-12 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,7.5rem),1fr))] gap-4 p-0 sm:gap-5"
        >
          {content.palette.map((swatch, index) => (
            // El índice como clave es correcto aquí: la paleta no se reordena ni se inserta en
            // caliente. Y no sirve el color: dos muestras del mismo tono con acabados distintos
            // son legítimas.
            <li
              key={index}
              className="flex flex-col gap-3 rounded-inv-md border border-inv-line bg-inv-surface p-3 shadow-inv-soft"
            >
              <Swatch swatch={swatch} shape="square" />

              {/* El rótulo va centrado y con su propio aire aunque falte: sin nombre la ficha se
                  queda en la muestra y no abre un hueco, que es lo que pasaría reservándolo. */}
              {swatch.label && (
                <span className="text-center text-[9.5px] leading-snug tracking-[0.16em] text-inv-ink-soft uppercase">
                  {swatch.label}
                </span>
              )}
            </li>
          ))}
        </ul>

        {content.action && (
          <div className="mt-10 text-center">
            <ActionLink label={content.action.label} href={content.action.href} tone="onSurface" />
          </div>
        )}

        {content.note && <BlockNote note={content.note} className="mx-auto mt-8 max-w-sm text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
