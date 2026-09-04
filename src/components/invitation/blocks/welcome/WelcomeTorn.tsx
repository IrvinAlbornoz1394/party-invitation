import { eventDateParts } from '@/domain/invitation/event-date';
import { BlockImage } from '../../shared/BlockImage';
import { TornEdge } from '../../shared/paper-ornaments';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';

/**
 * `welcome.torn` — el papel rasgado que deja ver la fotografía debajo.
 *
 * Dos materiales en una sola pantalla: arriba el papel del tema con la tipografía, abajo la
 * fotografía, y entre los dos un canto roto. Es el recurso de la papelería artesanal —el que
 * imita una lámina arrancada— y funciona especialmente bien en vertical, que es como se ve una
 * invitación en un teléfono.
 *
 * ## El canto se pinta del color del papel, no recorta la foto
 *
 * La rasgadura es una figura del color de fondo puesta **encima** de la fotografía. Recortar la
 * imagen con una máscara habría sido lo intuitivo y es lo que rompe con los temas: el borde
 * quedaría transparente y por debajo asomaría lo que hubiera, que en un tema oscuro no es papel
 * blanco. Pintando la figura con `text-inv-bg`, el canto **es** el papel, sea del color que sea.
 *
 * ## El reparto vertical
 *
 * 58 % de papel y el resto de fotografía. En un móvil largo eso deja el texto en la mitad alta
 * —donde cae la mirada al abrir— y una franja de foto suficiente para que se entienda que hay
 * alguien detrás. Las dos partes se miden contra `--inv-viewport` y no contra `svh`, para que la
 * previsualización del panel las reparta dentro de su recuadro.
 */
export function WelcomeTorn({ content }: WelcomeVariantProps) {
  const parts = content.startsAt ? eventDateParts(content.startsAt) : null;

  return (
    <WelcomeShell
      variant="torn"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      contentClassName="justify-start"
    >
      {/* La hoja de papel. `relative` porque el canto roto se cuelga de su borde inferior. */}
      <div className="relative h-[58%] w-full shrink-0 bg-inv-bg">
        <div className="flex h-full flex-col items-center justify-center px-8 pt-8 pb-6 text-center text-inv-ink">
          {content.eventTypeLabel && (
            <p className="m-0 text-[11.5px] tracking-[0.3em] text-inv-ink-soft uppercase">
              {content.eventTypeLabel}
            </p>
          )}

          <h2 className="mt-6 mb-0 font-inv-display text-[clamp(2.25rem,11vw,3.25rem)] leading-[1.05] font-light">
            {content.celebrantName}
          </h2>

          {content.celebrantLastName && (
            <p className="mt-2 mb-0 text-[11px] tracking-[0.34em] text-inv-ink-soft uppercase">
              {content.celebrantLastName}
            </p>
          )}

          {/* El filete vertical: el respiro entre el nombre y la fecha, y lo que hace que las dos
              se lean como un solo bloque centrado en lugar de como dos líneas sueltas. */}
          <span aria-hidden="true" className="my-6 h-10 w-px bg-inv-line" />

          {parts ? (
            <p className="m-0 flex items-baseline justify-center gap-4 text-inv-ink">
              <span className="text-[11px] tracking-[0.24em] text-inv-ink-soft uppercase">
                {parts.weekday}
              </span>
              <b className="font-inv-display text-[clamp(2.25rem,11vw,3rem)] leading-none font-normal tabular-nums">
                {parts.day}
              </b>
              <span className="text-[11px] tracking-[0.24em] text-inv-ink-soft uppercase">
                {parts.month}
              </span>
            </p>
          ) : (
            content.dateLabel && (
              <p className="m-0 text-[12px] tracking-[0.26em] text-inv-ink-soft uppercase">
                {content.dateLabel}
              </p>
            )
          )}
        </div>

        {/*
          El canto. Sobresale por debajo del papel (`top-full -mt-px`) y mide poco: una rasgadura
          alta se lee como una sierra. El píxel negativo tapa la costura que deja el redondeo de
          subpíxeles entre el bloque y el SVG.
        */}
        <TornEdge className="absolute top-full -mt-px left-0 h-5 w-full text-inv-bg sm:h-7" />
      </div>

      {/*
        La fotografía, **hermana del papel y no un fondo debajo de él**.
        
        Estaba puesta como fondo de la puerta entera y el papel le tapaba el 58 % de arriba: como
        `object-cover` encuadra contra la caja completa, lo que quedaba a la vista era la mitad de
        abajo de la foto — las cabezas de los novios detrás del papel y las piernas asomando. Con
        la imagen en su propia caja, el encuadre se calcula contra el hueco que de verdad ocupa.

        El recorte va **centrado**. Anclarlo arriba (`object-top`) evitaba cortar cabezas, pero a
        cambio llenaba la franja del aire que toda foto de estudio tiene encima del sujeto: se veía
        cielo, o techo, y la pareja arrinconada en el canto de abajo. En un retrato el sujeto está
        en el centro —es donde lo pone quien encuadra—, así que centrar es lo que más veces acierta
        con fotografías que nadie va a revisar una por una.
      */}
      <div className="relative min-h-0 w-full flex-1 overflow-hidden">
        {content.image ? (
          <BlockImage image={content.image} priority className="object-center" />
        ) : (
          <div aria-hidden="true" className="absolute inset-0 bg-inv-primary" />
        )}

        <div
          aria-hidden="true"
          className="absolute inset-0 inv-scrim" data-from="bottom"
        />

        <div className="relative flex h-full flex-col items-center justify-end px-8 pb-10 text-inv-on-primary inv-on-photo">
          {content.note && (
            <p className="mb-5 max-w-xs text-center text-[13px] leading-snug">{content.note}</p>
          )}

          <WelcomeOpenButton label={content.openLabel} tone="onImage" />
        </div>
      </div>
    </WelcomeShell>
  );
}
