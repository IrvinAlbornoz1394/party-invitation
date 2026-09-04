import { ChevronUp } from 'lucide-react';
import { BlockImage } from '../../shared/BlockImage';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';

/**
 * `welcome.spotlight` — el retrato a sangre, el nombre en manuscrita y una sola indicación.
 *
 * La versión cinematográfica de la puerta: cero papelería, la fotografía ocupándolo todo y el
 * mínimo texto posible encima. Es la que pide una sesión de fotos buena y la que peor sienta sin
 * ella —por eso existe `welcome.veil`—.
 *
 * ## La flecha apunta hacia arriba
 *
 * Porque es hacia donde se va la puerta. La animación de salida levanta el telón, y una flecha
 * que señalara hacia abajo estaría prometiendo lo contrario de lo que va a pasar; en una
 * pantalla que dura tres segundos, esa incoherencia es de las pocas cosas que se notan sin saber
 * por qué. El movimiento del icono es corto y lento: sugiere el gesto sin pedirlo a gritos.
 *
 * ## El velo en dos tiempos
 *
 * Un degradado desde abajo —donde va el texto— y una viñeta suave en los bordes. El degradado es
 * el que hace legible la manuscrita; la viñeta es la que hace que la fotografía parezca
 * iluminada por un foco en lugar de recortada. Los dos usan el color `overlay` del tema, así que
 * un tema claro vela con marfil y uno nocturno con negro.
 */
export function WelcomeSpotlight({ content }: WelcomeVariantProps) {
  return (
    <WelcomeShell
      variant="spotlight"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      className="text-inv-on-primary inv-on-photo"
      contentClassName="justify-end px-7 pt-16 pb-14 text-center sm:px-10 sm:pb-16"
      backdrop={
        <>
          {content.image ? (
            <BlockImage image={content.image} priority className="-z-20" />
          ) : (
            <div aria-hidden="true" className="absolute inset-0 -z-20 bg-inv-primary" />
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-linear-to-t from-inv-overlay from-10% via-inv-overlay/45 to-inv-overlay/10"
          />
          {/* La viñeta: un degradado radial del mismo velo, más denso en las esquinas. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-radial-[circle_at_50%_38%] from-transparent from-45% to-inv-overlay/70"
          />
        </>
      }
    >
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        {content.eventTypeLabel && (
          <p className="m-0 text-[11px] tracking-[0.34em] uppercase opacity-80">
            {content.eventTypeLabel}
          </p>
        )}

        <h2 className="mt-5 mb-0 font-inv-script text-[clamp(3rem,15vw,5.5rem)] leading-[0.9] font-normal">
          {content.celebrantName}
          {content.celebrantLastName && (
            <span className="mt-1 block text-[0.42em] tracking-[0.36em] uppercase opacity-85">
              {content.celebrantLastName}
            </span>
          )}
        </h2>

        {content.dateLabel && (
          <p className="mt-6 mb-0 text-[12px] tracking-[0.26em] uppercase opacity-80">
            {content.dateLabel}
          </p>
        )}

        {content.note && (
          <p className="mt-4 mb-0 max-w-xs text-[14px] leading-relaxed opacity-85">
            {content.note}
          </p>
        )}

        {/*
          El disparador de esta variante no es un botón con forma de botón: es una flecha con su
          rótulo debajo, porque la composición vive de que no haya ningún rectángulo tapando la
          fotografía. Lo que sí lleva es peso —`font-medium`— y un círculo con fondo propio: sobre
          una foto cualquiera, una versalita espaciada en peso normal se deshilacha.
        */}
        <WelcomeOpenButton
          label={content.openLabel}
          className="group mt-12 flex flex-col items-center gap-3.5"
        >
          <span
            aria-hidden="true"
            className="inv-bob grid size-12 place-items-center rounded-full border border-current/50 bg-current/12 backdrop-blur-[3px] transition-colors group-hover:bg-current/20"
          >
            <ChevronUp size={20} strokeWidth={1.8} />
          </span>
          <span className="text-[11.5px] font-medium tracking-[0.3em] uppercase">
            {content.openLabel}
          </span>
        </WelcomeOpenButton>
      </div>
    </WelcomeShell>
  );
}
