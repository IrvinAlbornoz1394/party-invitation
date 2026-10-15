import clsx from 'clsx';
import { Heart } from 'lucide-react';
import { blockIconComponent } from '../../shared/block-icons';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { PolaroidFrame } from '../../shared/PolaroidFrame';
import { TextLink } from '../../shared/TextLink';
import type { DetailsVariantProps } from './details-variant';

/**
 * `details.row` — los detalles en fila, de tres en tres: un dibujo de trazo fino, el rótulo en
 * dos renglones de versalitas y, debajo, la frase corta.
 *
 * Es la de `blush`, y es la fila de la referencia («cena · fotos · música»): un pictograma por
 * columna, sin caja ni filete entre ellos. Las otras nueve ponen cada detalle en su tarjeta, su
 * renglón o su pegatina, y todas dejan sitio a un párrafo; esta es la más **telegráfica** del
 * bloque, y por eso funciona con lo que la referencia escribe —dos palabras por detalle— y pide
 * que la descripción sea corta.
 *
 * Tres columnas también en móvil cuando son tres o menos —la fila es la composición, y apilada
 * dejaría de serlo—; con cuatro o más, dos en móvil y tres desde tableta, porque a un tercio de
 * pantalla una frase de más de cuatro palabras se parte en seis renglones.
 */
export function DetailsRow({ content }: DetailsVariantProps) {
  const fewItems = content.items.length <= 3;

  return (
    <BlockSection block="details" variant="row">
      <BlockContainer className="max-w-xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleFont="script"
        />

        {content.image && (
          <PolaroidFrame
            className="mx-auto mt-10 w-[min(58vw,14rem)] rotate-[-2deg]"
            photoClassName="aspect-[4/5]"
          >
            <BlockImage image={content.image} sizes="14rem" />
          </PolaroidFrame>
        )}

        <ul
          className={clsx(
            'm-0 mt-12 grid list-none gap-x-4 gap-y-10 p-0 text-center',
            fewItems ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3',
          )}
        >
          {content.items.map((item, index) => {
            const Icon = blockIconComponent(item.icon);

            return (
              <li key={index} className="flex flex-col items-center">
                <Icon size={32} strokeWidth={1.1} aria-hidden="true" className="text-inv-primary" />
                <h3 className="mt-3 mb-0 max-w-[8rem] font-inv-display text-[12px] leading-snug font-normal tracking-[0.16em] text-balance text-inv-ink uppercase">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="mt-2 mb-0 max-w-[10rem] text-[12px] leading-relaxed text-pretty text-inv-ink-soft">
                    {item.description}
                  </p>
                )}
                {item.action && <TextLink action={item.action} className="mt-2.5" />}
              </li>
            );
          })}
        </ul>

        <p
          aria-hidden="true"
          className="mt-12 mb-0 flex items-center justify-center gap-3 text-inv-accent"
        >
          <span className="h-px w-16 bg-current opacity-45" />
          <Heart size={11} strokeWidth={0} className="fill-current" />
          <span className="h-px w-16 bg-current opacity-45" />
        </p>

        {content.note && <BlockNote note={content.note} className="mt-8 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
