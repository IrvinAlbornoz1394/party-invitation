import clsx from 'clsx';
import { BlockImage } from '../../shared/BlockImage';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { blockIconComponent } from '../../shared/block-icons';
import { ClosingMessage, type ClosingVariantProps } from './closing-parts';

/**
 * `closing.note` — la despedida en una nota: una tarjeta elevada, con el medallón encimado sobre
 * la fotografía y el mensaje debajo.
 *
 * Es el sexto cierre y el que le toca a `silk`. Sale de la sección de «deseos» de su referencia:
 * una pieza de papel centrada, con un remate pequeño arriba y tres o cuatro renglones dentro. Ahí
 * el texto habla de la mesa de regalos; aquí es el mensaje final del bloque, que es el contenido
 * que existe —no se inventa un bloque de regalos para copiar una sección.
 *
 * ## Qué la separa de los otros cinco
 *
 *   `split`     foto a un lado, frase al otro.
 *   `letter`    una carta que se despliega, con su sello.
 *   `horizon`   la frase sola, a pantalla completa.
 *   `envelope`  un sobre dibujado con la tarjeta asomando.
 *   `album`     la foto montada con esquineras y la frase al pie.
 *   `note`      **una nota apoyada en el papel: banda, medallón encimado y el mensaje dentro.**
 *
 * `letter` y `envelope` dibujan el objeto —el pliego, el sobre— con sus SVG. Esta no dibuja nada:
 * es una caja de papel con sombra, y todo lo que la hace un objeto es el canto y el medallón que
 * se monta sobre la fotografía. Es el cierre que corresponde a una plantilla cuyas piezas son
 * todas rectángulos de papel flotando, y no habría encajado en las otras cuatro estructuras.
 *
 * ## El medallón lleva el icono del contenido
 *
 * `closingContentSchema` trae un `icon` con `heart` por defecto, y es el único bloque que lo tiene
 * suelto —una copa para un brindis, unas chispas para unos XV—. Aquí se pinta cercado por un
 * filete y encabalgado en el canto de la fotografía, que es donde una papelería pone su remate. Es
 * también lo que evita el corte seco entre la foto y el texto: sin él, la banda y el mensaje son
 * dos piezas pegadas.
 *
 * Sin fotografía el medallón no desaparece: se queda arriba del mensaje, dentro de la tarjeta. Es
 * el mismo criterio de todo el catálogo —el componente se compone de las dos maneras— y aquí sale
 * casi gratis porque el medallón no depende de la imagen para tener sitio.
 */
export function ClosingNote({ content }: ClosingVariantProps) {
  const Mark = blockIconComponent(content.icon);

  return (
    <BlockSection block="closing" variant="note">
      <BlockContainer className="max-w-xl">
        {/* `overflow-hidden` en la tarjeta y no un radio en la fotografía: así la banda se recorta
            con el mismo canto que el resto de la pieza sea cual sea el radio del tema, y no hay
            dos redondeos que puedan quedar desiguales. El medallón se sale hacia arriba dentro del
            flujo, no del recuadro, así que el recorte no se lo come. */}
        <article className="relative overflow-hidden rounded-inv-lg border border-inv-line bg-inv-surface shadow-inv-soft">
          {content.image && (
            <figure className="relative isolate m-0 aspect-[16/9] w-full overflow-hidden">
              <BlockImage image={content.image} sizes="(min-width: 640px) 576px, 100vw" />
            </figure>
          )}

          {/*
            El medallón. Con fotografía se encabalga en su canto —de ahí el margen negativo—; sin
            ella se queda dentro del relleno de la tarjeta y no hay nada que compensar. El fondo es
            `surface`, el mismo de la tarjeta, para que al montarse sobre la foto abra un hueco
            limpio y no un disco translúcido.
          */}
          <span
            aria-hidden="true"
            className={clsx(
              'relative z-10 mx-auto grid size-14 place-items-center rounded-full border border-inv-accent/45 bg-inv-surface text-inv-accent',
              content.image ? '-mt-7' : 'mt-10',
            )}
          >
            <Mark size={21} strokeWidth={1.4} />
          </span>

          <div className="px-6 pt-6 pb-12 sm:px-12">
            <ClosingMessage content={content} align="center" />
          </div>
        </article>
      </BlockContainer>
    </BlockSection>
  );
}
