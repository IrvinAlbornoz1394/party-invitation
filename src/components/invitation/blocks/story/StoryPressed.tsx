import { visibleHighlight } from '@/domain/invitation/blocks/story';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockImage } from '../../shared/BlockImage';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { LeafSprig } from '../../shared/paper-ornaments';
import { StoryHighlight, StorySignature } from './story-parts';
import type { StoryVariantProps } from './story-variant';

/**
 * `story.pressed` — la crónica en un pliego: los párrafos numerados al margen y la fotografía
 * prensada al final, como el recuerdo que se guarda entre las páginas.
 *
 * Es la quinta variante del bloque y existe porque `botanical` no tenía historia: al añadírsela no
 * quedaba ninguna libre —las cuatro estaban repartidas una por plantilla— y la regla del catálogo
 * (`assertTemplateVariantsAreExclusive()`, en `scripts/seed.ts`) prohíbe compartirlas entre
 * plantillas del mismo tipo de evento.
 *
 * ## Por qué se rehízo la primera versión
 *
 * La primera flotaba la fotografía al 44 % y dejaba el texto envolviéndola. Sobre el papel sonaba
 * a página impresa; en una pantalla de escritorio se leía como **dos columnas**, o sea como
 * `story.image-right`, que es justamente la historia de `editorial`. Un `float` de casi media caja
 * no se distingue de una retícula de dos: lo que iba a ser un recurso de imprenta acabó siendo la
 * variante de otra plantilla con otro filete.
 *
 * Lo que la separa ahora no es dónde va la foto, son **dos decisiones que ninguna otra toma**:
 *
 *   1. **El cuerpo va numerado, con la cifra al margen.** Las otras cuatro pintan párrafos
 *      corridos. Aquí cada uno lleva su romano en una calle propia a la izquierda, y eso convierte
 *      la historia en una crónica por capítulos en vez de un texto seguido. Es además el gesto de
 *      `schedule.itinerary` —la única que saca los iconos del hilo y los pone al margen—, que es
 *      el cronograma de esta misma plantilla: la coherencia es interna, no prestada.
 *   2. **La fotografía va al final, pequeña y montada.** Las otras cuatro abren con ella o la
 *      usan de fondo. Aquí se lee primero y se mira después: el retrato es el recuerdo prensado que
 *      remata el pliego, no la ilustración que lo encabeza.
 *
 * Y todo dentro de un **pliego con doble filete**, que es el marco de una lámina grabada y no
 * existía en ningún bloque del catálogo.
 *
 *   `image-left` / `image-right`  dos columnas al 50 %.
 *   `centered`                    columna centrada, foto de banda arriba.
 *   `overlay`                     el texto sobre la fotografía.
 *   `pressed`                     **pliego enmarcado, crónica numerada, lámina al cierre.**
 *
 * ## El cuerpo no usa `StoryProse`, y es la única que no
 *
 * `story-parts.tsx` dice que lo compartido es «cómo se compone cada pieza por dentro» y que lo que
 * cambia entre variantes es dónde va. Aquí cambia justo lo otro: el cuerpo **es** la diferencia, y
 * numerarlo obliga a envolver cada párrafo con su cifra. Se salta el ayudante a propósito y se
 * conservan su medida y su interlineado, que son la parte que de verdad no debe divergir.
 *
 * ## Sin canto rasgado
 *
 * Podría ir en una hoja de otro tono con `TornEdge` arriba y abajo, como el calendario y la
 * confirmación. No va: en esta plantilla la rasgadura ya aparece en la bienvenida, el calendario,
 * la confirmación y el pie. Un quinto canto roto deja de ser una firma y pasa a ser el único
 * recurso que la plantilla conoce. Aquí lo que texturiza es el filete.
 */
