import clsx from 'clsx';
import { blockIconComponent } from '../../shared/block-icons';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { BowCard } from '../../shared/BowCard';
import { TextLink } from '../../shared/TextLink';
import type { DetailsVariantProps } from './details-variant';

/**
 * `details.ribbons` — cada detalle en una tarjeta pequeña del moño, de dos en dos: el dibujo de
 * trazo fino, el rótulo a pincel y la frase debajo.
 *
 * Es la de `coquette`, que la referencia no trae: allí «Detalles» es el rótulo de las tarjetas de
 * las sedes, y los avisos sueltos —estacionamiento, niños, regalos— no tienen sitio. Se dibujan
 * con la misma tarjeta (`BowCard`) en pequeño, para que se lean como fichas de la misma caja.
 *
 * Las otras diez ponen los detalles en filas, renglones, pegatinas o paneles; esta es la única
 * que los **ata uno a uno**. Por eso aguanta mal los párrafos largos —una tarjeta de media
 * pantalla con ocho renglones deja de ser una ficha— y pide frases cortas, como `details.row`.
 *
 * Dos columnas también en móvil, que es la composición: con un número impar, la última tarjeta
 * ocupa el ancho entero y queda centrada debajo en vez de dejar un hueco al lado.
 */
export function DetailsRibbons({ content }: DetailsVariantProps) {
  const odd = content.items.length % 2 === 1;

  return (
    <BlockSection block="details" variant="ribbons">
      <BlockContainer className="max-w-xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleFont="script"
          className="[&_h2]:text-inv-accent"
        />

        {content.image && (
          <div className="mx-auto mt-10 w-[min(64vw,15rem)] rotate-[1.5deg] bg-white p-2 shadow-[0_18px_34px_-22px_rgba(90,40,50,0.55)]">
            <div className="relative aspect-[4/5] overflow-hidden">
              <BlockImage image={content.image} sizes="15rem" />
            </div>
          </div>
        )}

        <ul className="m-0 mt-14 grid list-none grid-cols-2 gap-x-3 gap-y-10 p-0 sm:gap-x-5">
          {content.items.map((item, index) => {
            const Icon = blockIconComponent(item.icon);
            const lastAlone = odd && index === content.items.length - 1;

            return (
              <li key={index} className={clsx(lastAlone && 'col-span-2 mx-auto w-[calc(50%-0.375rem)] sm:w-[calc(50%-0.625rem)]')}>
                <BowCard className="h-full p-1.5 sm:p-2" innerClassName="px-2.5 pt-10 pb-5 sm:px-4">
                  <Icon size={30} strokeWidth={1} aria-hidden="true" className="mx-auto text-inv-primary" />
                  <h3 className="mt-2 mb-0 font-inv-script text-[clamp(1.7rem,7.5vw,2.1rem)] leading-[1.1] font-normal text-balance text-inv-ink">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-2 mb-0 text-[12.5px] leading-relaxed text-pretty text-inv-ink-soft">
                      {item.description}
                    </p>
                  )}
                  {item.action && <TextLink action={item.action} className="mt-2.5" />}
                </BowCard>
              </li>
            );
          })}
        </ul>

        {content.note && <BlockNote note={content.note} className="mt-12 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
