import { visibleHighlight } from '@/domain/invitation/blocks/story';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockImage } from '../../shared/BlockImage';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { StoryHighlight, StoryProse, StorySignature } from './story-parts';
import type { StoryVariantProps } from './story-variant';

/**
 * `story.mounted` — la instantánea montada y torcida, encabalgada sobre la hoja del relato.
 *
 * Es la sexta historia del catálogo y lo que la separa de las otras cinco es **el plano**, no el
 * lado. Las dos partidas ponen la foto en una columna, `centered` la pone de banda, `overlay` la
 * usa de fondo y `pressed` la mete dentro del pliego: en las cinco, foto y texto viven en la
 * misma capa. Aquí la fotografía es un objeto **encima** del papel —con su margen blanco, su
 * sombra y unos grados de giro— y pisa el canto de la hoja donde está escrito el relato.
 *
 * Es el gesto de un álbum: la copia pegada sobre la página, no la ilustración maquetada junto al
 * texto. Y es lo que la referencia de `silk` hace en su sección de historia, donde las copias van
 * torcidas y con sombra sobre el papel crema.
 *
 * ## El giro va en la foto y no en la hoja
 *
 * Torcer la hoja arrastraría el texto: un párrafo en diagonal no se lee, y en un teléfono la caja
 * girada abre franjas de fondo en las esquinas. Girada la copia sola, el papel sigue a escuadra
 * —que es lo que lo hace papel— y el desorden queda donde puede estar.
 *
 * El ángulo va escrito como una clase completa (`-rotate-3`) y no compuesto al vuelo, por lo
 * mismo que en `gallery.polaroid`: Tailwind genera el CSS leyendo el código fuente, y una clase
 * armada con una plantilla no existe en ningún sitio que él pueda leer.
 *
 * ## El encabalgamiento se hace con márgenes negativos
 *
 * Y no colocando la copia en absoluto sobre la hoja. Con `absolute` habría que reservarle sitio a
 * mano —un relleno superior en el móvil, uno lateral en escritorio— y cualquier cambio de tamaño
 * de la foto dejaría el texto debajo o un hueco encima. Con márgenes negativos la copia sigue
 * ocupando su lugar en el flujo y es ella la que se muerde el canto de la hoja: la maqueta se
 * recompone sola cuando cambia la proporción de la imagen o el ancho de la pantalla.
 *
 * ## Sin fotografía sigue siendo una historia, no un hueco
 *
 * Cae la copia y la hoja se queda sola, centrada y con su medida de lectura. No se sustituye por
 * un marco vacío ni por un ornamento: en esta variante la fotografía es el objeto encimado, y sin
 * objeto lo que queda es la página, que es exactamente lo que tiene que quedar.
 */
export function StoryMounted({ content }: StoryVariantProps) {
  const highlight = visibleHighlight(content);

  return (
    <BlockSection block="story" variant="mounted">
      <BlockContainer className="max-w-4xl">
        <div className="flex flex-col items-center md:flex-row md:items-start">
          {content.image && (
            /*
              La copia montada: el margen blanco es el relleno del `figure` —desigual, más ancho
              abajo, como el papel de una instantánea— y el fondo es `surface`, no un blanco fijo:
              en un tema oscuro el margen tiene que ser del color del papel del tema o la copia se
              lee como un recorte pegado de otra invitación.
            */
            <figure className="relative z-10 m-0 -mb-12 w-[min(16rem,74%)] -rotate-3 bg-inv-surface p-3 pb-12 shadow-inv-soft md:mt-14 md:-mr-20 md:mb-0 md:w-[18rem] md:shrink-0">
              <div className="relative isolate aspect-[4/5] w-full overflow-hidden">
                <BlockImage image={content.image} sizes="(min-width: 768px) 18rem, 70vw" />
              </div>
            </figure>
          )}

          {/*
            La hoja. El relleno de la izquierda crece en escritorio para dejar pasar la copia por
            debajo, y arriba en el móvil por lo mismo: es el sitio que ocupa el trozo de foto que
            se le encabalga. Sin ese aire, la copia taparía la primera línea del rótulo.
          */}
          <div className="w-full rounded-inv-md border border-inv-line bg-inv-surface px-6 pt-20 pb-12 sm:px-10 md:pt-14 md:pb-14 md:pl-28">
            <BlockHeading
              eyebrow={content.eyebrow}
              title={content.title}
              subtitle={content.subtitle}
            />

            <StoryProse body={content.body} className="mt-8 max-w-[54ch]" />

            {highlight && <StoryHighlight highlight={highlight} className="mt-10" />}

            {content.signature && <StorySignature signature={content.signature} className="mt-9" />}
          </div>
        </div>
      </BlockContainer>
    </BlockSection>
  );
}
