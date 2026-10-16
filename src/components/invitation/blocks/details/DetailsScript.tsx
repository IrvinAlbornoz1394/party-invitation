import clsx from 'clsx';
import { requireDesignAsset } from '@/lib/design-assets';
import { ArchFrame } from '../../shared/ArchFrame';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { DesignAsset } from '../../shared/DesignAsset';
import { TextLink } from '../../shared/TextLink';
import type { DetailsVariantProps } from './details-variant';

const CLUSTER = requireDesignAsset('botanical-sprig-cluster-001');

/**
 * `details.script` — cada detalle como un rótulo de participación: el título en manuscrita, el
 * texto debajo, y un ramillete asomando por el margen, una vez a cada lado.
 *
 * Es la forma en que la papelería de XV escribe «Mis padres» y «Mis padrinos»: un nombre de
 * sección a mano y los datos centrados debajo, sin caja ni icono. Por eso esta variante es la
 * única del bloque que **no pinta el icono** de cada detalle: aquí el rótulo manuscrito hace su
 * trabajo —distinguir un detalle de otro de un vistazo— y un dibujo encima le quitaría el sitio.
 * El icono se sigue guardando, y lo usan las otras nueve.
 *
 * El ramillete cambia de margen en cada detalle, y no está ahí de adorno: en una columna centrada
 * sin cajas es lo que marca dónde empieza el siguiente.
 */
export function DetailsScript({ content }: DetailsVariantProps) {
  return (
    <BlockSection block="details" variant="script">
      <BlockContainer className="max-w-md">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleFont="script"
        />

        {content.image && (
          <ArchFrame className="mx-auto mt-12 aspect-[3/4] w-40 sm:w-44">
            <BlockImage image={content.image} sizes="11rem" />
          </ArchFrame>
        )}

        <ul className="m-0 mt-12 list-none p-0">
          {content.items.map((item, index) => {
            const onTheRight = index % 2 === 1;

            return (
              <li key={index} className="relative px-14 text-center sm:px-16 [&+&]:mt-11">
                <DesignAsset
                  asset={CLUSTER}
                  flip={onTheRight ? 'x' : undefined}
                  className={clsx(
                    'pointer-events-none absolute top-1 w-14 text-inv-primary opacity-75 sm:w-16',
                    onTheRight ? '-right-3' : '-left-3',
                  )}
                />
                <h3 className="m-0 font-inv-script text-[clamp(1.65rem,7vw,2.1rem)] leading-[1.15] font-normal text-inv-accent">
                  {item.title}
                </h3>
                {hasText(item.description) && (
                  <p className="mt-2 mb-0 text-[14px] leading-relaxed text-inv-ink">
                    {item.description}
                  </p>
                )}
                {item.action && <TextLink action={item.action} className="mt-3" />}
              </li>
            );
          })}
        </ul>

        {hasText(content.note) && <BlockNote note={content.note} className="mt-12 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
