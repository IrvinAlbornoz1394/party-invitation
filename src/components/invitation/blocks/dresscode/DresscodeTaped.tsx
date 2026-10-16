import clsx from 'clsx';
import { paletteIsNamed } from '@/domain/invitation/blocks/dresscode';
import { requireDesignAsset } from '@/lib/design-assets';
import { ActionLink } from '../../shared/ActionLink';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DesignAsset } from '../../shared/DesignAsset';
import { hasText } from '../../shared/has-text';
import { RedThread } from '../../shared/RedThread';
import { Reveal } from '../../shared/Reveal';
import { staggerDelay } from '../../shared/stagger';
import { Swatch } from './dresscode-parts';
import type { DresscodeVariantProps } from './dresscode-variant';

const TAPE = requireDesignAsset('sticker-tape-001');
const SCRAP = requireDesignAsset('sticker-paper-scrap-001');
const HEART = requireDesignAsset('symbol-heart-solid-001');

/**
 * El giro de cada ficha y el de su cinta, por posición.
 *
 * Una tabla fija y no un aleatorio: el servidor y el navegador tienen que pintar el mismo grado,
 * y una ficha que salta de inclinación al hidratar se ve como un fallo. Seis entradas porque la
 * paleta no pasa de seis; el módulo es solo un seguro. Las clases van escritas enteras para que
 * Tailwind las encuentre.
 */
const CHIP_TILT = ['-rotate-2', 'rotate-[1.5deg]', '-rotate-1', 'rotate-2', 'rotate-[-1.5deg]', 'rotate-1'];
const TAPE_TILT = ['rotate-[4deg]', '-rotate-6', 'rotate-[-3deg]', 'rotate-[5deg]', '-rotate-3', 'rotate-[6deg]'];

/**
 * `dresscode.taped` — la paleta como muestras de pintura pegadas al álbum con cinta.
 *
 * Es la de `scrapbook`, donde todo lo que se enseña está **pegado**: las fotos, el recorte de
 * periódico, la cámara. Aquí cada color es una ficha de papel —la tarjeta de muestra que uno se
 * trae de la tienda de pinturas o el retal de tela de la modista—, sujeta por una tira de washi
 * y con el nombre escrito a mano debajo.
 *
 * ## En qué se diferencia de sus hermanas
 *
 * `cards` y `swatches` también dibujan rectángulos, pero alineados a escuadra en una rejilla: son
 * un muestrario impreso. Aquí cada ficha va **suelta**, con su propio giro y su propia cinta,
 * y eso es lo que la hace leerse como algo que alguien recortó y pegó, que es el idioma entero
 * de la plantilla. El hilo rojo cruza por detrás, como en el resto de secciones.
 *
 * ## Por qué `flex-wrap` y no una rejilla
 *
 * Con dos por fila en móvil y tres en escritorio, una rejilla deja la quinta ficha sola a la
 * izquierda y se lee como un hueco. Con `flex-wrap` y `justify-center`, la última fila se centra
 * sola, sean dos colores o seis. El ancho es la mitad menos la calle, con tope: a 360px caben
 * dos fichas de unos 145px, que es lo que necesita un «Azul noche» escrito a mano sin partirse.
 *
 * ## Información o decoración
 *
 * Como en todas: con algún nombre, la lista se anuncia; sin ninguno, la lista entera es
 * decorativa. Ver `paletteIsNamed`.
 */
export function DresscodeTaped({ content }: DresscodeVariantProps) {
  const named = paletteIsNamed(content.palette);

  return (
    <BlockSection block="dresscode" variant="taped" className="relative isolate">
      {/* El recorte de periódico, asomando por la esquina sobre el aire de arriba de la sección:
          ahí no pisa el título, que en manuscrita ocupa casi todo el ancho de un móvil. */}
      <DesignAsset
        asset={SCRAP}
        className="pointer-events-none absolute top-3 -right-6 w-24 rotate-[10deg] sm:right-[8%] sm:w-28"
      />

      <BlockContainer className="max-w-3xl">
        <div className="flex flex-col items-center text-center">
          <BlockHeading
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.description}
            align="center"
            titleFont="script"
          />
        </div>

        <div className="relative mt-12">
          {/* El hilo pasa por detrás de las fichas, a la altura de las cintas de la primera fila. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-4 -z-10 h-20">
            <RedThread shape="swag" className="h-full w-full text-inv-primary" />
            <DesignAsset
              asset={HEART}
              className="absolute top-[60%] left-[38%] w-3.5 -translate-x-1/2 -translate-y-1/2 text-inv-primary"
            />
          </div>

          <ul
            aria-hidden={named ? undefined : 'true'}
            className="m-0 flex list-none flex-wrap justify-center gap-x-4 gap-y-8 p-0"
          >
            {content.palette.map((swatch, index) => (
              // Índice como clave: la paleta no se reordena en caliente y dos muestras del mismo
              // tono con acabado distinto son legítimas, así que el color no sirve. Tres por fila en
              // el teléfono: son muestras, no fotos, y a media fila la paleta ocupaba dos pantallas.
              <li key={index} className="w-[calc(33.333%-0.7rem)] max-w-[6.5rem] sm:w-28 sm:max-w-none">
                <Reveal delay={staggerDelay(index, 0.06)}>
                  <div
                    className={clsx(
                      'relative bg-inv-surface p-2 pb-3 shadow-inv-soft',
                      CHIP_TILT[index % CHIP_TILT.length],
                    )}
                  >
                    {/* La cinta, encima del canto de arriba y medio fuera de la ficha. */}
                    <DesignAsset
                      asset={TAPE}
                      className={clsx(
                        'pointer-events-none absolute -top-3 left-1/2 z-10 w-16 -translate-x-1/2 opacity-90',
                        TAPE_TILT[index % TAPE_TILT.length],
                      )}
                    />

                    {/* `block` dentro de una caja con proporción propia: el cuadrado de `square`
                        no da la ficha alargada de una muestra de pintura. */}
                    <div className="aspect-[4/5] w-full ring-1 ring-inv-line">
                      <Swatch swatch={swatch} shape="block" />
                    </div>

                    {hasText(swatch.label) && (
                      <span className="mt-2.5 block font-inv-display text-[1.05rem] leading-tight text-inv-ink-soft italic">
                        {swatch.label}
                      </span>
                    )}
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>

        {/* El pie solo guarda el enlace y la nota: sin ninguno de los dos no se pinta, ni su margen. */}
        {(content.action || hasText(content.note)) && (
          <div className="mt-14 flex flex-col items-center text-center">
            {content.action && (
              <ActionLink label={content.action.label} href={content.action.href} tone="onSurface" />
            )}

            {hasText(content.note) && (
              <BlockNote note={content.note} className={clsx('max-w-sm', content.action && 'mt-8')} />
            )}
          </div>
        )}
      </BlockContainer>
    </BlockSection>
  );
}
