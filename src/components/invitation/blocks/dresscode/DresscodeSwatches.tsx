import clsx from 'clsx';
import { paletteIsNamed } from '@/domain/invitation/blocks/dresscode';
import { ActionLink } from '../../shared/ActionLink';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { Swatch } from './dresscode-parts';
import type { DresscodeVariantProps } from './dresscode-variant';

/**
 * `dresscode.swatches` — el muestrario de telas: una ficha por tono, con la muestra en un
 * rectángulo apaisado y el nombre al lado.
 *
 * Es la sexta forma de enseñar una paleta y sale directamente de la referencia de `silk`, donde
 * el código de vestimenta es literalmente un catálogo de telas: una fila por color, la muestra
 * grande a la izquierda y su nombre a la derecha, cada fila en su propia pieza de papel.
 *
 * ## Qué cambia respecto de las otras cinco
 *
 * No es «lo mismo en vertical». Lo que cambia es **qué es una muestra**, que es el criterio con
 * el que se separan las seis:
 *
 *   `palette`  círculos sueltos en una fila, con el nombre debajo. Una paleta.
 *   `cards`    fichas de muestrario en rejilla, la muestra cuadrada. Un catálogo.
 *   `chart`    tramos pegados sin calle, numerados al pie. Una carta de imprenta.
 *   `thread`   cuentas ensartadas en un hilo. Un collar.
 *   `bands`    franjas a sangre, sin papel alrededor. Un cartel.
 *   `swatches` **retales apaisados, uno por renglón, cada uno en su ficha.** Un muestrario.
 *
 * La diferencia práctica con `cards` —la más cercana— es la proporción y la dirección. Una
 * muestra cuadrada de siete centímetros en rejilla se lee como un color; un rectángulo apaisado a
 * media ficha se lee como un **trozo de tela**, que es lo que hay que imaginarse encima. Y en
 * columna caben nombres largos —«Verde botella», «Azul noche»— sin partirlos en dos renglones,
 * que es lo que le pasa a la rejilla en un teléfono.
 *
 * ## Sin nombres, la muestra ocupa la ficha entera
 *
 * `paletteIsNamed` ya existe en el dominio para esto y las cinco anteriores lo consultan. Aquí no
 * sirve solo para ocultar la lista a los lectores de pantalla: cambia la maqueta. Una paleta sin
 * rotular —la boda del catálogo es una— dejaría media ficha vacía en cada renglón, y seis fichas
 * medio vacías se leen como un texto que no cargó. Cuando no hay nombres, el retal se estira a
 * todo el ancho y la sección pasa a ser una pila de telas, que es una composición terminada.
 *
 * El acabado metálico lo resuelve `Swatch` con su brillo, igual que en las otras cinco: el reflejo
 * es lo único que distingue un oro de un mostaza en una pantalla, y no puede quedar a criterio de
 * cada variante.
 */
export function DresscodeSwatches({ content }: DresscodeVariantProps) {
  const named = paletteIsNamed(content.palette);

  return (
    <BlockSection block="dresscode" variant="swatches">
      <BlockContainer className="max-w-xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.description}
          align="center"
        />

        <ul
          /* Sin nombres, la lista no dice nada que no diga ya la descripción: son manchas de
             color. Se oculta a quien escucha la página en vez de anunciarle seis elementos
             vacíos. Es el mismo criterio de `palette`, `cards` y `chart`. */
          aria-hidden={named ? undefined : 'true'}
          className="mt-12 grid list-none gap-3 p-0"
        >
          {content.palette.map((swatch, index) => (
            // El índice como clave es correcto aquí: la paleta no se reordena ni se inserta en
            // caliente. Y no sirve el color: dos muestras del mismo tono con acabados distintos
            // son legítimas.
            <li
              key={index}
              className="flex items-center gap-5 rounded-inv-md border border-inv-line bg-inv-surface p-3 shadow-inv-soft"
            >
              {/*
                El retal. El alto es fijo y el ancho depende de si hay nombre al lado: con nombre
                es una columna de ancho fijo —para que los rótulos queden a plomo entre fichas—, y
                sin nombre se lleva la ficha entera. El filete va aquí, en el recorte, y no en la
                muestra: `Swatch` con forma `block` se pinta sin borde a propósito, para poder
                enmarcarlo desde fuera sin abrir una calle blanca entre el color y su cerco.
              */}
              <span
                className={clsx(
                  'h-16 shrink-0 overflow-hidden rounded-inv-sm ring-1 ring-inv-line',
                  named ? 'w-28 sm:w-32' : 'w-full',
                )}
              >
                <Swatch swatch={swatch} shape="block" />
              </span>

              {swatch.label && (
                <span className="min-w-0 text-[11px] leading-snug tracking-[0.2em] text-inv-ink uppercase sm:text-[11.5px]">
                  {swatch.label}
                </span>
              )}
            </li>
          ))}
        </ul>

        {content.action && (
          <div className="mt-10 text-center">
            <ActionLink label={content.action.label} href={content.action.href} tone="onSurface" />
          </div>
        )}

        {content.note && (
          <BlockNote note={content.note} className="mx-auto mt-8 max-w-sm text-center" />
        )}
      </BlockContainer>
    </BlockSection>
  );
}
