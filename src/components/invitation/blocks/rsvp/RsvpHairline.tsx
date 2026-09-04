import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { RsvpAction, type RsvpVariantProps } from './rsvp-parts';

/**
 * `rsvp.hairline` — la confirmación al aire: un filete corto, el rótulo en caligrafía, dos líneas
 * y el botón. Sin tarjeta, sin franja y sin plazo enmarcado.
 *
 * Es la octava forma y la más desnuda de todas. Las otras siete ponen algo alrededor —tarjeta,
 * franja de color, pase troquelado, tarjeta de respuesta, postal, papel rasgado, tarjeta
 * encimada— porque la confirmación es la petición de la invitación y la costumbre es destacarla
 * con una pieza. Esta la destaca al revés: es la única sección de la estructura que lleva un
 * botón, y en una invitación donde no hay ni una caja, un botón negro sobre papel blanco es lo
 * más pesado de la página sin necesidad de nada más.
 *
 * ## El plazo no va en su cápsula
 *
 * `RsvpDeadline` compone el «Antes del 12 de mayo» dentro de un recuadro con filete, y las siete
 * anteriores lo usan. Aquí no: ese recuadro es una caja, y sería la única. El plazo se pinta como
 * un renglón en versalitas encima del botón, donde se lee igual de bien y no dibuja nada. Es el
 * mismo criterio por el que esta estructura no usa `IconBadge` en los detalles.
 *
 * No es una excepción cómoda: la pieza compartida se salta **solo** cuando lo que aporta es una
 * caja, y lo que de verdad no puede divergir —los dos caminos del botón, sus cuatro estados, el
 * acuse para lector de pantalla— sigue viniendo entero de `RsvpAction`.
 *
 * ## El filete de arriba
 *
 * Corto y centrado, lo único dibujado de la sección. Marca que aquí empieza otra cosa después de
 * un tramo largo de texto gris, que es el trabajo que en el resto del catálogo hace el cambio de
 * fondo. La imagen del contenido no se pinta: en esta estructura las fotografías son de la
 * portada y de la galería, y una foto detrás del botón le quitaría el contraste que lo hace
 * visible.
 */
export function RsvpHairline({ content }: RsvpVariantProps) {
  return (
    <BlockSection block="rsvp" variant="hairline">
      <BlockContainer className="flex max-w-md flex-col items-center text-center">
        <span aria-hidden="true" className="block h-px w-14 bg-inv-line" />

        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleFont="script"
          className="mt-10"
        />

        {content.deadlineLabel && (
          <p className="mt-8 mb-0 text-[10.5px] tracking-[0.26em] text-inv-ink-soft uppercase">
            {content.deadlineLabel}
          </p>
        )}

        <RsvpAction content={content} align="center" className="mt-8" />

        {content.note && <BlockNote note={content.note} className="mt-8 max-w-sm" />}
      </BlockContainer>
    </BlockSection>
  );
}
