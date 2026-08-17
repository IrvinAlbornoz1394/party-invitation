import { BlockHeading } from '../../shared/BlockHeading';
import { blockIconComponent } from '../../shared/block-icons';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { TornEdge } from '../../shared/paper-ornaments';
import { RsvpAction, RsvpDeadline, type RsvpVariantProps } from './rsvp-parts';

/**
 * `rsvp.torn` — la petición sobre un papel de otro tono, rasgado por los dos cantos.
 *
 * Es la hermana tranquila de `rsvp.panel`. Aquella cambia el fondo de la sección al color pleno
 * del tema y corta la invitación en dos: es la insistente, la que conviene cuando de las
 * respuestas depende el servicio en mesa. Esta usa un **velo del mismo color** —una tinta del
 * primario sobre el papel— y se rompe por arriba y por abajo: se nota que es otra hoja sin que la
 * página cambie de registro.
 *
 * Conviene precisamente cuando la invitación ya lleva una franja de color —en esta plantilla, el
 * calendario— porque dos franjas plenas del mismo color en la misma página se anulan y ninguna de
 * las dos destaca. Y conviene también cuando el tono de la invitación es de papelería y una
 * llamada a la acción a todo color se leería como un banner.
 *
 * ## Por qué el velo y no un color propio
 *
 * Un tono intermedio escrito a mano —«verde salvia»— solo funcionaría en los temas verdes. El
 * velo es `primary` al 15 % sobre el papel del tema, así que sale salvia en el tema oliva, malva
 * en el ciruela y granate apagado en el nocturno, sin que este archivo sepa que existen. Y como
 * el velo mueve poco la luminancia del papel, el texto sigue siendo `ink` sobre un fondo casi
 * igual de claro: el contraste que el tema ya garantiza (ver `domain/invitation/theme.ts`) sigue
 * valiendo aquí, cosa que no pasaría con un color inventado.
 *
 * Va como **capa** encima del papel y no como fondo de la sección, y eso no es un detalle de
 * implementación: ver el comentario junto a la capa.
 *
 * ## El botón sí va a todo color
 *
 * `tone="onSurface"`, o sea el sólido de `primary`. Es lo único de la sección que grita, y es
 * intencionado: el bloque entero existe para que se pulse. En el velo claro, un botón sólido del
 * color del tema es el elemento con más contraste de la página.
 */
export function RsvpTorn({ content }: RsvpVariantProps) {
  const HeartMark = blockIconComponent('heart');

  return (
    <BlockSection
      block="rsvp"
      variant="torn"
      /*
        El relleno crece un poco sobre el ritmo del tema porque los dos cantos rasgados se comen
        unos treinta píxeles del aire de arriba y de abajo. `isolate` es lo que mantiene la
        fotografía y su velo por debajo del contenido sin que se escapen de la sección.
      */
      className="relative isolate py-[calc(var(--inv-space-block)+1.5rem)]"
    >
      {content.image && (
        <>
          <BlockImage image={content.image} className="-z-30" sizes="100vw" />
          {/* Con fotografía de fondo el velo del papel es obligatorio: encima de una foto que sube
              el cliente, el contraste del texto no se puede dar por supuesto en ningún tema. */}
          <div aria-hidden="true" className="absolute inset-0 -z-20 bg-inv-bg/85" />
        </>
      )}

      {/*
        La tinta, como una capa propia y NO como el fondo de la sección.

        Escrita en la sección (`bg-inv-primary/15`) se vería bien y estaría mal: un color
        translúcido en el fondo de la sección se compone contra lo que haya **detrás de la
        invitación** —el fondo del documento—, no contra el papel del tema, porque el `ThemeScope`
        no pinta ninguno. En un tema oscuro eso deja esta franja clara entre secciones oscuras. Como
        capa encima del `bg-inv-bg` que ya trae `BlockSection`, la mezcla es siempre primario sobre
        papel del tema, que es lo que se quería.
      */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-inv-primary/15" />

      {/* Mismo dibujo arriba y abajo, girado media vuelta. Ver `shared/paper-ornaments.tsx`. */}
      <TornEdge className="absolute inset-x-0 top-0 h-5 w-full text-inv-bg sm:h-7" />
      <TornEdge className="absolute inset-x-0 bottom-0 h-5 w-full rotate-180 text-inv-bg sm:h-7" />

      <BlockContainer className="max-w-xl">
        <div className="flex flex-col items-center text-center">
          <HeartMark size={20} strokeWidth={1.4} aria-hidden="true" className="text-inv-accent" />

          <BlockHeading
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.subtitle}
            align="center"
            titleCase="caps"
            className="mt-6"
          />

          {content.deadlineLabel && (
            <RsvpDeadline deadlineLabel={content.deadlineLabel} className="mt-8" />
          )}

          <RsvpAction content={content} align="center" className="mt-9" />

          {content.note && <BlockNote note={content.note} className="mt-9 max-w-sm" />}
        </div>
      </BlockContainer>
    </BlockSection>
  );
}
