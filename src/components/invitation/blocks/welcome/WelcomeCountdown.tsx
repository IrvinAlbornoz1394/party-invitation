import { BlockImage } from '../../shared/BlockImage';
import { Countdown } from '../../shared/Countdown';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';
import { couple } from './welcome-name';

/**
 * `welcome.countdown` — los nombres en manuscrita y lo que falta, en la propia puerta.
 *
 * Es la única de las diez que pone la cuenta regresiva **antes** de entrar, y es una decisión de
 * producto más que de diseño: quien abre la invitación tres meses antes no viene a ver la
 * ubicación, viene a saber cuánto falta, y este es el registro de invitación —la que se comparte
 * pronto y se vuelve a abrir— en el que eso vale la primera pantalla.
 *
 * ## Los dos nombres, uno debajo del otro
 *
 * Cuando el contenido trae una pareja («Jannet & Manuel»), se parte en dos líneas con la «&» en
 * medio: dos caligrafías apiladas ocupan el ancho de un móvil sin encoger, y en una sola línea
 * «Jannet & Manuel» a este cuerpo se sale por los dos lados. Con un nombre solo —unos XV— se
 * pinta entero, sin partir.
 *
 * ## Por qué la cuenta es la compartida y no una propia
 *
 * Porque el formato, el latido y el hueco antes del primer tic ya están resueltos en
 * `shared/Countdown` para las tres portadas que la usan. Una copia aquí serían dos relojes que
 * arreglar por separado — y este es el que se ve al abrir, o sea el que más se mira.
 */
export function WelcomeCountdown({ content }: WelcomeVariantProps) {
  const pair = couple(content.celebrantName);

  return (
    <WelcomeShell
      variant="countdown"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      className="text-inv-on-primary"
      contentClassName="items-center justify-center px-7 py-12 text-center"
      backdrop={
        <>
          {content.image ? (
            <BlockImage image={content.image} priority className="-z-20" />
          ) : (
            <div aria-hidden="true" className="absolute inset-0 -z-20 bg-inv-primary" />
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-linear-to-b from-inv-overlay/45 via-inv-overlay/25 to-inv-overlay/80"
          />
        </>
      }
    >
      <div className="relative flex w-full max-w-sm flex-col items-center">
        <h2 className="m-0 font-inv-script text-[clamp(2.75rem,15vw,4.5rem)] leading-[0.95] font-normal">
          {pair ? (
            <>
              <span className="block">{pair[0]}</span>
              <span className="my-1 block text-[0.5em] opacity-90">&amp;</span>
              <span className="block">{pair[1]}</span>
            </>
          ) : (
            content.celebrantName
          )}
        </h2>

        {content.eventTypeLabel && (
          <p className="mt-6 mb-0 text-[11px] tracking-[0.38em] uppercase opacity-85">
            {content.eventTypeLabel}
          </p>
        )}

        {content.startsAt && (
          <>
            <p className="mt-8 mb-3 text-[10.5px] tracking-[0.42em] uppercase opacity-70">Faltan</p>
            <Countdown startsAt={content.startsAt} tone="onImage" />
          </>
        )}

        {content.dateLabel && (
          <p className="mt-7 mb-0 text-[12px] tracking-[0.24em] uppercase opacity-85">
            {content.dateLabel}
          </p>
        )}

        <WelcomeOpenButton label={content.openLabel} tone="onImage" className="mt-9" />
      </div>
    </WelcomeShell>
  );
}
