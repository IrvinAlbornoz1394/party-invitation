import clsx from 'clsx';
import { BlockImage } from '../../shared/BlockImage';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { ClosingMessage, type ClosingVariantProps } from './closing-parts';

/**
 * `closing.album` — la despedida como la última página del álbum: la foto montada con
 * esquineras y la frase escrita debajo.
 *
 * Los otros cuatro cierres tratan la fotografía como **fondo o como columna**: `horizon` la pone
 * a pantalla completa y escribe encima, `split` la coloca al lado del texto, `letter` y
 * `envelope` no la usan de fondo en absoluto. Este la trata como un **objeto pegado**: una copia
 * en papel, montada sobre la hoja con cuatro esquineras y ligeramente torcida, con la despedida
 * escrita al pie como se escribe al pie de una foto de álbum.
 *
 * Es el cierre de la estructura que narra. `storytelling` pone la historia y las fotos antes que
 * los datos y termina con la galería de instantáneas y la postal de confirmación; cerrar eso con
 * una franja a pantalla completa —que es lo que hace `horizon`— cambia de registro justo en la
 * última pantalla. La página final de un álbum, no.
 *
 * ## Por qué está torcida, y por qué poco
 *
 * Grado y medio. Una foto pegada a mano nunca queda a escuadra, y esa desviación es lo único que
 * separa «una fotografía dentro de un recuadro» de «una fotografía pegada en una hoja». Pasados
 * los tres grados deja de leerse como un descuido y empieza a leerse como un efecto, y además
 * obliga a reservar aire a los lados para que las esquinas no toquen el borde del contenedor.
 *
 * La inclinación va en el **montaje** y no en la fotografía: girar solo la foto dentro de un
 * marco recto deja cuñas de papel en las esquinas y se ve como un error de recorte.
 *
 * ## Las esquineras son cuatro triángulos y no un marco
 *
 * Porque una esquinera **sujeta**: es un trozo de papel doblado en diagonal por el que entra la
 * punta de la copia. Un marco por los cuatro lados sería una moldura, que es lo que ya hace
 * `hero.framed`. Se dibujan con `currentColor` —como el resto de los ornamentos de la
 * biblioteca— y por eso salen del color del tema sin una copia por paleta.
 *
 * ## Sin fotografía no hay montaje
 *
 * `image` es opcional en el contenido del cierre, y aquí eso significa que el bloque se queda en
 * la despedida sola. Es deliberado: cuatro esquineras sujetando papel en blanco no se leen como
 * una página de álbum sino como una imagen que no cargó. Es la misma decisión que en
 * `closing.envelope`, donde la tarjeta vacía se rellena antes que dejarse en blanco.
 */
export function ClosingAlbum({ content }: ClosingVariantProps) {
  return (
    <BlockSection block="closing" variant="album">
      <BlockContainer className="max-w-2xl">
        <div className="flex flex-col items-center">
          {content.image && (
            /*
              El montaje: la hoja de papel sobre la que va pegada la copia. `mx-auto` con un ancho
              acotado y no el ancho entero del contenedor — una copia pegada ocupa menos que la
              página, y ese margen es lo que la hace parecer un objeto encima y no un bloque más.
            */
            <figure className="relative m-0 w-full max-w-md -rotate-[1.5deg] rounded-inv-sm bg-inv-surface p-3 shadow-inv-soft sm:p-4">
              <div className="relative isolate aspect-[4/3] w-full overflow-hidden">
                <BlockImage image={content.image} sizes="(min-width: 640px) 28rem, 100vw" />

                {/*
                  Las cuatro esquineras, ya dentro de la caja de la fotografía: pegadas al canto de
                  la copia y no al del montaje. Es el mismo triángulo cuatro veces, girado — igual
                  que el canto rasgado de `paper-ornaments`, y por la misma razón: un segundo trazo
                  para lo que es la misma pieza reflejada se acaba corrigiendo solo en una de las
                  copias.
                */}
                <PhotoCorner className="absolute top-0 left-0 size-7 sm:size-9" />
                <PhotoCorner className="absolute top-0 right-0 size-7 rotate-90 sm:size-9" />
                <PhotoCorner className="absolute right-0 bottom-0 size-7 rotate-180 sm:size-9" />
                <PhotoCorner className="absolute bottom-0 left-0 size-7 -rotate-90 sm:size-9" />
              </div>
            </figure>
          )}

          {/*
            La despedida al pie de la foto. Va derecha aunque el montaje esté torcido: el pie de
            una foto de álbum se escribe sobre el renglón de la hoja, no siguiendo la inclinación
            de la copia, y torcerlo también convertiría el gesto en un filtro.
          */}
          <ClosingMessage content={content} className={clsx(content.image && 'mt-14')} />
        </div>
      </BlockContainer>
    </BlockSection>
  );
}

/**
 * Una esquinera: el triángulo de papel por el que entra la punta de la copia.
 *
 * Se pinta con el color principal a media opacidad y no con el filete del tema. La esquinera de
 * un álbum es cartulina —un tono, no una línea— y con `line`, que está calculado para separar
 * campos sobre papel, las cuatro desaparecían encima de una fotografía clara.
 */
function PhotoCorner({ className }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className={clsx('pointer-events-none text-inv-primary opacity-75', className)}
    >
      <path d="M0 0h40L0 40Z" fill="currentColor" />
    </svg>
  );
}
