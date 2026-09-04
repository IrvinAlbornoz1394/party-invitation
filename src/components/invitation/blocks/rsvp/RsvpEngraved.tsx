import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { blockIconComponent } from '../../shared/block-icons';
import { RsvpAction, type RsvpVariantProps } from './rsvp-parts';

/**
 * `rsvp.engraved` — la confirmación grabada: un doble filete alrededor, el dibujo arriba, el
 * plazo en versalitas y el botón dentro. Sin fondo propio.
 *
 * Es la novena forma y la diferencia con las dos que más se le parecen está en el fondo, que es
 * lo que separa una tarjeta de un grabado:
 *
 *   `card`      una **tarjeta**: filete de línea y fondo de `surface`, un papel distinto pegado
 *               sobre el de la sección.
 *   `hairline`  **nada**: un filete corto arriba y el botón. La confirmación al aire.
 *   `engraved`  **dos filetes** encerrando la sección, sin cambiar el fondo. No hay un papel
 *               encima: es el mismo papel, con un recuadro impreso.
 *
 * Sobre un fondo oscuro esa diferencia es todo: una tarjeta clara en medio de una invitación
 * verde abre un agujero de luz, y el doble filete dorado hace el mismo trabajo —decir «esto es lo
 * importante»— sin romper el color.
 *
 * ## El segundo filete y su hueco
 *
 * Van separados por un pelo de papel (`p-1.5`), como en `story.pressed`. Con uno solo esto es una
 * caja; con dos y aire entre ellos, un cartucho grabado. Y el interior lleva mucho relleno: un
 * recuadro apretado alrededor de un botón se lee como un control de interfaz.
 *
 * ## El dibujo lo pone el contenido
 *
 * El icono viene del vocabulario común y no se elige aquí: es `guests`, la idea de «los que
 * vienen», pedido en grande y con el trazo casi al mínimo, como hacen `schedule.ribbon` y
 * `dresscode.label` para convertir un icono en una ilustración.
 */
export function RsvpEngraved({ content }: RsvpVariantProps) {
  const Guests = blockIconComponent('guests');

  return (
    <BlockSection block="rsvp" variant="engraved">
      <BlockContainer className="max-w-md">
        <div className="border border-inv-accent/50 p-1.5">
          <div className="flex flex-col items-center border border-inv-accent/30 px-6 py-12 text-center sm:px-10 sm:py-14">
            <Guests size={30} strokeWidth={0.9} aria-hidden="true" className="text-inv-accent" />

            <BlockHeading
              eyebrow={content.eyebrow}
              title={content.title}
              subtitle={content.subtitle}
              align="center"
              titleCase="caps"
              className="mt-6"
            />

            {content.deadlineLabel && (
              <p className="mt-7 mb-0 text-[11px] tracking-[0.24em] text-inv-ink-soft uppercase">
                {content.deadlineLabel}
              </p>
            )}

            <RsvpAction content={content} align="center" className="mt-8" />
          </div>
        </div>

        {content.note && <BlockNote note={content.note} className="mt-8 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
