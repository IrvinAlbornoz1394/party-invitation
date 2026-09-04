import { BlockImage } from '../../shared/BlockImage';
import { BotanicalSpray, TiaraGlyph } from '../../shared/paper-ornaments';
import { WelcomeOpenButton, WelcomeShell, type WelcomeVariantProps } from './welcome-parts';

/**
 * `welcome.gilded` — la puerta enmarcada en oro: doble filete por los cuatro costados,
 * guirnaldas en dos esquinas, la tiara arriba y el nombre en manuscrita sobre la fotografía en
 * penumbra.
 *
 * Es la duodécima bienvenida y la más **cargada** del catálogo, que es justo lo que no había. Las
 * once anteriores se reparten entre la papelería sobria y el cartel; ninguna imita una
 * participación **grabada a dos tintas**, que es la pieza más vendida de una invitación de XV:
 * fondo oscuro, todo el ornamento en dorado y la fotografía haciendo de fondo, no de sujeto.
 *
 * ## Qué la separa de `welcome.crown`, que también lleva corona
 *
 *   `crown`   la hermana de `luminous`: corona pequeña, nombre en manuscrita y foto en penumbra.
 *             No hay marco ni ornamento en los cantos — la pantalla es el nombre y poco más.
 *   `gilded`  el **marco** es la mitad del diseño. Doble filete inscrito, guirnaldas
 *             desbordando dos esquinas y la tiara ilustrada arriba. La pantalla es una lámina.
 *
 * Dicho de otro modo: aquella compone con aire y esta con ornamento. Las dos son de XV —la corona
 * va escrita en el componente, como el «XV» de `hero.quince`— y por eso ninguna se ofrece a una
 * boda: ahí prometerían otra celebración.
 *
 * ## El marco va por dentro y en dos filetes
 *
 * Inscrito con un margen, nunca pegado al canto: un borde en el borde de la pantalla se lee como
 * el marco del navegador. Y dos y no uno, separados por un pelo, por lo mismo que en
 * `story.pressed` — con uno solo esto es una caja; con dos, un grabado.
 *
 * El grosor no cambia entre móvil y escritorio, y el margen sí: en una pantalla de 320 puntos, un
 * marco a 40px de los cantos se come el ancho del texto.
 *
 * ## La fotografía va muy velada, y aquí más que en las otras
 *
 * Toda la composición es de trazo fino y dorado —filetes de un píxel, guirnaldas, filigrana— y un
 * trazo así desaparece sobre cualquier zona clara de una foto. El velo `all` es el más denso de
 * los cinco y es el único que garantiza que el marco se vea entero por los cuatro lados, que es
 * de lo que vive la variante.
 */
export function WelcomeGilded({ content }: WelcomeVariantProps) {
  return (
    <WelcomeShell
      variant="gilded"
      label={`Bienvenida a la invitación de ${content.celebrantName}`}
      className="text-inv-on-primary inv-on-photo"
      contentClassName="items-center justify-center px-10 py-16 text-center sm:px-14"
      backdrop={
        <>
          {content.image ? (
            /* `scale-105`: la foto se pinta un punto más grande que la pantalla para que, al
               abrirse la puerta, el movimiento no descubra un canto vacío. Es lo mismo que hace
               `welcome.crown`. */
            <BlockImage image={content.image} priority className="-z-20 scale-105" />
          ) : (
            <div aria-hidden="true" className="absolute inset-0 -z-20 bg-inv-primary" />
          )}

          <div aria-hidden="true" className="absolute inset-0 -z-10 inv-scrim" data-from="all" />

          {/*
            El marco y las guirnaldas van en el fondo y no dentro del contenido, y no es un detalle
            de organización: `WelcomeShell` centra su contenido y lo anima al abrirse, así que un
            marco puesto ahí se movería con el texto y dejaría de ser un marco. Aquí se queda
            quieto, pegado a la pantalla, mientras el contenido se va.
          */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-4 -z-10 border border-inv-accent/70 sm:inset-7"
          >
            <div className="absolute inset-1.5 border border-inv-accent/45" />
          </div>

          <BotanicalSpray className="pointer-events-none absolute -top-3 -left-8 -z-10 h-24 w-[14rem] text-inv-accent opacity-60 sm:h-28 sm:w-[19rem]" />
          <BotanicalSpray className="pointer-events-none absolute -right-8 -bottom-3 -z-10 h-24 w-[14rem] rotate-180 text-inv-accent opacity-60 sm:h-28 sm:w-[19rem]" />
        </>
      }
    >
      <div className="relative flex max-w-sm flex-col items-center">
        <TiaraGlyph className="h-14 w-28 text-inv-accent sm:h-16 sm:w-32" />

        {/* La invitación de los padres, en versalitas y arriba del todo: en una participación de
            XV son ellos los que invitan, y esa línea es lo primero que se lee. */}
        {content.note && (
          <p className="mt-8 mb-0 max-w-[20rem] text-[10.5px] leading-[1.9] tracking-[0.24em] uppercase opacity-90 sm:text-[11.5px]">
            {content.note}
          </p>
        )}

        {content.eventTypeLabel && (
          <p className="mt-7 mb-0 font-inv-display text-[clamp(1.6rem,7vw,2.4rem)] leading-none font-light tracking-[0.2em] text-inv-accent uppercase">
            {content.eventTypeLabel}
          </p>
        )}

        {/* El nombre: la pieza más grande de la pantalla, en la manuscrita del tema y en el color
            de acento. Es lo único que no comparte tinta con el resto del texto, y por eso es lo
            que se recuerda. */}
        <h2 className="mt-6 mb-0 font-inv-script text-[clamp(2.9rem,15vw,4.6rem)] leading-[0.85] font-normal text-inv-accent">
          {content.celebrantName}
        </h2>

        {content.celebrantLastName && (
          <p className="mt-5 mb-0 text-[11px] tracking-[0.3em] uppercase opacity-85 sm:text-[12px]">
            {content.celebrantLastName}
          </p>
        )}

        {(content.dateLabel || content.venue) && (
          <p className="mt-8 mb-0 flex flex-col items-center gap-1.5 text-[11.5px] tracking-[0.2em] uppercase opacity-85">
            {content.dateLabel && <span>{content.dateLabel}</span>}
            {content.venue && <span className="opacity-80">{content.venue}</span>}
          </p>
        )}

        <WelcomeOpenButton label={content.openLabel} tone="onImage" className="mt-10" />
      </div>
    </WelcomeShell>
  );
}
