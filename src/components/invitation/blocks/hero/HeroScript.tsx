import { eventDateParts } from '@/domain/invitation/event-date';
import { BlockImage } from '../../shared/BlockImage';
import { Countdown } from '../../shared/Countdown';
import { ScrollHint } from '../../shared/ScrollHint';
import type { HeroVariantProps } from './hero-variant';

/**
 * `hero.script` — la fotografía a pantalla completa y los nombres en caligrafía sobre ella, sin
 * nada más que el año en una esquina.
 *
 * Es la séptima portada y la más callada de todas. Las otras seis dicen a qué te invitan antes de
 * decir quién: un rótulo en versalitas, una frase de invitación, una fecha compuesta. Esta enseña
 * **una foto y dos nombres**, y deja el resto para la sección siguiente. Es la retórica de un
 * cartel de cine —imagen, título, año— aplicada a una invitación, y es lo que hace que funcione
 * en blanco y negro: sin color, lo único que puede sostener una pantalla entera es el contraste
 * entre la fotografía y una sola pieza de tipografía muy trabajada.
 *
 * ## El nombre es el titular, y va en la caligrafía del tema
 *
 * A cuerpo de cartel y en dos renglones cuando el contenido trae «Ana & Diego»: la conjunción
 * cae en su propio renglón, más pequeña y en la serif, que es como se compone un par de nombres
 * en una papelería formal. Se parte por el `&` o por la `y` —ver {@link splitPair}— y no por el
 * ancho: dejando que el navegador rompa la línea, «Ana &» se quedaría arriba y «Diego» abajo.
 *
 * Con un nombre solo no hay nada que partir y el titular es una línea. Con apellido, este baja a
 * versalitas espaciadas, como en `hero.framed`: dos líneas de caligrafía seguidas compiten entre
 * ellas.
 *
 * ## El año, y no la fecha
 *
 * Arriba a la derecha, diminuto. La fecha completa —el día, el mes, la hora— es de la sección
 * siguiente, donde el calendario la enseña entera; repetirla aquí en grande dejaría dos fechas
 * peleándose en las dos primeras pantallas. El año solo hace otra cosa: sitúa la celebración de
 * un vistazo y remata la composición por la esquina que la fotografía deja vacía.
 *
 * ## Sin velo de arriba abajo
 *
 * El texto se apoya abajo y por eso el velo entra por abajo (`bottom-tall`). En una fotografía en
 * blanco y negro —que es como la sirve el tema `ink`, con `photo.filter`— el velo hace además
 * otra cosa: recupera el negro que el filtro aplana, y la caligrafía blanca vuelve a tener contra
 * qué recortarse. Con la misma foto en color el efecto es el de siempre.
 */
export function HeroScript({ content }: HeroVariantProps) {
  const parts = eventDateParts(content.startsAt);
  const [first, second] = splitPair(content.celebrantName);

  return (
    <section
      data-block="hero"
      data-variant="script"
      className="relative isolate flex min-h-[var(--inv-viewport,100svh)] w-full flex-col justify-end overflow-hidden bg-inv-primary font-inv-body text-inv-on-primary inv-on-photo"
    >
      {content.image && (
        <>
          <BlockImage image={content.image} priority className="-z-20" />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 inv-scrim"
            data-from="bottom-tall"
          />
        </>
      )}

      {/* El año, en la esquina que la fotografía deja libre. `tabular-nums` no hace falta —no
          cambia nunca— pero sí el `tracking`: cuatro cifras juntas a este cuerpo se leen como una
          sola palabra. */}
      {parts && (
        <p className="absolute top-6 right-6 z-10 m-0 text-[11px] tracking-[0.3em] opacity-85 sm:top-9 sm:right-10 sm:text-[12px]">
          {parts.year}
        </p>
      )}

      <div className="inv-rise relative z-10 w-full px-7 pt-24 pb-24 sm:px-14 sm:pb-28">
        <h1 className="m-0 font-inv-script text-[clamp(3.4rem,19vw,7rem)] leading-[0.78] font-normal">
          {first}
          {second && (
            <>
              {/*
                La conjunción en la serif y pequeña, en su propio renglón. En una caligrafía el
                ampersand es un floreo enorme —suele ser el glifo más ornamentado de la familia— y
                a este cuerpo se comería a los dos nombres. Pequeño y en la otra tipografía hace
                lo que tiene que hacer: separar y no llamar la atención.
              */}
              <span className="block font-inv-display text-[0.24em] leading-none tracking-[0.2em] opacity-80 italic">
                &amp;
              </span>
              {second}
            </>
          )}
        </h1>

        {content.celebrantLastName && (
          <p className="mt-7 mb-0 text-[11px] tracking-[0.34em] uppercase opacity-85 sm:text-[12px]">
            {content.celebrantLastName}
          </p>
        )}

        {content.showCountdown && (
          <Countdown startsAt={content.startsAt} variant="air" align="start" className="mt-12" />
        )}
      </div>

      <ScrollHint />
    </section>
  );
}

/**
 * Parte «Ana & Diego» en sus dos nombres, o devuelve el nombre solo.
 *
 * Vive aquí y no en el dominio a propósito: el contrato guarda `celebrantName` como **una** línea
 * —«Ana & Diego», «Renata»— y así tiene que seguir, porque las otras seis portadas la componen en
 * un renglón y no necesitan saber que dentro puede haber dos personas. Partirla es una decisión
 * de esta composición, no un dato del evento.
 *
 * Se corta por el primer `&` o por una `y` suelta, y solo si a los dos lados queda algo. Un
 * nombre como «Ana y Sofía Robles» se parte en «Ana» / «Sofía Robles», que es lo correcto cuando
 * son dos festejadas; «Yolanda» no se toca, porque la `y` va pegada a más letras.
 */
function splitPair(name: string): readonly [string, string | null] {
  const match = /^(.+?)\s+(?:&|y)\s+(.+)$/i.exec(name.trim());

  if (!match) return [name, null];

  return [match[1] as string, match[2] as string];
}
