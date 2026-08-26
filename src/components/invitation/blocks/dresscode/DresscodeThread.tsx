import { paletteIsNamed } from '@/domain/invitation/blocks/dresscode';
import { ActionLink } from '../../shared/ActionLink';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { Swatch } from './dresscode-parts';
import type { DresscodeVariantProps } from './dresscode-variant';

/**
 * `dresscode.thread` — las cuentas enhebradas en un hilo que baja, con su nombre al lado.
 *
 * Es la de `storytelling`, la estructura cuyo único recurso propio es **ordenar para narrar**: su
 * cronograma encadena hitos en un hilo (`schedule.zigzag`), su cierre es la última página de un
 * álbum y su confirmación una postal. Aquí la paleta no se expone, se **recorre**: un color, su
 * nombre, el siguiente. Es un collar leído de arriba abajo.
 *
 * ## En qué se diferencia de `palette`
 *
 * Las dos usan círculos y ahí acaba el parecido. `palette` los alinea en una fila bajo una ramita:
 * es una muestra de papelería, se ve entera de un vistazo y no propone ningún orden. Esta los
 * cuelga de un hilo continuo con el rótulo a la derecha, así que se lee como una lista con
 * secuencia. Una fila se mira; un hilo se recorre.
 *
 * ## Por qué el hilo baja y no cruza
 *
 * La primera versión lo puso en horizontal, con las cuentas desfasadas media altura a los dos
 * lados y la fila desplazable en móvil. Se rompió por partida doble, y las dos causas conviene
 * recordarlas:
 *
 *   1. **`overflow-x: auto` recorta también en vertical.** Al fijar un solo eje, el otro deja de
 *      valer `visible` —el CSS lo promueve a `auto`—, así que el contenedor recortaba las cuentas
 *      desplazadas por arriba y por abajo: se veían como medias lunas, con una barra de
 *      desplazamiento vertical de propina. Un desfase y un contenedor de desplazamiento no pueden
 *      convivir en el mismo elemento.
 *   2. **Seis cuentas con rótulo no caben en horizontal en un móvil.** El desplazamiento lateral lo
 *      disimulaba con una barra gris cruzando la sección, y los rótulos a dos alturas distintas se
 *      leían como un descuadre, no como un diseño.
 *
 * En vertical no hay nada que recortar ni que desplazar: el hilo tiene todo el alto que necesite,
 * el rótulo va al lado —donde cabe entero, se llame «Oro» o «Azul noche»— y la composición es la
 * misma de 320 a 2560 píxeles. Una sola maqueta, que es la que no se rompe.
 *
 * ## El hilo empieza y acaba en una cuenta
 *
 * `top-7 bottom-7` —la mitad del diámetro de una muestra— en lugar de `inset-y-0`. Un hilo que
 * sobresale por los dos extremos parece cortado; naciendo en el centro de la primera cuenta y
 * muriendo en el de la última, se lee como lo que es: la cuerda que las sujeta.
 */
export function DresscodeThread({ content }: DresscodeVariantProps) {
  const named = paletteIsNamed(content.palette);

  return (
    <BlockSection block="dresscode" variant="thread">
      <BlockContainer className="max-w-3xl">
        <div className="flex flex-col items-center text-center">
          <BlockHeading
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.description}
            align="center"
          />
        </div>

        {/*
          `max-w-xs` y centrado: el collar es una columna estrecha, y en una pantalla ancha estirarlo
          dejaría el rótulo a medio metro de su color. El texto de la sección va centrado y esto
          alineado a la izquierda dentro de su propia caja, que es como se lee una lista.
        */}
        <ul
          aria-hidden={named ? undefined : 'true'}
          className="relative mx-auto mt-12 flex w-full max-w-xs list-none flex-col gap-6 p-0"
        >
          {/* El hilo. `left-7` es el centro de una muestra de `size-14`; si cambia el diámetro,
              cambia aquí. Ver la cabecera para por qué no llega a los extremos. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-7 bottom-7 left-7 w-px -translate-x-1/2 bg-inv-line"
          />

          {content.palette.map((swatch, index) => (
            // El índice como clave es correcto aquí: la paleta no se reordena ni se inserta en
            // caliente. Y no sirve el color: dos muestras del mismo tono con acabados distintos
            // son legítimas.
            <li key={index} className="relative flex items-center gap-5">
              <Swatch swatch={swatch} />

              {swatch.label && (
                <span className="min-w-0 text-left text-[10.5px] leading-snug tracking-[0.18em] text-inv-ink-soft uppercase sm:text-[11.5px]">
                  {swatch.label}
                </span>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-col items-center text-center">
          {content.action && (
            <ActionLink label={content.action.label} href={content.action.href} tone="onSurface" />
          )}

          {content.note && <BlockNote note={content.note} className="mt-8 max-w-sm" />}
        </div>
      </BlockContainer>
    </BlockSection>
  );
}
