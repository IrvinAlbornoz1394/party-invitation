import { Heart } from 'lucide-react';
import { BlockImage } from '../../shared/BlockImage';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';

/**
 * `welcome.band` — el retrato a sangre y la postal apoyada encima.
 *
 * Es la puerta de `storytelling`, y habla el idioma que esa estructura ya usa en el resto de la
 * invitación: la confirmación es una postal (`rsvp.postcard`) y el cierre, una página de álbum
 * (`closing.album`). Aquí la pantalla de entrada es lo mismo — una tarjeta dejada sobre la
 * fotografía— y no una interfaz partida en dos.
 *
 * ## Qué se rehízo, y por qué la versión anterior se veía apagada
 *
 * Antes eran dos zonas pegadas: la foto arriba y una franja lisa de `primary` abajo, a todo el
 * ancho y con el canto recto. Tres cosas la hundían a la vez, y las tres se ven en cuanto se mira
 * en un móvil:
 *
 *   1. **El corte recto de canto a canto.** Una arista horizontal que cruza la pantalla entera es
 *      lo más plano que se puede dibujar: parte la puerta en dos rectángulos y ninguno de los dos
 *      se lee como pieza principal.
 *   2. **El color plano y saturado.** `primary` a superficie completa es el color del tema en su
 *      forma más cruda —una losa lavanda de un tercio de pantalla— y hace que la fotografía, que
 *      es lo que se ha venido a ver, parezca el accesorio.
 *   3. **Ninguna profundidad.** Dos planos al mismo nivel, sin sombra, sin filete y sin margen.
 *
 * La postal corrige las tres con una sola decisión: la tarjeta se **separa de los bordes**, así
 * que la fotografía la rodea por los tres lados y ya no hay arista que cruce nada; va en papel
 * (`surface`) con un filete tenue en vez de en color plano; y flota con sombra y un desenfoque de
 * fondo, que es lo que la convierte en un objeto apoyado encima y no en una zona de la pantalla.
 *
 * ## El texto vuelve a la tarjeta, y ahora sí cabe
 *
 * La versión anterior tenía que poner el nombre **sobre la foto** porque su franja crecía a lo
 * ancho de la pantalla: metiendo ahí los datos, en un teléfono de 640px se comía media pantalla.
 * Una tarjeta con márgenes es más estrecha, así que el mismo texto ocupa menos alto y cabe entero
 * dentro — y el retrato conserva la parte de arriba, que es donde está la cara.
 *
 * De paso desaparece el velo sobre la fotografía: no hay letras encima que proteger. Queda solo un
 * degradado suave al pie, para que el canto inferior de la tarjeta no flote sobre un fondo claro
 * sin ninguna separación.
 */
export function WelcomeBand({ content }: WelcomeVariantProps) {
  return (
    <WelcomeShell
      variant="band"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      contentClassName="justify-end px-5 pb-6 sm:px-8 sm:pb-9"
      backdrop={
        <>
          {content.image ? (
            /*
             * Centrada, no anclada arriba: con `object-top` el recorte empieza por el borde
             * superior, y en una foto de estudio eso es casi siempre aire. El sujeto de un retrato
             * vive en el centro, que es donde lo pone quien encuadra.
             */
            <BlockImage image={content.image} priority className="-z-20 object-center" />
          ) : (
            <div aria-hidden="true" className="absolute inset-0 -z-20 bg-inv-primary" />
          )}

          {/* El degradado del pie. No protege texto —ya no hay ninguno sobre la foto—: separa el
              canto de la tarjeta del fondo cuando la fotografía es clara, que es la mitad de los
              retratos de XV. */}
          <div aria-hidden="true" className="absolute inset-0 -z-10 inv-scrim" data-from="bottom" />
        </>
      }
    >
      {/*
        La postal. `surface` y no `primary`: es papel apoyado sobre la fotografía, y el color del
        tema entra por el filete, por el ornamento y por el botón —que es donde un color se lee
        como decisión y no como relleno—.

        `backdrop-blur` con la opacidad justo por debajo del opaco: deja intuir la fotografía
        detrás del papel, que es lo que hace que la tarjeta se vea **encima de** la foto y no
        recortada contra ella.
      */}
      <div className="relative mx-auto w-full max-w-sm rounded-inv-lg border border-inv-line/70 bg-inv-surface/95 px-7 py-8 text-center shadow-inv-soft backdrop-blur-[3px] sm:px-8">
        {content.eventTypeLabel && (
          <p className="m-0 text-[10.5px] tracking-[0.3em] text-inv-ink-soft uppercase">
            {content.eventTypeLabel}
          </p>
        )}

        <h2 className="mt-3 mb-0 font-inv-script text-[clamp(2.5rem,13vw,3.6rem)] leading-[0.95] font-normal text-inv-primary">
          {content.celebrantName}
        </h2>

        {content.celebrantLastName && (
          <p className="mt-2.5 mb-0 text-[10px] tracking-[0.3em] text-inv-ink-soft uppercase">
            {content.celebrantLastName}
          </p>
        )}

        {/* El filete con el corazón encajado: es el remate de una postal impresa, y sustituye al
            corazón suelto que antes flotaba en mitad de la franja sin nada que lo sostuviera. */}
        <p aria-hidden="true" className="mt-6 mb-0 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-inv-line" />
          <Heart size={13} className="fill-inv-accent text-inv-accent" strokeWidth={0} />
          <span className="h-px w-10 bg-inv-line" />
        </p>

        {content.dateLabel && (
          <p className="mt-5 mb-0 text-[11.5px] tracking-[0.22em] text-inv-ink uppercase">
            {content.dateLabel}
          </p>
        )}

        {content.note && (
          <p className="mt-4 mb-0 text-[13.5px] leading-relaxed text-inv-ink-soft">{content.note}</p>
        )}

        {/* `onSurface`: la tarjeta es papel, así que el botón sólido del tema se lee sobre ella.
            En la franja de color anterior tenía que ser `onImage` o desaparecía. */}
        <WelcomeOpenButton
          label={content.openLabel}
          tone="onSurface"
          className="mt-7 w-full sm:w-auto"
        />
      </div>
    </WelcomeShell>
  );
}
