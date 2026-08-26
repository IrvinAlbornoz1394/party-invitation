import type { CSSProperties } from 'react';
import clsx from 'clsx';
import type { DresscodeSwatch } from '@/domain/invitation/blocks/dresscode';

/**
 * Las piezas de un código de vestimenta, compartidas por sus cinco variantes.
 *
 * Lo que cambia entre ellas es **cómo se reparte la paleta** —una fila de círculos, una rejilla de
 * fichas, una carta de imprenta, un hilo de cuentas, franjas a sangre— y no qué es una muestra ni
 * cuándo la fila deja de ser información. Esas dos cosas estaban escritas dentro de
 * `DresscodePalette` cuando era la única variante; al llegar cuatro más se sacan aquí, que es lo
 * que evita que a la tercera semana una pinte el metálico y otra no.
 */

/**
 * El brillo del acabado metálico.
 *
 * Un dorado, un cobre o un champán pintados como un color plano se leen como beige, y el invitado
 * que va a comprar una corbata se equivoca de tienda. Son dos degradados cruzados sobre el mismo
 * color —uno de luz de arriba a la izquierda y otro de sombra abajo a la derecha—: la lectura
 * mínima de «metal» sin una textura que haya que descargar.
 *
 * Van en blanco y negro translúcidos a propósito. Un degradado con un color escrito a mano solo
 * funcionaría con los dorados, y las paletas traen también plateados y cobres.
 */
const METALLIC_SHEEN =
  'linear-gradient(135deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.08) 42%, rgba(0,0,0,0.06) 58%, rgba(0,0,0,0.24) 100%)';

/**
 * Una muestra de color.
 *
 * El color va en el atributo `style` y no en una clase, y no hay alternativa: es un dato del
 * evento, así que Tailwind no puede generar una utilidad para un valor que no existe hasta que
 * alguien lo escribe en el panel. Lo que sí hay es la garantía de que ese valor es un hexadecimal
 * y nada más — la pone el esquema, en `domain/invitation/blocks/dresscode.ts`, y por eso aquí no
 * hay que sanear nada.
 *
 * `shape` es el único eje que se parametriza, porque es el único que la variante obliga a cambiar:
 * la papelería enseña botones redondos y un muestrario de imprenta, rectángulos contiguos. Todo lo
 * demás —el filete, el brillo, la sombra del metálico— es igual en las cinco.
 *
 * El filete exterior no es decorativo: un marfil sobre papel marfil —que aparece en la mitad de
 * las paletas de boda— sin borde es una mancha invisible, y con él sigue siendo una muestra. Va en
 * `line`, el color de filete del tema, para que no destaque más que el color que enmarca.
 */
export function Swatch({
  swatch,
  shape = 'round',
  className,
}: {
  readonly swatch: DresscodeSwatch;
  readonly shape?: 'round' | 'square' | 'block';
  readonly className?: string;
}) {
  const metallic = swatch.finish === 'metallic';

  return (
    <span
      className={clsx(
        'relative block overflow-hidden',
        shape === 'round' && 'size-14 shrink-0 rounded-full ring-1 ring-inv-line sm:size-16',
        shape === 'square' && 'aspect-square w-full rounded-inv-sm ring-1 ring-inv-line',
        /* `block` no lleva filete: son piezas contiguas de una carta de imprenta y el borde
           abriría una calle blanca entre dos tonos que tienen que tocarse. */
        shape === 'block' && 'h-full w-full',
        /* Solo el metálico lleva sombra propia: es lo que le da volumen y lo que lo separa de un
           plano del mismo tono. Un plano con sombra se vería como un botón. */
        metallic && shape !== 'block' && 'shadow-inv-soft',
        className,
      )}
      style={{ backgroundColor: swatch.color } as CSSProperties}
    >
      {metallic && (
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{ backgroundImage: METALLIC_SHEEN }}
        />
      )}
    </span>
  );
}
