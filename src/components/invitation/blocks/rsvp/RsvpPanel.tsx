import clsx from 'clsx';
import { BlockCurve } from '../../shared/BlockCurve';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { RsvpAction, RsvpDeadline, type RsvpVariantProps } from './rsvp-parts';

/**
 * `rsvp.panel` — la confirmación a ancho completo, sobre el color del tema.
 *
 * Es la insistente. La sección entera cambia de color y corta la invitación en dos, así que el
 * invitado no puede pasar de largo sin ver el botón — que es exactamente lo que se quiere del
 * único bloque que pide algo, y más aún cuando la fiesta depende de cuánta gente conteste.
 *
 * Conviene cuando la confirmación importa de verdad —una boda con servicio en mesa— y no cuando
 * la invitación ya tiene el panel de detalles en color: dos franjas del mismo color en la misma
 * página se anulan y ninguna de las dos destaca.
 *
 * ## Con fotografía
 *
 * La imagen pasa al fondo con el velo del tema encima. Todo el texto y el botón ya venían en
 * `onPrimary`, así que la composición no cambia: lo único que cambia es sobre qué se apoyan.
 * El velo no es negociable — encima de una foto que sube el cliente, el contraste del botón
 * tiene que estar garantizado en cualquier tema.
 */
export function RsvpPanel({ content }: RsvpVariantProps) {
  return (
    <BlockSection
      block="rsvp"
      variant="panel"
      className={clsx(
        /* El relleno lleva sumada la altura del canto del tema, o la onda se comería el rótulo. */
        'relative isolate bg-inv-primary py-[calc(6rem+var(--inv-edge-height,0px))] text-inv-on-primary sm:py-[calc(7rem+var(--inv-edge-height,0px))]',
        /*
         * `inv-on-photo` **solo cuando hay fotografía**, y es la única variante que lo condiciona.
         *
         * Esa clase reapunta la tinta a la que se lee sobre el velo (ver `globals.css`), y aquí el
         * fondo es una cosa u otra según el contenido: sin foto, la franja es el color principal y
         * el token que corresponde es `onPrimary` —que el tema garantiza legible contra él—; con
         * foto, el fondo pasa a ser el velo y `onPrimary` puede ser justo el color equivocado.
         *
         * Las demás secciones que usan la clase no tienen esa duda: o siempre hay fotografía
         * debajo, o lo que hay son las muestras de color del propio contenido.
         */
        content.image && 'inv-on-photo',
      )}
    >
      {content.image && (
        <>
          <BlockImage image={content.image} className="-z-20" sizes="100vw" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 inv-scrim" data-from="center" />
        </>
      )}

      {/* El papel mordiendo la franja por arriba y por abajo. Ver `shared/BlockCurve.tsx`. */}
      <BlockCurve edge="top" className="text-inv-bg" />
      <BlockCurve edge="bottom" className="text-inv-bg" />

      <BlockContainer>
        <div className="flex flex-col items-center text-center">
          <BlockHeading
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.subtitle}
            align="center"
            tone="inverse"
          />

          {content.deadlineLabel && (
            <RsvpDeadline deadlineLabel={content.deadlineLabel} tone="onImage" className="mt-8" />
          )}

          <RsvpAction content={content} tone="onImage" align="center" className="mt-9" />

          {content.note && (
            <BlockNote note={content.note} tone="inverse" className="mt-10 max-w-md text-center" />
          )}
        </div>
      </BlockContainer>
    </BlockSection>
  );
}
