import clsx from 'clsx';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockImage } from '../../shared/BlockImage';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { externalLinkAttributes } from '../../shared/href';
import { LeafSprig } from '../../shared/paper-ornaments';
import type { ClosingVariantProps } from './closing-parts';

/**
 * `closing.envelope` — la despedida dentro de un sobre, con la tarjeta asomando.
 *
 * Es el cierre que devuelve el gesto que una invitación digital pierde: el sobre. La frase de
 * despedida va sobre el papel, y debajo hay un sobre del color del tema con una tarjeta metida
 * dentro que asoma por arriba — y en esa tarjeta va lo último que alguien necesita de una
 * invitación: **a quién preguntar**. Un teléfono, un WhatsApp, un «escríbenos».
 *
 * ## Por qué la acción no es el botón de siempre
 *
 * `ActionLink` pinta el botón sólido de la invitación, y dentro de una tarjeta de papel se vería
 * como un elemento de interfaz pegado en una ilustración. Aquí el destino es casi siempre un
 * teléfono, y lo que se quiere es que se lea grande, se pueda tocar con el pulgar y se pueda
 * copiar: por eso es un enlace compuesto como el dato manuscrito de una tarjeta y no un botón.
 * Sigue pasando por `shared/href.ts`, que es donde se decide una sola vez cómo se tratan los
 * destinos externos.
 *
 * ## Por qué el sobre son dos piezas y la tarjeta va en medio
 *
 * La solapa abierta se dibuja detrás, la tarjeta encima de ella y el cuerpo del sobre encima de la
 * tarjeta. Ese orden es lo que hace que la tarjeta esté *dentro* y no *delante*: se le ve la mitad
 * de arriba y la de abajo desaparece tras el cuerpo. Con una sola figura habría que recortar la
 * tarjeta con una máscara y el resultado sería el mismo dibujo con el triple de trabajo.
 *
 * Las dos piezas son SVG con `currentColor`, así que el sobre es del color del tema. La firma y la
 * tarjeta, en cambio, son HTML: necesitan la tipografía y los colores del tema, y el texto dentro
 * de un SVG no hereda ni una cosa ni la otra de forma fiable en todos los navegadores.
 *
 * ## La fotografía, si la hay, es el sello
 *
 * El contenido del cierre admite una imagen y esta variante no la deja fuera: entra como un sello
 * pegado y ligeramente torcido en la esquina de la tarjeta. Es el sitio donde una foto cabe sin
 * romper la composición — de fondo taparía el sobre, que es la pieza que da sentido al bloque.
 */
