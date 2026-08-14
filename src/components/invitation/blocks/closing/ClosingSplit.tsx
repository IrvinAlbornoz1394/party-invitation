import { BlockImage } from '../../shared/BlockImage';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { IconBadge } from '../../shared/IconBadge';
import { ClosingMessage, type ClosingVariantProps } from './closing-parts';

/**
 * `closing.split` — la despedida a dos columnas: la foto a un lado y la frase al otro.
 *
 * Es la más tranquila de las tres y la que mejor cierra una invitación que ya venía cargada de
 * secciones: no ocupa la pantalla entera ni pide nada, solo pone una imagen y una frase juntas.
 * Conviene cuando el bloque anterior es la galería o la ubicación, donde ya hubo mucho que
 * mirar.
 *
 * El texto va alineado a la izquierda y no centrado, al revés que en las otras dos. Es lo que
 * corresponde a una columna estrecha con una foto al lado: centrado, el ojo salta entre el borde
 * de la imagen y el del texto en cada renglón.
 *
 * ## Sin fotografía
 *
 * Queda el medallón del icono sobre el papel del tema y el mensaje debajo, centrado en la
 * sección. No es la misma composición encogida: es una despedida sobria, que es exactamente lo
 * que hace falta cuando no hay una foto que merezca media pantalla.
 */
export function ClosingSplit({ content }: ClosingVariantProps) {
  return (
    <BlockSection block="closing" variant="split">
      <BlockContainer>
        {content.image ? (
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <figure className="relative isolate m-0 aspect-[4/5] w-full overflow-hidden rounded-inv-lg shadow-inv-soft">
              <BlockImage image={content.image} sizes="(min-width: 768px) 50vw, 100vw" />
            </figure>

            <ClosingMessage content={content} align="left" />
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <IconBadge icon={content.icon} size="lg" className="mb-8" />
            <ClosingMessage content={content} />
          </div>
        )}
      </BlockContainer>
    </BlockSection>
  );
}