export function StoryPressed({ content }: StoryVariantProps) {
  const highlight = visibleHighlight(content);

  return (
    <BlockSection block="story" variant="pressed">
      <BlockContainer className="max-w-3xl">
        {/*
          El pliego: doble filete, uno dentro del otro. Es el marco de una lámina grabada —el de
          una participación impresa o el de un menú—, y hacen falta los dos: con uno solo esto es
          una tarjeta, que es lo que ya son `story.overlay` y media docena de bloques del catálogo.
          El segundo, más tenue y separado por un pelo de papel, es lo que lo convierte en imprenta.
        */}
        <div className="border border-inv-line bg-inv-surface p-1.5 shadow-inv-soft">
          <div className="border border-inv-line/60 px-6 py-12 sm:px-12 sm:py-16">
            <BlockHeading
              eyebrow={content.eyebrow}
              title={content.title}
              subtitle={content.subtitle}
              align="center"
              titleCase="caps"
            />

            {/* El filete de cabecera, corto y centrado: cierra el encabezado y abre la crónica.
                A todo el ancho competiría con el marco que ya encierra el pliego. */}
            <span aria-hidden="true" className="mx-auto mt-8 block h-px w-16 bg-inv-line" />

            {/*
              La crónica. Cada párrafo con su romano en una calle de ancho fijo a la izquierda,
              que es lo que mantiene alineada la columna de texto aunque el número pase de «I» a
              «III». La cifra va en `accent` y en versalitas: es un folio, no un dato que se lea.
            */}
            <div className="mx-auto mt-10 max-w-[58ch] space-y-7">
              {content.body.map((paragraph, index) => (
                // El índice como clave es correcto aquí: los párrafos no se reordenan ni se
                // insertan en caliente, se renderizan una vez desde contenido guardado.
                <div key={index} className="flex gap-4 sm:gap-6">
                  <span
                    aria-hidden="true"
                    className="mt-[0.35em] w-6 shrink-0 font-inv-display text-[10.5px] tracking-[0.18em] text-inv-accent tabular-nums sm:text-[11.5px]"
                  >
                    {NUMERALS[index] ?? ''}
                  </span>
                  {/* La misma medida y el mismo interlineado que `StoryProse`: lo que cambia es la
                      numeración, no cómo se lee un párrafo. */}
                  <p className="m-0 text-[15.5px] leading-[1.75] text-inv-ink">{paragraph}</p>
                </div>
              ))}
            </div>

            {content.image && (
              /*
                La lámina del cierre. Pequeña y centrada —`max-w-[15rem]`— porque no ilustra la
                historia: la remata. A ancho completo volvería a ser la foto de banda de
                `story.centered`, y a media caja, la columna de las partidas.
              */
              <figure className="mx-auto mt-12 m-0 w-full max-w-[15rem]">
                <div className="border border-inv-line p-1.5">
                  <div className="relative isolate aspect-[4/5] w-full overflow-hidden">
                    <BlockImage image={content.image} sizes="(min-width: 640px) 15rem, 60vw" />
                  </div>
                </div>
                {/* La ramita, cruzada bajo la lámina: el ornamento de esta plantilla —el mismo de
                    `hero.framed` y del pie— y lo que hace que el retrato se lea como algo prensado
                    entre las hojas y no como una foto pegada. */}
                <LeafSprig className="mx-auto mt-4 h-6 w-24 text-inv-accent opacity-70" />
              </figure>
            )}

            {highlight && <StoryHighlight highlight={highlight} align="center" className="mt-12" />}

            {content.signature && (
              <StorySignature signature={content.signature} className="mt-9 text-center" />
            )}
          </div>
        </div>
      </BlockContainer>
    </BlockSection>
  );
}

/**
 * Los folios de la crónica.
 *
 * Seis y no más porque `storyContentSchema` no admite más de seis párrafos, así que la lista cubre
 * el contrato entero. Escritos y no calculados: una función que convierta un entero a numeración
 * romana es código que hay que probar para pintar como mucho seis rótulos conocidos.
 */
const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const;
