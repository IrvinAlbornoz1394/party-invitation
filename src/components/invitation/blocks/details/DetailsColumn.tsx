import { BlockHeading } from '../../shared/BlockHeading';
import { blockIconComponent } from '../../shared/block-icons';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { TextLink } from '../../shared/TextLink';
import type { DetailsVariantProps } from './details-variant';

/**
 * `details.column` — los datos en una columna centrada: el dibujo arriba, el rótulo en versalitas
 * espaciadas y el texto debajo, con un filete corto separando uno de otro.
 *
 * Es la novena variante y la única **centrada en un eje**. Las ocho anteriores alinean el dato a
 * la izquierda —en tarjeta, en lista, en ficha, en pegatina— porque es como se lee más rápido una
 * lista de cosas prácticas. Esta lo centra, y con eso cambia lo que la sección dice: deja de ser
 * una hoja de instrucciones y pasa a ser una **serie de avisos**, cada uno con su símbolo y su
 * espacio, como los que se imprimen en el reverso de una participación.
 *
 * Es la composición que pide una invitación estrecha y simétrica, donde todo lo demás —la corona,
 * la fecha, la sede, la despedida— también está en el eje. Un dato alineado a la izquierda en
 * medio de esa columna se lee como un fallo de maquetación.
 *
 * ## El icono va arriba y no al lado
 *
 * Es la consecuencia de centrar: al lado, el dibujo empuja al rótulo fuera del eje y la simetría
 * se rompe en cada fila. Arriba, cada aviso queda como un pequeño escudo —símbolo, título,
 * texto— y la columna entera se lee a plomo.
 *
 * ## El filete separa, pero no encierra
 *
 * Corto y centrado entre un dato y el siguiente, no a todo el ancho ni alrededor. A todo el ancho
 * sería una tabla —que es `details.list`— y alrededor, una tarjeta —que es `details.cards`—. Un
 * filete de tres centímetros dice «aquí se acaba este aviso» sin dibujar ninguna caja, que es lo
 * que esta plantilla necesita.
 */
export function DetailsColumn({ content }: DetailsVariantProps) {
  const lastIndex = content.items.length - 1;

  return (
    <BlockSection block="details" variant="column">
      <BlockContainer className="max-w-md text-center">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleCase="caps"
        />

        {content.image && (
          <figure className="relative m-0 mt-10 w-full">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-10 border border-inv-accent/60"
            />
            <div className="relative aspect-[21/9] w-full overflow-hidden bg-inv-primary/10">
              <BlockImage image={content.image} sizes="(min-width: 640px) 28rem, 90vw" />
            </div>
          </figure>
        )}

        <ul className="mt-12 flex list-none flex-col items-center p-0">
          {content.items.map((item, index) => {
            const Icon = blockIconComponent(item.icon);

            return (
              // El índice como clave es correcto aquí: los detalles no se reordenan ni se insertan
              // en caliente, se renderizan una vez desde contenido guardado.
              <li key={index} className="flex w-full flex-col items-center">
                <Icon size={26} strokeWidth={0.9} aria-hidden="true" className="text-inv-accent" />

                <h3 className="mt-4 mb-0 text-[11.5px] leading-snug font-normal tracking-[0.26em] text-inv-ink uppercase">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="mt-3 mb-0 max-w-xs text-[13.5px] leading-relaxed text-inv-ink-soft">
                    {item.description}
                  </p>
                )}

                {item.action && <TextLink action={item.action} className="mt-3" />}

                {/* El filete entre avisos: ni después del último, ni a todo el ancho. */}
                {index !== lastIndex && (
                  <span aria-hidden="true" className="my-9 block h-px w-14 bg-inv-accent/40" />
                )}
              </li>
            );
          })}
        </ul>

        {content.note && <BlockNote note={content.note} className="mt-12 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
