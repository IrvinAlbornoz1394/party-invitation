import { Heart } from 'lucide-react';
import { BlockImage } from '../../shared/BlockImage';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';

/**
 * `welcome.band` — la fotografía arriba y una franja de color abajo. La forma nativa del móvil.
 *
 * Es la más parecida a lo que la gente ya reconoce como «invitación digital»: el retrato ocupando
 * casi toda la pantalla, los datos sobre el propio retrato, y una banda de color al pie con la
 * frase y el botón. Sirve igual para unos XV que para una boda —lo único que cambia es el
 * contenido y el tema— y es la que mejor aguanta un teléfono pequeño, porque no hay dos columnas
 * ni nada que reflowear: es una pila.
 *
 * ## Por qué el texto va sobre la foto y no dentro de la banda
 *
 * Porque la banda tiene que quedarse corta. Metiendo ahí el nombre, la fecha y la frase, en un
 * teléfono de 640 px de alto la franja se come la mitad de la pantalla y el retrato —que es lo
 * que se ha venido a ver— queda reducido a una tira. Con el nombre encima de la imagen, la banda
 * puede medir lo que mide una frase.
 *
 * ## El degradado no es decoración
 *
 * Sin él, el nombre en blanco encima de un vestido claro desaparece. Va solo en el tercio
 * inferior de la fotografía, que es donde hay letras, y deja el rostro intacto: velar la imagen
 * entera para proteger tres líneas es el error que hace que estas pantallas parezcan apagadas.
 */
export function WelcomeBand({ content }: WelcomeVariantProps) {
  return (
    <WelcomeShell
      variant="band"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      contentClassName="justify-end"
    >
      {/*
        El retrato, **en su propia caja**. Estaba como fondo de la puerta entera y la banda le
        tapaba el pie: `object-cover` encuadraba contra la pantalla completa, así que la parte de
        la foto que quedaba a la vista no era la que el encuadre había elegido. Ahora la imagen
        ocupa exactamente el hueco que se ve, y `flex-1` se lo reparte con la banda: si la frase
        de abajo crece, la foto cede alto en lugar de quedar recortada por sorpresa.
      */}
      <div className="relative flex min-h-0 w-full flex-1 flex-col justify-end overflow-hidden">
        {content.image ? (
          /*
           * Centrada, no anclada arriba.
           *
           * Con `object-top` el recorte empieza por el borde superior de la fotografía, y en una
           * foto de estudio eso es casi siempre aire: la caja se llenaba de cielo o de techo y la
           * pareja quedaba arrinconada abajo. El sujeto de un retrato vive en el centro —es donde
           * lo pone quien encuadra—, así que un recorte centrado es el que más veces acierta con
           * fotografías que nadie va a revisar una por una.
           */
          <BlockImage image={content.image} priority className="object-center" />
        ) : (
          <div aria-hidden="true" className="absolute inset-0 bg-inv-primary" />
        )}

        <div className="relative w-full px-7 pb-7 text-center text-inv-on-primary">
          {/* El velo, atado al bloque de texto y no a la pantalla: crece con él si el nombre ocupa
              dos líneas, en lugar de quedarse corto. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 -top-24 bottom-0 -z-10 bg-linear-to-t from-inv-overlay/85 via-inv-overlay/55 to-transparent"
          />

          {content.eventTypeLabel && (
            <p className="m-0 text-[13px] tracking-[0.24em] uppercase">{content.eventTypeLabel}</p>
          )}

          <h2 className="mt-1 mb-0 font-inv-script text-[clamp(3rem,16vw,4.5rem)] leading-[0.95] font-normal">
            {content.celebrantName}
          </h2>

          {content.celebrantLastName && (
            <p className="mt-1 mb-0 text-[11px] tracking-[0.32em] uppercase opacity-90">
              {content.celebrantLastName}
            </p>
          )}

          {content.dateLabel && (
            <p className="mt-2 mb-0 text-[15px] font-medium tracking-[0.16em] uppercase">
              {content.dateLabel}
            </p>
          )}
        </div>
      </div>

      {/*
        La banda. `bg-inv-primary` y no un color propio: es la pieza que le da a esta pantalla el
        color del tema, y con el morado de «saja-boys» o el azul de «corporate» funciona igual.
      */}
      <div className="w-full bg-inv-primary px-7 pt-7 pb-9 text-center text-inv-on-primary">
        {content.note && (
          <p className="m-0 mx-auto max-w-[20rem] text-[14.5px] leading-relaxed">{content.note}</p>
        )}

        <Heart
          size={16}
          aria-hidden="true"
          className="mx-auto mt-4 fill-current opacity-90"
          strokeWidth={0}
        />

        {/* `onImage` aunque no haya foto debajo: la banda es del color principal del tema, y el
            botón sólido de `onSurface` es de ese mismo color — se volvería invisible. El tono no
            dice «hay una fotografía», dice «esto se apoya en algo con color». */}
        <WelcomeOpenButton
          label={content.openLabel}
          tone="onImage"
          className="mt-7 w-full sm:w-auto"
        />
      </div>
    </WelcomeShell>
  );
}
