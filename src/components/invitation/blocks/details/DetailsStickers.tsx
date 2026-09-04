import clsx from 'clsx';
import { BlockHeading } from '../../shared/BlockHeading';
import { blockIconComponent } from '../../shared/block-icons';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { TextLink } from '../../shared/TextLink';
import type { DetailsVariantProps } from './details-variant';

/**
 * `details.stickers` — cada dato en su pegatina: el icono dentro de una mancha de contorno
 * irregular, y el texto al lado.
 *
 * Es la octava variante del bloque. Las siete anteriores encierran el icono en un círculo, en un
 * cuadrado o en nada; esta lo mete en la **misma mancha** que el código de vestimenta usa para
 * sus tonos —el `border-radius` de ocho valores, ver `dresscode.drops`— y con eso las dos
 * secciones se leen como parte del mismo cuaderno. Es lo que hace una plantilla ilustrada: no
 * repite un icono, repite un **gesto**.
 *
 * ## Las manchas alternan de forma y de lado
 *
 * Cuatro formas escritas, repartidas por posición y nunca al azar —el azar da un render distinto
 * en el servidor y en el cliente—, y las pegatinas van alternando el margen izquierdo con un
 * desplazamiento pequeño. Sin ese desfase, seis manchas seguidas vuelven a formar una columna
 * recta y el dibujo se convierte en una lista con viñetas raras.
 *
 * El desplazamiento es de doce píxeles y solo desde `sm`: en un móvil de 320 puntos, mover la
 * columna de texto le quita medida a un párrafo que ya va justo.
 */
export function DetailsStickers({ content }: DetailsVariantProps) {
  return (
    <BlockSection block="details" variant="stickers">
      <BlockContainer className="max-w-2xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleFill="outline"
          titleCase="caps"
        />

        {content.image && (
          <figure className="relative isolate m-0 mt-12 aspect-[16/9] w-full overflow-hidden rounded-inv-lg">
            <BlockImage image={content.image} sizes="(min-width: 768px) 672px, 100vw" />
          </figure>
        )}

        <ul className="mt-12 grid list-none gap-8 p-0">
          {content.items.map((item, index) => {
            const Icon = blockIconComponent(item.icon);

            return (
              // El índice como clave es correcto aquí: los detalles no se reordenan ni se insertan
              // en caliente, se renderizan una vez desde contenido guardado.
              <li
                key={index}
                className={clsx(
                  'flex items-start gap-5',
                  index % 2 === 1 && 'sm:ml-3',
                )}
              >
                <span
                  aria-hidden="true"
                  className="grid size-14 shrink-0 place-items-center bg-inv-accent/15 text-inv-primary"
                  style={{ borderRadius: STICKER_SHAPES[index % STICKER_SHAPES.length] }}
                >
                  <Icon size={22} strokeWidth={1.3} />
                </span>

                <div className="min-w-0 pt-1.5">
                  <h3 className="m-0 font-inv-display text-[1.15rem] leading-snug font-medium text-inv-primary">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="mt-1.5 mb-0 text-[14.5px] leading-relaxed text-inv-ink-soft">
                      {item.description}
                    </p>
                  )}

                  {item.action && <TextLink action={item.action} className="mt-3" />}
                </div>
              </li>
            );
          })}
        </ul>

        {content.note && <BlockNote note={content.note} className="mt-10 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}

/**
 * Las cuatro manchas de las pegatinas.
 *
 * Son otras que las de `dresscode.drops` a propósito: aquí la mancha rodea un dibujo y tiene que
 * dejarle sitio en el centro, así que ninguna se estrecha tanto. Comparten el recurso, no la
 * tabla — y por eso están escritas en cada archivo en vez de en una constante común: son valores
 * de composición de cada sección, como los ángulos de `gallery.polaroid`.
 */
const STICKER_SHAPES = [
  '52% 48% 44% 56% / 48% 52% 48% 52%',
  '44% 56% 52% 48% / 54% 46% 54% 46%',
  '56% 44% 48% 52% / 46% 54% 46% 54%',
  '48% 52% 56% 44% / 52% 48% 52% 48%',
] as const;
