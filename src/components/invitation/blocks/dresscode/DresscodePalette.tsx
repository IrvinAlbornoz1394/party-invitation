import type { CSSProperties } from 'react';
import clsx from 'clsx';
import type { DresscodeSwatch } from '@/domain/invitation/blocks/dresscode';
import { ActionLink } from '../../shared/ActionLink';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { LeafSprig } from '../../shared/paper-ornaments';
import type { DresscodeVariantProps } from './dresscode-variant';

/**
 * `dresscode.palette` — la instrucción escrita y la paleta en una fila de muestras.
 *
 * Es la sección que responde a lo único que un invitado se pregunta delante del armario. Y lo
 * hace **enseñando** los colores, que es la parte que un texto no consigue: «tonos tierra y
 * verdes suaves» significa algo distinto para cada persona, y cinco círculos no dejan lugar a
 * interpretación.
 *
 * El orden importa: primero la regla en palabras —«etiqueta», «evita el blanco»— y después la
 * paleta. Al revés, la fila de colores se lee como decoración y el texto de debajo, como un pie
 * de foto que nadie termina.
 *
 * ## Las muestras son un `<ul>`, y a veces decorativo
 *
 * Depende de si los colores tienen nombre, y es la única condición del componente:
 *
 *   · **Con nombre** —«Verde oliva», «Arena»—, la lista es información: cada muestra anuncia su
 *     nombre, así que la sección funciona igual para quien no ve la pantalla, para quien no
 *     distingue esos dos verdes y para quien la abre con el brillo al mínimo bajo el sol.
 *   · **Sin nombre**, la fila entera va marcada como decorativa. Es lo honesto: un lector de
 *     pantalla no puede decir «#7d8b6a» de forma útil, y anunciar «lista de cinco elementos»
 *     vacíos solo añade ruido entre el texto y lo que viene después. El contenido sigue estando
 *     en la descripción, que es donde el evento lo escribió.
 *
 * De ahí que `label` esté en el contrato aunque casi ninguna papelería nombre sus colores: es la
 * diferencia entre una sección que informa a todo el mundo y una que informa a quien puede verla.
 *
 * ## El acabado metálico
 *
 * Un dorado, un cobre o un champán pintados como un color plano se leen como beige, y el invitado
 * que va a comprar una corbata se equivoca de tienda. `finish: 'metallic'` añade dos degradados
 * cruzados sobre el mismo color —uno de luz y otro de sombra— que es la forma más simple de que
 * una superficie parezca metal en pantalla sin una textura que haya que descargar.
 */
export function DresscodePalette({ content }: DresscodeVariantProps) {
  /* Basta con que UNA muestra tenga nombre para que la fila deje de ser decorativa: media paleta
     anunciada es más útil que ninguna, y quien nombró solo el color difícil sabía lo que hacía. */
  const named = content.palette.some((swatch) => swatch.label !== null);

  return (
    <BlockSection block="dresscode" variant="palette">
      <BlockContainer className="max-w-xl">
        <div className="flex flex-col items-center text-center">
          <BlockHeading
            eyebrow={content.eyebrow}
            title={content.title}
            align="center"
            titleCase="caps"
          />

          <LeafSprig className="mt-6 h-7 w-40 text-inv-accent opacity-80" />

          {content.description && (
            <p className="mt-7 mb-0 max-w-md text-[15px] leading-relaxed text-inv-ink-soft">
              {content.description}
            </p>
          )}

          <ul
            aria-hidden={named ? undefined : 'true'}
            className="mt-10 flex list-none flex-wrap items-start justify-center gap-x-4 gap-y-6 p-0 sm:gap-x-6"
          >
            {content.palette.map((swatch, index) => (
              // El índice como clave es correcto aquí: la paleta no se reordena ni se inserta en
              // caliente, se renderiza una vez desde contenido guardado. Y no sirve el color: dos
              // muestras del mismo tono con acabados distintos son legítimas.
              <li key={index} className="flex w-16 flex-col items-center gap-2.5 sm:w-20">
                <Swatch swatch={swatch} />

                {swatch.label && (
                  <span className="text-[9.5px] leading-snug tracking-[0.16em] text-inv-ink-soft uppercase">
                    {swatch.label}
                  </span>
                )}
              </li>
            ))}
          </ul>

          {content.action && (
            <ActionLink
              label={content.action.label}
              href={content.action.href}
              tone="onSurface"
              className="mt-10"
            />
          )}

          {content.note && <BlockNote note={content.note} className="mt-8 max-w-sm" />}
        </div>
      </BlockContainer>
    </BlockSection>
  );
}

/**
 * Una muestra de color.
 *
 * El color va en el atributo `style` y no en una clase, y no hay alternativa: es un dato del
 * evento, así que Tailwind no puede generar una utilidad para un valor que no existe hasta que
 * alguien lo escribe en el panel. Lo que sí hay es una garantía de que ese valor es un
 * hexadecimal y nada más — la pone el esquema, en `domain/invitation/blocks/dresscode.ts`, y por
 * eso aquí no hay que sanear nada.
 *
 * El filete exterior no es decorativo: un marfil sobre papel marfil —que aparece en la mitad de
 * las paletas de boda— sin borde es un círculo invisible, y con él sigue siendo una muestra. Va en
 * `line`, el color de filete del tema, para que no destaque más que el color que enmarca.
 */
function Swatch({ swatch }: { readonly swatch: DresscodeSwatch }) {
  return (
    <span
      className={clsx(
        'relative block size-14 shrink-0 overflow-hidden rounded-full ring-1 ring-inv-line sm:size-16',
        /* Solo el metálico lleva sombra propia: es lo que le da volumen y lo que lo separa de un
           plano del mismo tono. Un plano con sombra se vería como un botón. */
        swatch.finish === 'metallic' && 'shadow-inv-soft',
      )}
      style={{ backgroundColor: swatch.color } as CSSProperties}
    >
      {swatch.finish === 'metallic' && (
        /*
          Dos degradados cruzados sobre el color: uno de luz de arriba a la izquierda y otro de
          sombra abajo a la derecha. Es la lectura mínima de «metal» y funciona con cualquier tono
          —un dorado, un cobre, un plateado— porque no añade color, solo claro y oscuro sobre el
          que ya hay. Van en blanco y negro translúcidos a propósito: un degradado con un color
          escrito a mano solo funcionaría con los dorados.
        */
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={{
            backgroundImage:
              'linear-gradient(135deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.08) 42%, rgba(0,0,0,0.06) 58%, rgba(0,0,0,0.24) 100%)',
          }}
        />
      )}
    </span>
  );
}
