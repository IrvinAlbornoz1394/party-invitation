import { visibleHighlight } from '@/domain/invitation/blocks/story';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { StoryHighlight, StorySignature } from './story-parts';
import type { StoryVariantProps } from './story-variant';

/**
 * `story.greeting` — la alocución: el rótulo en caligrafía, una entradilla en negrita y el cuerpo
 * centrado sobre el papel. Sin fotografía, aunque el evento la traiga.
 *
 * Es la séptima historia y la única que **renuncia a la imagen**. Las otras seis la colocan —al
 * lado, encima, de fondo, montada, dentro del pliego— y todas se recomponen si falta. Esta la
 * ignora siempre, y no por descuido:
 *
 *   · Es el saludo que abre la invitación justo después de una portada que **ya es** una
 *     fotografía a pantalla completa. Una segunda foto dos pantallas más abajo no añade nada y
 *     rompe el silencio del que vive esta estructura.
 *   · Y porque el bloque cambia de papel: aquí no cuenta una historia con imágenes, **se dirige a
 *     alguien**. «Queridos familiares y amigos» es una carta leída en voz alta, y una carta no
 *     lleva ilustración.
 *
 * Que ignore un campo del contrato es deliberado y está permitido: el contrato garantiza que toda
 * variante **reciba** lo mismo, no que lo pinte todo. `hero.card` hace lo propio con `dateLabel`
 * cuando repite lo que ya dicen las cifras. Lo que no puede pasar es lo contrario —pedir algo que
 * las demás no tienen—, y eso aquí no ocurre.
 *
 * ## La entradilla es el subtítulo, y va antes y en negrita
 *
 * En las otras seis, `subtitle` es una línea suave debajo del título. Aquí sube de rango: es el
 * «Dorogie rodnye i blizkie!» de la referencia —el vocativo con el que arranca la carta—, y va en
 * el color de la tinta y con peso, no en gris. Es el único texto con peso de toda la estructura,
 * y por eso funciona: en una invitación sin cajas ni filetes, la jerarquía la hace el contraste
 * tipográfico o no la hace nada.
 *
 * ## Por qué el título va en manuscrita
 *
 * `BlockHeading` ya sabe componerlo así (`titleFont="script"`), y es la firma de esta estructura:
 * todos sus rótulos —el saludo, el programa, la sede, la vestimenta, los detalles— van en la
 * caligrafía del tema. Es lo que sustituye a los filetes, los medallones y las franjas de color
 * que ordenan al resto del catálogo.
 */
export function StoryGreeting({ content }: StoryVariantProps) {
  const highlight = visibleHighlight(content);

  return (
    <BlockSection block="story" variant="greeting">
      <BlockContainer className="max-w-xl text-center">
        {/* Sin `subtitle`: aquí la entradilla no es una bajada del título, es la primera línea de
            la carta, y se compone abajo con su propio peso. */}
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          align="center"
          titleFont="script"
        />

        {content.subtitle && (
          <p className="mt-9 mb-0 text-[16px] leading-snug font-medium text-inv-ink">
            {content.subtitle}
          </p>
        )}

        {/*
          El cuerpo, centrado y en gris. No usa `StoryProse` —la única junto a `story.pressed` que
          no lo hace— porque aquella pieza compone una columna de lectura alineada a la izquierda,
          y aquí el texto es una alocución centrada con la medida corta. Lo que sí se conserva es
          su cuerpo y su interlineado: el párrafo de una historia se lee igual en las siete.

          El aire entre párrafos es mayor que en las otras (`space-y-5`): sin sangría ni filete,
          el blanco es lo único que separa una idea de la siguiente.
        */}
        <div className="mx-auto mt-7 max-w-[46ch] space-y-5 text-[15px] leading-[1.75] text-inv-ink-soft">
          {content.body.map((paragraph, index) => (
            // El índice como clave es correcto aquí: los párrafos no se reordenan ni se insertan
            // en caliente, se renderizan una vez desde contenido guardado.
            <p key={index} className="m-0">
              {paragraph}
            </p>
          ))}
        </div>

        {highlight && (
          <StoryHighlight highlight={highlight} align="center" className="mt-10" />
        )}

        {content.signature && (
          <StorySignature signature={content.signature} className="mt-9" />
        )}
      </BlockContainer>
    </BlockSection>
  );
}
