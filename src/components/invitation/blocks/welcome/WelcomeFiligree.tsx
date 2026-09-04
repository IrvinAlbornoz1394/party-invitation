import { eventDateParts } from '@/domain/invitation/event-date';
import { BlockImage } from '../../shared/BlockImage';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';
import { FiligreeCorner } from './welcome-ornaments';

/**
 * `welcome.filigree` — la participación grabada: cuatro esquinas de filigrana sobre la fotografía.
 *
 * El registro más formal del catálogo. La foto va velada casi hasta el sepia para que el trazo
 * blanco de la filigrana se sostenga encima —es un dibujo de un píxel de grosor, y sobre una
 * fotografía con contraste desaparece— y todo el texto se apoya en el eje central, como en una
 * plancha de imprenta.
 *
 * ## Las cuatro esquinas son la misma
 *
 * Dibujada una vez y girada noventa grados tres veces. Además de no repetir el trazo, es lo que
 * garantiza que sean idénticas: cuatro dibujos a mano acaban con una esquina que no encaja y que
 * solo se nota cuando ya está en el móvil de alguien.
 *
 * ## En un móvil las esquinas encogen, no se recortan
 *
 * A 360 píxeles de ancho, dos filigranas de 110 px se comen la mitad de la pantalla y el nombre
 * queda sin sitio. Miden 68 px de partida y crecen a partir de `sm`, que es la única forma de que
 * el marco siga siendo un marco y no un cerco.
 */
export function WelcomeFiligree({ content }: WelcomeVariantProps) {
  const parts = content.startsAt ? eventDateParts(content.startsAt) : null;

  return (
    <WelcomeShell
      variant="filigree"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      className="text-inv-on-primary inv-on-photo"
      contentClassName="items-center justify-center px-8 py-14 text-center sm:px-12"
      backdrop={
        <>
          {content.image ? (
            <BlockImage image={content.image} priority className="-z-20" />
          ) : (
            <div aria-hidden="true" className="absolute inset-0 -z-20 bg-inv-primary" />
          )}
          {/* Velo uniforme y denso: aquí no hay una zona de texto que proteger, hay un dibujo de
              línea repartido por los cuatro cantos. Un degradado dejaría dos esquinas legibles y
              dos perdidas. */}
          <div aria-hidden="true" className="absolute inset-0 -z-10 inv-scrim" data-from="all" />
        </>
      }
    >
      <FiligreeCorner className="absolute top-3 left-3 size-[68px] opacity-70 sm:top-6 sm:left-6 sm:size-[110px]" />
      <FiligreeCorner className="absolute top-3 right-3 size-[68px] rotate-90 opacity-70 sm:top-6 sm:right-6 sm:size-[110px]" />
      <FiligreeCorner className="absolute right-3 bottom-3 size-[68px] rotate-180 opacity-70 sm:right-6 sm:bottom-6 sm:size-[110px]" />
      <FiligreeCorner className="absolute bottom-3 left-3 size-[68px] -rotate-90 opacity-70 sm:bottom-6 sm:left-6 sm:size-[110px]" />

      <div className="relative flex max-w-sm flex-col items-center">
        <h2 className="m-0 font-inv-script text-[clamp(2.75rem,14vw,4.5rem)] leading-[0.95] font-normal">
          {content.celebrantName}
        </h2>

        {content.eventTypeLabel && (
          <p className="mt-3 mb-0 text-[11px] tracking-[0.42em] uppercase opacity-90">
            {content.eventTypeLabel}
          </p>
        )}

        {/*
          La fecha en dos columnas con un filete en medio: el día en cuerpo grande a la izquierda
          y la hora y el sitio a la derecha. Es la maqueta de una participación, y funciona en un
          móvil porque las dos columnas son estrechas de nacimiento.
        */}
        {(parts || content.dateLabel) && (
          <div className="mt-9 flex w-full items-stretch justify-center gap-5">
            {parts ? (
              <>
                <span className="flex flex-col items-center justify-center">
                  <b className="font-inv-display text-[clamp(2.5rem,13vw,3.5rem)] leading-none font-normal tabular-nums">
                    {parts.day}
                  </b>
                  <span className="mt-1 text-[10.5px] tracking-[0.3em] uppercase opacity-85">
                    {parts.month}
                  </span>
                </span>

                <span aria-hidden="true" className="w-px shrink-0 bg-current/35" />

                <span className="flex max-w-[13rem] flex-col justify-center gap-1 text-left">
                  {parts.time && (
                    <span className="text-[13px] tracking-[0.12em] tabular-nums">
                      {parts.time} h
                    </span>
                  )}
                  {content.venue && (
                    <span className="text-[13px] leading-snug opacity-90">{content.venue}</span>
                  )}
                </span>
              </>
            ) : (
              <p className="m-0 text-[12px] tracking-[0.24em] uppercase opacity-90">
                {content.dateLabel}
              </p>
            )}
          </div>
        )}

        {content.note && (
          <p className="mt-8 mb-0 max-w-xs font-inv-display text-[15px] italic opacity-90">
            {content.note}
          </p>
        )}

        <WelcomeOpenButton label={content.openLabel} tone="onImage" className="mt-10" />
      </div>
    </WelcomeShell>
  );
}
