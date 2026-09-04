import type { CSSProperties } from 'react';
import { paletteIsNamed } from '@/domain/invitation/blocks/dresscode';
import { ActionLink } from '../../shared/ActionLink';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { Candelabra } from '../../shared/doodle-ornaments';
import { METALLIC_SHEEN } from './dresscode-parts';
import type { DresscodeVariantProps } from './dresscode-variant';

/**
 * `dresscode.drops` — los tonos como gotas de pintura: manchas de contorno irregular, con el
 * candelabro dibujado al lado de la instrucción.
 *
 * Es la octava forma del bloque y la única en la que la muestra **no es una figura geométrica**.
 * Las siete anteriores usan el círculo, el cuadrado, el tramo de una carta o la franja; esta usa
 * una forma orgánica, distinta en cada muestra, como una gota de acuarela sobre el papel. En una
 * invitación dibujada a mano, siete círculos perfectos en fila son la única forma exacta de la
 * página y cantan.
 *
 * ## Cómo se dibuja una mancha sin dibujarla
 *
 * Con `border-radius` de ocho valores: cuatro para el eje horizontal y cuatro para el vertical.
 * Es un elipsoide irregular, no una figura recortada, así que **se puede rellenar con el color de
 * la muestra** —que es lo que hace falta— y no necesita ni SVG ni máscara. Con una máscara, el
 * color tendría que ir en un `background` recortado y el contorno se perdería.
 *
 * Las cuatro formas están **escritas** y se reparten por posición, nunca al azar: con azar de
 * verdad la composición cambiaría en cada recarga y saldría distinta en el servidor y en el
 * cliente, que es un error de hidratación de manual. Es la misma decisión que en
 * `gallery.polaroid` con sus ángulos.
 *
 * ## Por qué no se reutiliza `Swatch`
 *
 * Es la pieza compartida del bloque y la usan las siete anteriores, pero lo que comparte es la
 * **forma**: círculo, cuadrado o bloque, con su anillo y su brillo metálico. Aquí la forma es lo
 * que cambia, así que reutilizarla sería pasarle una novena forma que solo usa una variante —y el
 * brillo del metálico, que es lo único que de verdad no puede divergir, se **importa** de la
 * pieza compartida: el mismo degradado, sobre otra forma.
 */
export function DresscodeDrops({ content }: DresscodeVariantProps) {
  const named = paletteIsNamed(content.palette);

  return (
    <BlockSection block="dresscode" variant="drops">
      <BlockContainer className="max-w-2xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          align="center"
          titleFill="outline"
          titleCase="caps"
        />

        <div className="mt-12 flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:gap-12">
          <Candelabra className="w-24 shrink-0 text-inv-primary sm:w-28" />

          {content.description && (
            <p className="m-0 text-center text-[15px] leading-relaxed text-inv-ink-soft sm:text-left">
              {content.description}
            </p>
          )}
        </div>

        <ul
          /* Sin nombres, la lista no dice nada que no diga la instrucción: son manchas de color.
             Se oculta a quien escucha en vez de anunciarle seis elementos vacíos, como en las
             siete anteriores. */
          aria-hidden={named ? undefined : 'true'}
          className="mt-12 flex list-none flex-wrap items-start justify-center gap-x-6 gap-y-8 p-0"
        >
          {content.palette.map((swatch, index) => (
            // El índice como clave es correcto aquí: la paleta no se reordena ni se inserta en
            // caliente. Y no sirve el color: dos muestras del mismo tono con acabados distintos
            // son legítimas.
            <li key={index} className="flex w-20 flex-col items-center gap-3">
              <span
                className="relative block size-16 overflow-hidden ring-1 ring-inv-line sm:size-[4.5rem]"
                style={
                  {
                    backgroundColor: swatch.color,
                    borderRadius: DROP_SHAPES[index % DROP_SHAPES.length],
                  } as CSSProperties
                }
              >
                {/* El brillo del metálico, idéntico al de `Swatch`: es lo único que distingue un
                    oro de un mostaza en una pantalla y no puede quedar a criterio de la variante. */}
                {swatch.finish === 'metallic' && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{ backgroundImage: METALLIC_SHEEN }}
                  />
                )}
              </span>

              {swatch.label && (
                <span className="text-center text-[9.5px] leading-snug tracking-[0.14em] text-inv-ink-soft uppercase">
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

/**
 * Las cuatro manchas, escritas y no calculadas.
 *
 * Cuatro bastan: con seis muestras como mucho, la quinta repetiría la primera y el ojo no las
 * empareja a esa distancia. Ninguna es simétrica respecto de sus ejes —ahí está el truco— y
 * ninguna baja del 38 % ni sube del 62 %, que es donde una mancha deja de leerse como mancha y
 * empieza a parecer un error de maquetación.
 */
const DROP_SHAPES = [
  '47% 53% 42% 58% / 55% 44% 56% 45%',
  '58% 42% 55% 45% / 42% 57% 43% 58%',
  '43% 57% 60% 40% / 58% 42% 58% 42%',
  '55% 45% 41% 59% / 45% 56% 44% 55%',
] as const;
