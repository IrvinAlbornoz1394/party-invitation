import { BlockImage } from '../../shared/BlockImage';
import { BlockOrnament } from '../../shared/BlockOrnament';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';

/**
 * `welcome.veil` — el arco: la ventana de medio punto con el retrato dentro y la participación
 * grabada debajo.
 *
 * Es la puerta de `classic`, la estructura de la participación impresa, y el arco es su forma más
 * reconocible: la ventana de la capilla, el troquel de una tarjeta de boda, el marco de un
 * daguerrotipo. Un retrato con el canto superior en semicírculo se lee como pieza de papelería
 * antes de leer una palabra, y eso no lo hacía ninguna otra puerta del catálogo — las nueve
 * restantes encuadran en rectángulo o no encuadran nada.
 *
 * ## Qué se rehízo, y por qué se parecía a la de `botanical`
 *
 * La versión anterior era una **pila centrada en mitad de la pantalla**: rótulo, ornamento,
 * nombre, fecha y botón, uno debajo de otro, con el doble filete alrededor. Exactamente la misma
 * distribución que `welcome.crown` y que `welcome.botanical`. Tres puertas distintas del
 * escaparate de XV repartían sus elementos igual, así que lo único que las separaba era el
 * ornamento de arriba y si había foto o no — que es una diferencia de adorno, no de diseño.
 *
 * Ahora el reparto es otro: **una ventana arriba y el bloque de texto debajo**, con el peso en el
 * arco. El doble filete se conserva porque es lo que la ata a `classic` —el mismo recurso que su
 * portada enmarcada—, pero ya no es lo único que hay.
 *
 * ## Sigue sin depender de una fotografía, que era su razón de ser
 *
 * Es la parte que no se podía perder. Una puerta se decide al principio del encargo, cuando muchas
 * veces todavía no hay sesión de fotos, y las otras se quedan en un color plano.
 *
 * El arco lo resuelve solo: con fotografía es una ventana; sin ella se queda en **arco ciego** —el
 * mismo troquel, dibujado a filete sobre el papel, con el ornamento del tema dentro—. Es un
 * recurso de imprenta de verdad y no un hueco disimulado: una tarjeta con un arco vacío y grabado
 * está terminada, no a medias.
 */
export function WelcomeVeil({ content }: WelcomeVariantProps) {
  return (
    <WelcomeShell
      variant="veil"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      contentClassName="items-center justify-center px-8 py-12 text-center sm:px-12"
    >
      {/* Los dos filetes. Van dentro del contenido y no del fondo a propósito: al abrir suben con
          el texto, y es ese conjunto —marco y letras juntos— lo que se lee como «la tarjeta se
          va» en lugar de «el texto se desvanece». */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-4 border border-inv-line sm:inset-7"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[1.35rem] border border-inv-line/45 sm:inset-[2.1rem]"
      />

      <div className="relative flex max-w-md flex-col items-center">
        {/*
          El arco. `rounded-t-full` sobre una caja 3:4 da el medio punto exacto: el radio superior
          es la mitad del ancho, así que la curva arranca justo a media altura de la pieza y no
          como una esquina redondeada grande.

          El ancho va en `min(vw, rem)` y no en un `max-w` fijo: esta puerta comparte pantalla con
          un bloque de texto y un botón, y en un teléfono de 640px un arco de tamaño fijo empuja el
          botón fuera del recorte del cascarón, que no se desplaza.
        */}
        <figure className="relative m-0 w-[min(48vw,11.5rem)]">
          <div className="relative isolate aspect-[3/4] w-full overflow-hidden rounded-t-full border border-inv-line bg-inv-surface">
            {content.image ? (
              <BlockImage image={content.image} priority className="object-center" sizes="12rem" />
            ) : (
              /* El arco ciego: sin fotografía queda el troquel grabado con el ornamento del tema
                 dentro. Ver la cabecera del archivo. */
              <span className="absolute inset-0 grid place-items-center">
                <BlockOrnament className="w-16 text-inv-accent opacity-70" />
              </span>
            )}
          </div>
        </figure>

        {content.eventTypeLabel && (
          <p className="mt-8 mb-0 text-[10.5px] tracking-[0.34em] text-inv-ink-soft uppercase">
            {content.eventTypeLabel}
          </p>
        )}

        <h2 className="mt-3 mb-0 font-inv-display text-[clamp(2.1rem,9.5vw,3.4rem)] leading-[0.98] font-light text-inv-ink">
          {content.celebrantName}
          {content.celebrantLastName && (
            <span className="mt-3 block text-[11px] tracking-[0.36em] text-inv-ink-soft uppercase">
              {content.celebrantLastName}
            </span>
          )}
        </h2>

        {content.dateLabel && (
          <p className="mt-5 mb-0 text-[11.5px] tracking-[0.24em] text-inv-ink-soft uppercase">
            {content.dateLabel}
          </p>
        )}

        {content.note && (
          <p className="mt-4 mb-0 max-w-xs text-[13.5px] leading-relaxed text-inv-ink-soft">
            {content.note}
          </p>
        )}

        <WelcomeOpenButton label={content.openLabel} tone="onSurface" className="mt-8" />
      </div>
    </WelcomeShell>
  );
}
