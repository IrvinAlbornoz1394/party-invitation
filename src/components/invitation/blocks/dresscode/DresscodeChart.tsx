import { ActionLink } from '../../shared/ActionLink';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { paletteIsNamed } from '@/domain/invitation/blocks/dresscode';
import { Swatch } from './dresscode-parts';
import type { DresscodeVariantProps } from './dresscode-variant';

/**
 * `dresscode.chart` — la carta de colores de imprenta: una barra continua y los tonos numerados.
 *
 * Es la de `editorial`, y sale del mismo sitio que su galería de pliego y su colofón: el taller.
 * Una carta de color impresa no separa las muestras —los tonos se imprimen **pegados**, para poder
 * compararlos sin que el papel se meta en medio— y las nombra al pie con su folio.
 *
 * ## Por qué las muestras se tocan
 *
 * Es la decisión que define la variante y la que la separa de las otras cuatro. `palette` y
 * `thread` reparten círculos con aire entre ellos; `cards` mete cada uno en su caja; aquí no hay
 * ninguna calle. Dos colores contiguos sin nada en medio se comparan de verdad —es para lo que
 * existe una carta— y la fila entera se lee como **una** pieza, que es lo que una maqueta de
 * revista quiere en el sitio donde otra pondría cinco elementos sueltos.
 *
 * Por eso las muestras van con `shape="block"` y sin filete. El borde que en `palette` salva a un
 * marfil sobre papel marfil aquí sobra: lo que separa a un tono de su vecino es el tono de al lado.
 *
 * ## El folio
 *
 * Cada columna lleva su número en versalitas —01, 02, 03—, y no es decoración: sin nombres de
 * color —que es lo normal en una papelería, y lo que trae la demo de boda— el folio es lo único
 * que permite decir «el 02» señalando la pantalla. Con nombres, va encima de ellos como el
 * numeral de una lámina.
 *
 * ## El encabezado va a la izquierda
 *
 * Como el resto de `editorial`. Una barra a sangre bajo un encabezado centrado deja los dos ejes
 * discutiendo, y esta plantilla ya decidió el suyo.
 */
export function DresscodeChart({ content }: DresscodeVariantProps) {
  const named = paletteIsNamed(content.palette);

  return (
    <BlockSection block="dresscode" variant="chart">
      <BlockContainer className="max-w-3xl">
        <BlockHeading eyebrow={content.eyebrow} title={content.title} />

        {content.description && (
          <p className="mt-6 mb-0 max-w-xl text-[15px] leading-relaxed text-inv-ink-soft">
            {content.description}
          </p>
        )}

        {/*
          La carta. `grid-flow-col` con columnas iguales y sin `gap`: las muestras se tocan y la
          barra ocupa el ancho completo repartido a partes iguales, que es como se imprime una.
          El filete exterior encierra la barra entera —una sola pieza— en lugar de cada tono.
        */}
        <ul
          aria-hidden={named ? undefined : 'true'}
          className="mt-10 grid list-none auto-cols-fr grid-flow-col overflow-hidden rounded-inv-sm border border-inv-line p-0"
        >
          {content.palette.map((swatch, index) => (
            // El índice como clave es correcto aquí: la paleta no se reordena ni se inserta en
            // caliente, se renderiza una vez desde contenido guardado.
            <li key={index} className="flex min-w-0 flex-col">
              <span className="block h-20 w-full sm:h-28">
                <Swatch swatch={swatch} shape="block" />
              </span>
            </li>
          ))}
        </ul>

        {/*
          Los folios y los nombres van en una retícula aparte con las mismas columnas, y no dentro
          de cada muestra. Es lo que mantiene la barra limpia —sin texto encima de un color que
          puede ser cualquiera— y lo que permite que el rótulo se parta en dos líneas sin
          descuadrar la altura de la carta.
        */}
        <ul
          aria-hidden={named ? undefined : 'true'}
          className="mt-3 grid list-none auto-cols-fr grid-flow-col gap-x-2 p-0"
        >
          {content.palette.map((swatch, index) => (
            <li key={index} className="min-w-0">
              <span className="block font-inv-display text-[9.5px] tracking-[0.2em] text-inv-accent tabular-nums">
                {String(index + 1).padStart(2, '0')}
              </span>
              {swatch.label && (
                <span className="mt-1 block text-[9px] leading-snug tracking-[0.12em] text-inv-ink-soft uppercase sm:text-[10px]">
                  {swatch.label}
                </span>
              )}
            </li>
          ))}
        </ul>

        {content.action && (
          <ActionLink
            label={content.action.label}
            href={content.action.href}
            tone="onSurface"
            className="mt-10"
          />
        )}

        {content.note && <BlockNote note={content.note} className="mt-8 max-w-md" />}
      </BlockContainer>
    </BlockSection>
  );
}
