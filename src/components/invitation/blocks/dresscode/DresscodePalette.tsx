import { ActionLink } from '../../shared/ActionLink';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { LeafSprig } from '../../shared/paper-ornaments';
import { paletteIsNamed } from '@/domain/invitation/blocks/dresscode';
import { Swatch } from './dresscode-parts';
import type { DresscodeVariantProps } from './dresscode-variant';

/**
 * `dresscode.palette` — la instrucción escrita y la paleta en una fila de muestras.
 *
 * Es la sección que responde a lo único que un invitado se pregunta delante del armario. Y lo
 * hace **enseñando** los colores, que es la parte que un texto no consigue: «tonos tierra y
 * verdes suaves» significa algo distinto para cada persona, y cinco círculos no dejan lugar a
 * interpretación.
 *
 * El orden importa: primero la regla en palabras —«etiqueta», «evita el blanco»— y después la
 * paleta. Al revés, la fila de colores se lee como decoración y el texto de debajo, como un pie
 * de foto que nadie termina.
 *
 * ## Las muestras son un `<ul>`, y a veces decorativo
 *
 * Depende de si los colores tienen nombre. La regla es común a las cinco variantes y vive en
 * `paletteIsNamed()`, en `dresscode-parts.tsx`, junto a la muestra en sí.
 */
export function DresscodePalette({ content }: DresscodeVariantProps) {
  const named = paletteIsNamed(content.palette);

  return (
    <BlockSection block="dresscode" variant="palette">
      <BlockContainer className="max-w-xl">
        <div className="flex flex-col items-center text-center">
          <BlockHeading
            eyebrow={content.eyebrow}
            title={content.title}
            align="center"
            titleCase="caps"
          />

          <LeafSprig className="mt-6 h-7 w-40 text-inv-accent opacity-80" />

          {content.description && (
            <p className="mt-7 mb-0 max-w-md text-[15px] leading-relaxed text-inv-ink-soft">
              {content.description}
            </p>
          )}

          <ul
            aria-hidden={named ? undefined : 'true'}
            className="mt-10 flex list-none flex-wrap items-start justify-center gap-x-4 gap-y-6 p-0 sm:gap-x-6"
          >
            {content.palette.map((swatch, index) => (
              // El índice como clave es correcto aquí: la paleta no se reordena ni se inserta en
              // caliente, se renderiza una vez desde contenido guardado. Y no sirve el color: dos
              // muestras del mismo tono con acabados distintos son legítimas.
              <li key={index} className="flex w-16 flex-col items-center gap-2.5 sm:w-20">
                <Swatch swatch={swatch} />

                {swatch.label && (
                  <span className="text-[9.5px] leading-snug tracking-[0.16em] text-inv-ink-soft uppercase">
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

          {content.note && <BlockNote note={content.note} className="mt-8 max-w-sm" />}
        </div>
      </BlockContainer>
    </BlockSection>
  );
}