export function ClosingEnvelope({ content }: ClosingVariantProps) {
  return (
    <BlockSection block="closing" variant="envelope">
      <BlockContainer className="max-w-xl">
        <div className="flex flex-col items-center text-center">
          <BlockHeading
            eyebrow={content.eyebrow}
            title={content.title}
            align="center"
            titleCase="caps"
          />

          <LeafSprig className="mt-6 h-7 w-40 text-inv-accent opacity-80" />

          {content.message && (
            <p className="mt-7 mb-0 max-w-md text-[15px] leading-relaxed text-inv-ink-soft">
              {content.message}
            </p>
          )}

          {/*
            El sobre. La proporción del contenedor y la del `viewBox` de las dos piezas son la
            misma (8:5), y de ahí que las piezas puedan ir en `absolute inset-0` sin deformarse: el
            dibujo escala con el ancho y la composición no se descuadra en ningún tamaño.
          */}
          <div className="relative mt-12 aspect-[8/5] w-full max-w-sm">
            <EnvelopeFlap className="absolute inset-0 h-full w-full text-inv-primary" />

            {/*
              La tarjeta. Va del 6 % al 50 % del alto del sobre: por encima del canto del cuerpo
              —que empieza en el 35 %— asoma lo suficiente para leerse, y por debajo queda tapada,
              que es lo que la mete *dentro* del sobre en lugar de delante.
            */}
            <div className="absolute inset-x-[13%] top-[6%] h-[44%] rounded-inv-sm bg-inv-surface shadow-inv-soft">
              {/*
                El contenido se centra en los dos tercios de ARRIBA de la tarjeta, que es la parte
                que se ve. Es una caja absoluta con la altura en porcentaje y no un relleno inferior:
                un `padding-bottom` en porcentaje se mide contra el **ancho** del elemento, así que
                el texto se descolocaría en cuanto el sobre cambiara de proporción.
              */}
              <div className="absolute inset-x-0 top-0 flex h-[66%] items-center justify-center px-4">
                {content.action ? (
                  <a
                    href={content.action.href}
                    {...externalLinkAttributes(content.action.href)}
                    className="font-inv-display text-[clamp(1rem,4.4vw,1.35rem)] leading-none tracking-[0.06em] text-inv-primary! tabular-nums underline! decoration-inv-accent/40 underline-offset-[6px] transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none"
                  >
                    {content.action.label}
                  </a>
                ) : (
                  /* Sin acción, la tarjeta no se queda en blanco: lleva la ramita. Una tarjeta
                     vacía asomando de un sobre se lee como un hueco donde falta algo. */
                  <LeafSprig className="h-6 w-28 text-inv-accent opacity-70" />
                )}
              </div>

              {content.image && (
                /*
                  El sello: cuadrado, torcido y pequeño. Sobresale de la tarjeta por la esquina
                  —de ahí el desplazamiento negativo— porque un sello encajado dentro del borde se
                  ve como una miniatura y no como algo pegado encima.
                */
                <figure className="absolute -top-3 -right-3 m-0 size-14 rotate-6 overflow-hidden rounded-inv-sm border-2 border-inv-surface bg-inv-primary/10 shadow-inv-soft sm:size-16">
                  <BlockImage image={content.image} sizes="64px" />
                </figure>
              )}
            </div>

            <EnvelopeBody className="absolute inset-0 h-full w-full text-inv-primary" />

            {/* La firma va sobre el cuerpo del sobre, así que en `onPrimary`: es la pareja de
                contraste que el tema garantiza sobre `primary`. */}
            {content.signature && (
              <p className="absolute inset-x-0 bottom-[9%] m-0 px-6 font-inv-script text-[clamp(1.5rem,7vw,2.1rem)] leading-none text-inv-on-primary">
                {content.signature}
              </p>
            )}
          </div>
        </div>
      </BlockContainer>
    </BlockSection>
  );
}

/**
 * La solapa abierta, detrás de todo.
 *
 * Va a trazo y no rellena: rellena del color del sobre se fundiría con el cuerpo y el sobre
 * parecería cerrado. Con el contorno y un relleno muy leve se lee como la solapa levantada por
 * detrás, que es lo que dice «este sobre está abierto» sin dibujar una sombra.
 */
function EnvelopeFlap({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 320 200"
      aria-hidden="true"
      className={clsx('pointer-events-none', className)}
      fill="none"
    >
      <path
        d="M6 76 160 8l154 68"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        opacity="0.55"
      />
      {/* El grosor del papel de la solapa: una segunda línea a dos píxeles de la primera. */}
      <path d="M6 82 160 15l154 67" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
    </svg>
  );
}

/**
 * El cuerpo del sobre: el rectángulo relleno y la V del cierre.
 *
 * Se pinta **después** de la tarjeta y por eso la tapa. La V no es un adorno: es lo único que
 * distingue un sobre de un rectángulo, y va en un trazo del color del texto de encima
 * (`onPrimary`) a baja opacidad, no en negro — un trazo oscuro sobre un color medio se ve como
 * una grieta.
 */
function EnvelopeBody({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 320 200"
      aria-hidden="true"
      className={clsx('pointer-events-none', className)}
    >
      <path d="M0 70h320v124a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6V70Z" fill="currentColor" />
      <path
        d="M0 70l160 74L320 70"
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity="0.35"
        className="fill-none stroke-inv-on-primary"
      />
    </svg>
  );
}
