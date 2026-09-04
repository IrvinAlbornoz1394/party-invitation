import clsx from 'clsx';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import {
  FooterCredits,
  FooterLinks,
  FooterMonogram,
  FooterTopLink,
  type FooterVariantProps,
} from './footer-parts';

/**
 * `footer.colophon` — el colofón de la revista: doble filete, cabecera y las columnas separadas
 * por corondeles.
 *
 * Es el pie de la estructura `editorial`, y existe porque las otras tres no cierran una revista.
 * `centered` apila en un eje —es papelería—, `ribbon` pinta una franja de color —es interfaz— y
 * `marquee` convierte el nombre en un rótulo —es cartel—. Una revista termina de otra manera: con
 * un **filete doble** que dice que el cuerpo del documento acabó, la cabecera repetida debajo y
 * los datos de edición repartidos en columnas separadas por corondeles.
 *
 * ## El filete doble no es un adorno
 *
 * Un filete grueso con uno fino tres píxeles debajo es la marca tipográfica de «aquí termina lo
 * que se estaba leyendo». Con uno solo —lo que hace `footer.centered`— se lee como una
 * separación entre secciones, que es justo lo que no es: después de esto no hay otra sección.
 *
 * ## Los corondeles hacen el trabajo de las etiquetas
 *
 * La tentación en un colofón es rotular cada campo —«Fecha», «Ciudad», «Contacto»—, y aquí eso
 * está prohibido por una razón que vale para todo el catálogo: **ninguna variante escribe copia**.
 * Los rótulos son contenido del evento, y una variante que los inventa deja de servir para un
 * evento que los quiere en otro idioma o con otras palabras.
 *
 * Los corondeles resuelven lo mismo sin escribir nada. Tres columnas separadas por una línea
 * vertical se leen como tres campos distintos aunque no lleven título, que es exactamente cómo se
 * compone la mancheta de un periódico. En móvil no hay columnas —360 px no dan para tres— así que
 * la línea pasa a ser horizontal y separa filas: la misma señal, en el eje que toca.
 *
 * ## Por qué el mensaje va en medio
 *
 * Porque en un colofón el texto corrido es lo único que no es un dato, y ponerlo entre los dos
 * bloques de datos —fecha y ciudad a un lado, contactos al otro— es lo que le da a la retícula el
 * ritmo de un pliego. Al principio o al final quedaría como un pie de página con una frase
 * suelta encima.
 *
 * ## Una columna vacía no dibuja su corondel
 *
 * Casi todos los campos del pie son opcionales, así que las tres columnas pueden quedarse sin
 * contenido. En escritorio eso da igual —la columna vacía mantiene el ritmo de la retícula y el
 * corondel sigue separando algo—, pero en móvil las columnas son filas y el corondel es una línea
 * horizontal: una fila sin contenido deja un filete suelto con veintiocho píxeles de aire debajo,
 * que se lee como una sección que no cargó. Por eso el filete y su relleno cuelgan de que la
 * columna tenga algo que enseñar, y no de la columna.
 */
export function FooterColophon({ content }: FooterVariantProps) {
  return (
    <BlockSection block="footer" variant="colophon" className="py-14 sm:py-16">
      <BlockContainer>
        {/* El filete doble. Dos elementos y no un `border` con `outline`: el hueco entre los dos
            trazos tiene que ser fijo en píxeles, y un `outline-offset` se mide desde el borde de
            la caja, que aquí no existe. */}
        <div aria-hidden="true" className="h-0.5 w-full bg-inv-primary" />
        <div aria-hidden="true" className="mt-[3px] h-px w-full bg-inv-line" />

        {/* La cabecera: el nombre a la izquierda en cuerpo de titular, el monograma al otro
            extremo. Es la mancheta, y por eso no va centrada. */}
        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
          <p className="m-0 font-inv-display text-[clamp(1.5rem,4vw,2.3rem)] leading-tight font-light text-inv-primary">
            {content.names}
          </p>

          {content.monogram && <FooterMonogram monogram={content.monogram} className="shrink-0" />}
        </div>

        {/*
          Las tres columnas. Los corondeles se pintan como borde IZQUIERDO de las columnas segunda
          y tercera y no como borde derecho de la primera y la segunda: con el borde derecho, la
          última columna se queda sin línea a su izquierda cuando la del medio está vacía —un
          evento sin `message`— y la retícula pierde una separación sin que nadie lo note.

          En móvil el mismo borde se vuelve superior (`border-t`), que es la señal equivalente
          cuando las columnas se han convertido en filas.
        */}
        <div className="mt-10 grid gap-7 sm:grid-cols-3 sm:gap-0">
          <div className="sm:pr-8">
            {(content.dateLabel || content.city) && (
              <p className="m-0 flex flex-col gap-1 text-[12.5px] tracking-[0.2em] text-inv-ink-soft uppercase">
                {content.dateLabel && <span>{content.dateLabel}</span>}
                {content.city && <span>{content.city}</span>}
              </p>
            )}
          </div>

          <div
            className={clsx(
              'sm:border-l sm:border-inv-line sm:px-8',
              content.message && 'border-t border-inv-line pt-7 sm:border-t-0 sm:pt-0',
            )}
          >
            {content.message && (
              <p className="m-0 text-[14.5px] leading-relaxed text-inv-ink-soft">
                {content.message}
              </p>
            )}
          </div>

          <div
            className={clsx(
              'sm:border-l sm:border-inv-line sm:pl-8',
              content.links.length > 0 && 'border-t border-inv-line pt-7 sm:border-t-0 sm:pt-0',
            )}
          >
            <FooterLinks links={content.links} className="flex-col items-start gap-y-3" />
          </div>
        </div>

        {(content.credits || content.topAction) && (
          /* El folio: lo de más abajo de la página, repartido a los dos extremos como el número
             de página y el nombre de la publicación en un pliego impreso. */
          <div className="mt-12 flex flex-col items-center gap-4 border-t border-inv-line pt-6 sm:flex-row sm:justify-between">
            {content.credits && <FooterCredits credits={content.credits} />}
            {content.topAction && (
              <FooterTopLink label={content.topAction.label} href={content.topAction.href} />
            )}
          </div>
        )}
      </BlockContainer>
    </BlockSection>
  );
}
