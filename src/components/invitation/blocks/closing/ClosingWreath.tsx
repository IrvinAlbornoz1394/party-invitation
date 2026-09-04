import { ActionLink } from '../../shared/ActionLink';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { BotanicalSpray } from '../../shared/paper-ornaments';
import type { ClosingVariantProps } from './closing-parts';

/**
 * `closing.wreath` — la despedida dentro de una guirnalda: dos ramas enfrentadas que se cierran
 * alrededor del texto, con la firma en manuscrita.
 *
 * Es el noveno cierre y el único que **rodea** el texto. Los ocho anteriores lo apoyan en algo —un
 * sobre, una carta, una hoja de álbum, una tarjeta— o lo dejan solo; este lo encierra en una
 * corona vegetal, que es el remate clásico de una participación grabada y el que cierra la
 * referencia de `gala`.
 *
 * La comparación que importa es con `closing.bouquet`, el otro que usa dibujos: aquel pone dos
 * ramilletes **a los lados** y el texto sigue leyéndose en una fila de tres; aquí las dos ramas
 * se curvan una hacia la otra por arriba y por abajo, así que el texto queda **dentro** y la
 * pieza se lee como un sello. Uno acompaña, el otro envuelve.
 *
 * ## La guirnalda es la misma rama, girada
 *
 * `BotanicalSpray` dibuja un tallo que sube de izquierda a derecha. Puesto arriba a la izquierda
 * y repetido abajo a la derecha con media vuelta, los dos tallos se persiguen y cierran el óvalo.
 * No hay un segundo dibujo: dibujar «la otra mitad» habría dado dos ramas que no son la misma, y
 * en una composición centrada eso se ve enseguida.
 *
 * ## Se recorta con la sección, no con la caja del texto
 *
 * Las ramas asoman por los cantos de la sección y se cortan ahí. Es lo mismo que hace la portada
 * de esta plantilla, y es lo que evita el efecto «pegatina»: una guirnalda entera y centrada, con
 * aire por los cuatro lados, se lee como un adorno pegado encima del papel; cortada por el
 * troquel, como impresa en él.
 */
export function ClosingWreath({ content }: ClosingVariantProps) {
  return (
    <BlockSection block="closing" variant="wreath" className="relative isolate overflow-hidden">
      <BotanicalSpray className="absolute -top-2 -left-12 h-20 w-[13rem] text-inv-accent opacity-50 sm:h-24 sm:w-[17rem]" />
      <BotanicalSpray className="absolute -right-12 -bottom-2 h-20 w-[13rem] rotate-180 text-inv-accent opacity-50 sm:h-24 sm:w-[17rem]" />

      <BlockContainer className="relative z-10 max-w-md text-center">
        {content.eyebrow && (
          <p className="m-0 text-[10.5px] tracking-[0.3em] text-inv-accent uppercase">
            {content.eyebrow}
          </p>
        )}

        <p className="mt-7 mb-0 text-[13px] leading-relaxed tracking-[0.14em] text-inv-ink uppercase">
          {content.title}
        </p>

        {content.message && (
          <p className="mx-auto mt-6 mb-0 max-w-xs text-[13.5px] leading-relaxed text-inv-ink-soft">
            {content.message}
          </p>
        )}

        {content.signature && (
          <p className="mt-8 mb-0 font-inv-script text-[clamp(2.2rem,9vw,3.2rem)] leading-none text-inv-accent">
            {content.signature}
          </p>
        )}

        {content.action && (
          <div className="mt-9">
            <ActionLink label={content.action.label} href={content.action.href} tone="onSurface" />
          </div>
        )}
      </BlockContainer>
    </BlockSection>
  );
}
