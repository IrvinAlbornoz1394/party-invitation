import { paletteIsNamed } from '@/domain/invitation/blocks/dresscode';
import { ActionLink } from '../../shared/ActionLink';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { Swatch } from './dresscode-parts';
import type { DresscodeVariantProps } from './dresscode-variant';

/**
 * `dresscode.discs` — los tonos como discos grandes en retícula centrada, y los nombres en una
 * sola línea aparte.
 *
 * Es la séptima forma del bloque, y la que hay que justificar mejor de las siete, porque a
 * primera vista es «`palette` con los círculos más grandes». No lo es, y lo que cambia es dónde
 * vive el nombre:
 *
 *   `palette`  cada muestra es una **ficha**: el círculo y, debajo, su rótulo. La sección es una
 *              lista de tonos identificados, se lee de uno en uno y el conjunto es la suma.
 *   `discs`    el color y su nombre están **separados**. Arriba, los discos como una sola pieza
 *              gráfica —grandes, en retícula, sin nada entre ellos—; debajo, todos los nombres
 *              corridos en un renglón. La sección es una imagen con su pie.
 *
 * La consecuencia es que aquí la paleta se lee **como paleta** y no como catálogo. Es lo que hace
 * la referencia de `monochrome`, donde siete discos en dos filas son literalmente la única
 * mancha de color de toda la invitación: llegan después de dos pantallas en blanco y negro y no
 * necesitan que nadie les ponga nombre para decir lo que dicen.
 *
 * El precio es real y conviene tenerlo escrito: separar el nombre del color obliga a contarlos
 * para saber cuál es cuál. Se acepta porque el pie va **en el mismo orden** y porque un nombre de
 * color es una ayuda, no el dato — quien lo necesita exacto abre el enlace de ideas de atuendo.
 * Cuando esa precisión importe, la que toca es `palette` o `cards`.
 *
 * ## Sin nombres es cuando mejor funciona
 *
 * La boda del catálogo trae la paleta sin rotular, y aquí no hay nada que resolver: desaparece el
 * pie y quedan los discos, que es la composición completa. En `palette` esa misma paleta deja una
 * fila de círculos con un hueco debajo donde iban los rótulos.
 */
export function DresscodeDiscs({ content }: DresscodeVariantProps) {
  const named = paletteIsNamed(content.palette);

  return (
    <BlockSection block="dresscode" variant="discs">
      <BlockContainer className="max-w-lg">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.description}
          align="center"
          titleFont="script"
        />

        {/*
          Los discos. `justify-center` con envoltura: con cinco tonos en un móvil salen tres y
          dos, y con siete —el tope del contrato son seis— cuatro y tres, que es exactamente la
          composición de la referencia. No se fuerza el número de columnas con una retícula: dejar
          que envuelvan es lo que mantiene el conjunto centrado sea cual sea la cantidad, y una
          retícula fija dejaría un hueco a la derecha en la última fila.
        */}
        <ul
          aria-hidden="true"
          className="mt-12 flex list-none flex-wrap items-center justify-center gap-5 p-0 sm:gap-6"
        >
          {content.palette.map((swatch, index) => (
            // El índice como clave es correcto aquí: la paleta no se reordena ni se inserta en
            // caliente. Y no sirve el color: dos muestras del mismo tono con acabados distintos
            // son legítimas.
            <li key={index}>
              <Swatch swatch={swatch} className="size-16 sm:size-[4.5rem]" />
            </li>
          ))}
        </ul>

        {/*
          El pie de la paleta: todos los nombres en un renglón, separados por un punto medio. Va
          en un `<p>` y no en una lista porque eso es lo que es —una línea de texto que describe
          la imagen de arriba—, y por eso los discos van `aria-hidden` y este renglón no: quien
          escucha la página oye «Verde botella · Oro · Plata», que es la sección entera.

          Sin nombres no se pinta nada. Ni el renglón vacío ni los separadores sueltos.
        */}
        {named && (
          <p className="mx-auto mt-8 mb-0 max-w-sm text-center text-[10.5px] leading-relaxed tracking-[0.18em] text-inv-ink-soft uppercase">
            {content.palette
              .map((swatch) => swatch.label)
              .filter((label): label is string => label !== null)
              .join(' · ')}
          </p>
        )}

        {content.action && (
          <div className="mt-10 text-center">
            <ActionLink label={content.action.label} href={content.action.href} tone="onSurface" />
          </div>
        )}

        {content.note && (
          <BlockNote note={content.note} className="mx-auto mt-8 max-w-sm text-center" />
        )}
      </BlockContainer>
    </BlockSection>
  );
}
