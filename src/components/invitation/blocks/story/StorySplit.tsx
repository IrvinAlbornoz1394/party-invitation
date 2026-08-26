import clsx from 'clsx';
import { BlockImage } from '../../shared/BlockImage';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { BlockHeading } from '../../shared/BlockHeading';
import { StoryHighlight, StoryProse, StorySignature } from './story-parts';
import { visibleHighlight } from '@/domain/invitation/blocks/story';
import type { StoryVariantProps } from './story-variant';

/**
 * `story.image-left` y `story.image-right` — la historia a dos columnas.
 *
 * Son dos entradas del registro y un solo componente, y conviene entender por qué las dos
 * cosas a la vez. **Dos entradas** porque el lado de la foto es una elección que se guarda en
 * el evento y que el admin cambia sin tocar nada más; el contrato de una variante es recibir
 * solo `content`, así que «la misma con la imagen al otro lado» no cabe como propiedad. **Un
 * solo componente** porque todo lo demás es idéntico, y mantener dos copias en espejo termina
 * como terminan siempre: con una que corrigió el interlineado y otra que no.
 *
 * ## Por qué alternarlas tiene sentido
 *
 * En una invitación con historia y galería seguidas, dos bloques con la foto del mismo lado
 * se leen como una plantilla repetida. Alternar el lado es el recurso más barato para que la
 * página respire, y es exactamente el tipo de decisión que debe poder tomarse desde el panel y
 * no desde el código.
 *
 * En móvil no hay lados: la foto va siempre arriba. Es lo que el orden del DOM ya dice, así
 * que el cambio de lado se hace con `order` solo a partir de tablet — y con eso el orden de
 * lectura para un lector de pantalla es el mismo en las dos variantes.
 */
function StorySplit({ content, side }: StoryVariantProps & { readonly side: 'left' | 'right' }) {
  const highlight = visibleHighlight(content);

  return (
    <BlockSection block="story" variant={`image-${side}`}>
      <BlockContainer>
        <div className={clsx('grid items-center gap-10 lg:gap-16', content.image && 'md:grid-cols-2')}>
          {content.image && (
            <figure
              className={clsx(
                'relative isolate m-0 aspect-[4/5] w-full overflow-hidden rounded-inv-lg shadow-inv-soft',
                side === 'right' && 'md:order-2',
              )}
            >
              <BlockImage image={content.image} sizes="(min-width: 768px) 50vw, 100vw" />
            </figure>
          )}

          {/* Sin foto, el texto se queda solo en un contenedor de mil píxeles y las líneas
              llegan a los cien caracteres. La medida se acota aquí, no en el contenedor, porque
              con foto la columna ya está acotada por la retícula. */}
          {/*
            Márgenes explícitos y no `space-y`, que es lo que tenía y lo que apretaba el remate.
            Un `space-y` reparte **el mismo** hueco entre piezas de peso muy distinto: el que va
            bien entre el encabezado y el cuerpo deja la cita, la firma y lo que venga detrás
            pegados en un bloque, y en un móvil eso se lee como un párrafo con tres tipografías.
            Aquí el aire crece hacia abajo, que es donde la sección remata.
          */}
          <div className={!content.image ? 'mx-auto max-w-2xl' : undefined}>
            <BlockHeading eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
            <StoryProse body={content.body} className="mt-7" />
            {/* La cita y la firma comparten la sangría del filete de la cita. Sin ella la firma
                arrancaba en el margen, justo encima del filete, y las dos piezas se leían
                descuadradas — se ve en cualquier móvil. */}
            {highlight && <StoryHighlight highlight={highlight} className="mt-9" />}
            {content.signature && (
              <StorySignature signature={content.signature} className={highlight ? 'mt-8 pl-5' : 'mt-8'} />
            )}
          </div>
        </div>
      </BlockContainer>
    </BlockSection>
  );
}

export function StoryImageLeft({ content }: StoryVariantProps) {
  return <StorySplit content={content} side="left" />;
}

export function StoryImageRight({ content }: StoryVariantProps) {
  return <StorySplit content={content} side="right" />;
}
