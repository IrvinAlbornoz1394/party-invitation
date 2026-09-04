import { BlockHeading } from '../../shared/BlockHeading';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { blockIconComponent } from '../../shared/block-icons';
import { RsvpAction, RsvpDeadline, type RsvpVariantProps } from './rsvp-parts';

/**
 * `rsvp.raised` — la tarjeta de confirmación encimada, mitad sobre el papel y mitad sobre la
 * banda del final de la sección.
 *
 * Es la séptima forma de la confirmación y la única que compone **dos planos**. Las seis
 * anteriores viven en uno solo: `card` es una tarjeta apoyada en el papel, `panel` una franja de
 * color con el texto encima, y las cuatro de papelería —`ticket`, `reply-card`, `postcard`,
 * `torn`— son piezas impresas sobre la hoja. Aquí la sección se parte por la mitad y la tarjeta
 * cae justo en la costura: arriba el papel del tema, abajo la banda, y la pieza de la
 * confirmación pisando las dos.
 *
 * Es la composición de la referencia de `silk` y también la de su portada (`hero.card`): una
 * pieza de papel flotando sobre algo más denso. Que la primera pantalla y la penúltima rimen no
 * es repetición — es lo que hace que la invitación se lea como una sola papelería.
 *
 * ## La banda es la fotografía cuando la hay, y color plano cuando no
 *
 * `rsvpContentSchema` trae una imagen opcional y las seis variantes anteriores la resuelven de
 * otra manera: `card` la mete dentro de la propia tarjeta, como cabecera. Aquí no cabe —la
 * tarjeta tiene que ser la pieza ligera de la composición— así que la fotografía se va **detrás**
 * y hace de banda. Sin ella, la banda es el color principal del tema, y la sección se sostiene
 * igual: lo que define la variante es el encabalgamiento, no la foto.
 *
 * Esto importa porque los eventos se arman antes de tener el material. Una variante que solo
 * funcione con fotografía se ve mal durante las tres semanas en las que se está configurando —es
 * la regla del catálogo, y aquí se cumple sin duplicar la variante.
 *
 * ## Por qué no pide el nombre ni cuántos van, aunque la referencia sí
 *
 * En la imagen de la que sale, esta sección es un formulario: nombre, «¿vendrá?» con dos
 * opciones y un contador de acompañantes. No se reproduce, y no es una carencia: quién eres y
 * cuántos lugares te tocan **no son contenido del bloque**. Ese dato llega con el enlace de cada
 * familia y vive en la lista de invitados del panel (`guest_groups`, `guests`), como está escrito
 * en `docs/COMPONENTES.md`. Un formulario aquí guardaría un texto libre que nadie cruza con nada.
 *
 * El botón hace lo que el bloque sabe hacer hoy: abrir el chat del organizador con el mensaje
 * escrito, o registrar la confirmación contra la plataforma. Los dos caminos son `destination`, y
 * los resuelve `RsvpAction` igual que en las otras seis.
 */
export function RsvpRaised({ content }: RsvpVariantProps) {
  /* El corazón viene del vocabulario común de la invitación y no de un `import` suelto de la
     librería de iconos: `shared/block-icons.ts` es la única frontera con lucide. */
  const HeartMark = blockIconComponent('heart');

  return (
    <BlockSection block="rsvp" variant="raised" className="relative isolate overflow-hidden">
      {/*
        La banda del fondo: la mitad de abajo de la sección. Va en porcentaje del alto y no con una
        medida fija porque la sección crece con el contenido —una confirmación con subtítulo, plazo
        y nota es bastante más alta que una con solo el botón— y con un alto fijo la costura
        quedaría unas veces detrás de la tarjeta y otras muy por debajo de ella.
      */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-1/2">
        {content.image ? (
          <>
            <BlockImage image={content.image} sizes="100vw" />
            {/* El velo, para que el canto de la tarjeta se recorte contra la fotografía sea cual
                sea la foto. Sin él, una imagen clara deja la pieza flotando sobre nada. */}
            <div className="absolute inset-0 inv-scrim" data-from="all" />
          </>
        ) : (
          <div className="h-full w-full bg-inv-primary" />
        )}
      </div>

      <BlockContainer className="relative z-10 max-w-xl">
        <article className="flex flex-col items-center rounded-inv-lg border border-inv-line bg-inv-surface px-6 py-12 text-center shadow-inv-soft sm:px-12 sm:py-14">
          <BlockHeading
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.subtitle}
            align="center"
          />

          {content.deadlineLabel && (
            <RsvpDeadline deadlineLabel={content.deadlineLabel} className="mt-8" />
          )}

          <RsvpAction content={content} align="center" className="mt-9" />

          {/* El corazón cierra la tarjeta, como en la referencia. Es la firma de la variante y no
              un dato del evento —no se configura, no cambia—, igual que la rasgadura de
              `rsvp.torn`. */}
          <HeartMark
            size={17}
            strokeWidth={1.5}
            aria-hidden="true"
            className="mt-10 text-inv-accent"
          />

          {content.note && <BlockNote note={content.note} className="mt-6 max-w-sm" />}
        </article>
      </BlockContainer>
    </BlockSection>
  );
}
