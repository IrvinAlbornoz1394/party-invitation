import { eventDateParts } from '@/domain/invitation/event-date';
import { BlockImage } from '../../shared/BlockImage';
import { BlockOrnament } from '../../shared/BlockOrnament';
import { Countdown } from '../../shared/Countdown';
import { ScrollHint } from '../../shared/ScrollHint';
import type { HeroVariantProps } from './hero-variant';

/**
 * `hero.card` — la fotografía a sangre y, encima, una tarjeta de papel con la invitación entera.
 *
 * Es la sexta portada del catálogo y la única que compone **dos planos**: la foto ocupa la
 * pantalla y el texto vive en una pieza de papel apoyada sobre ella, con su sombra. Las otras
 * cinco eligen uno u otro —`classic` apoya el texto directamente sobre la imagen, `framed` mete
 * la imagen dentro del papel, `portrait` las funde— y ninguna deja el papel flotando.
 *
 * La diferencia no es decorativa, es de lectura:
 *
 *   · Sobre la fotografía desnuda (`classic`) el texto depende de que la foto tenga una zona
 *     oscura donde apoyarse, y por eso esa portada necesita velo. Aquí el papel **es** el fondo
 *     del texto, así que la misma composición se sostiene con una foto clara, con una cargada o
 *     —el caso real— con la que el cliente tenga.
 *   · Y a diferencia de `framed`, la fotografía no se encoge: sigue siendo la pantalla entera.
 *     Lo que se lee como caro en la referencia es justo esa tensión — un retrato a toda página
 *     con una tarjeta pequeña encima, como la participación que llega dentro del sobre.
 *
 * ## El orden dentro de la tarjeta
 *
 * Fecha en cifras → nombres en manuscrita → la frase de invitación → la cuenta regresiva. Es el
 * de una participación entregada en mano: primero *cuándo*, que es el dato que se busca, y
 * después *de quién*. Las otras portadas de papelería (`framed`) lo hacen al revés y a propósito;
 * aquí la fecha abre porque la tarjeta es pequeña y lo que se lee primero es lo que está arriba.
 *
 * ## Por qué no hay botón, aunque la referencia lo tenga
 *
 * La imagen de la que sale esta portada remata la tarjeta con un botón oscuro de «confirmar
 * asistencia». No se reproduce: `heroContentSchema` no tiene acción, y no la tiene por una
 * decisión escrita —ver la cabecera de `blocks/hero.ts`—. La confirmación es un bloque con su
 * propio sitio en la lectura, y adelantarla a la primera pantalla pide antes de haber dicho
 * cuándo ni dónde. Lo que sí hace falta —avisar de que la página sigue— lo resuelve
 * `ScrollHint`, igual que en las otras cinco.
 *
 * ## La fecha se compone, no se escribe
 *
 * Sale de `startsAt` partido por el dominio y no de `dateLabel`, y es la única portada que lo
 * hace así: el registro de esta tarjeta es la cifra espaciada —«12 · JUNIO · 2027»— y `dateLabel`
 * es una frase escrita a mano que puede decir «Octubre 2026» o «El día de nuestra boda». Se pinta
 * debajo, en su renglón, cuando aporta algo que las cifras no dicen; ver {@link showsDateLabel}.
 */
export function HeroCard({ content }: HeroVariantProps) {
  const parts = eventDateParts(content.startsAt);

  return (
    <section
      data-block="hero"
      data-variant="card"
      className="relative isolate flex min-h-[var(--inv-viewport,100svh)] w-full flex-col items-center justify-center overflow-hidden bg-inv-bg px-5 py-16 font-inv-body sm:px-10 sm:py-20"
    >
      {content.image ? (
        <>
          <BlockImage image={content.image} priority className="-z-20" />
          {/*
            El velo va **de arriba**, al contrario que en `classic`. La tarjeta se apoya en la
            mitad superior de la pantalla, y un degradado que oscurece el pie dejaría el papel
            recortado contra la parte más clara de la foto: el canto de la tarjeta desaparecería
            justo donde tiene que verse. Oscureciendo arriba, el papel entra sobre un fondo denso
            y la fotografía se abre debajo, que es de donde sale el aire de la referencia.
          */}
          <div aria-hidden="true" className="absolute inset-0 -z-10 inv-scrim" data-from="top" />
        </>
      ) : (
        /* Sin fotografía, el color principal del tema hace de fondo: la tarjeta necesita algo
           contra lo que recortarse, y sobre el papel del propio tema desaparecería. */
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-inv-primary" />
      )}

      {/*
        La tarjeta. Estrecha —`max-w-sm`— porque una tarjeta que ocupa el ancho de la pantalla
        deja de ser una tarjeta y pasa a ser un panel: lo que la hace papel es que se le vea el
        borde por los cuatro lados con fotografía alrededor.
      */}
      <article className="inv-rise relative z-10 w-full max-w-sm rounded-inv-md bg-inv-surface px-7 py-11 text-center shadow-inv-soft sm:px-10 sm:py-14">
        {content.eventTypeLabel && (
          <p className="m-0 text-[10px] tracking-[0.3em] text-inv-accent uppercase sm:text-[11px]">
            {content.eventTypeLabel}
          </p>
        )}

        {/*
          La fecha en cifras, con la calle abierta: es el rótulo de la tarjeta. Los tres tramos
          van en `<span>` separados y no como una sola cadena con puntos escritos, porque el
          separador es un adorno —se oculta a quien escucha la página, que ya oye «12 junio
          2027»— y porque así la línea puede partirse por un hueco y no por la mitad de un punto.
        */}
        {parts && (
          <p className="mt-5 mb-0 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[12px] tracking-[0.28em] text-inv-ink uppercase sm:text-[13px]">
            <span className="tabular-nums">{parts.day}</span>
            <Dot />
            <span>{parts.month}</span>
            <Dot />
            <span className="tabular-nums">{parts.year}</span>
          </p>
        )}

        <BlockOrnament className="mx-auto mt-6 text-inv-accent" />

        {/*
          Los nombres en manuscrita, que es la pieza que convierte la tarjeta en la invitación de
          alguien. `leading-[0.85]`: con «Ana & Diego» la caligrafía parte en dos renglones en un
          teléfono, y con el interlineado normal los dos quedan tan separados que se leen como dos
          líneas y no como un nombre.
        */}
        <h1 className="mt-6 mb-0 font-inv-script text-[clamp(2.9rem,14vw,4.2rem)] leading-[0.85] font-light text-inv-primary">
          {content.celebrantName}
        </h1>

        {content.celebrantLastName && (
          <p className="mt-5 mb-0 text-[11px] tracking-[0.32em] text-inv-ink-soft uppercase">
            {content.celebrantLastName}
          </p>
        )}

        {/* La frase de invitación, en versalitas y no en redonda: en la tarjeta hay una sola pieza
            manuscrita —el nombre— y todo lo demás la acompaña en el registro impreso. */}
        {content.intro && (
          <p className="mt-8 mb-0 text-[10.5px] leading-[1.9] tracking-[0.22em] text-inv-ink-soft uppercase sm:text-[11px]">
            {content.intro}
          </p>
        )}

        {content.tagline && (
          <p className="mt-6 mb-0 text-[14.5px] leading-relaxed text-inv-ink-soft">
            {content.tagline}
          </p>
        )}

        {(showsDateLabel(content.dateLabel, parts) || parts?.time || content.city) && (
          <p className="mt-7 mb-0 flex flex-col items-center gap-1.5 text-[12px] tracking-[0.14em] text-inv-ink-soft">
            {showsDateLabel(content.dateLabel, parts) && <span>{content.dateLabel}</span>}
            {parts?.time && <span className="tabular-nums">{parts.time} h</span>}
            {content.city && <span>{content.city}</span>}
          </p>
        )}

        {content.showCountdown && (
          <Countdown
            startsAt={content.startsAt}
            variant="stacked"
            tone="onSurface"
            className="mt-9"
          />
        )}
      </article>

      <ScrollHint />
    </section>
  );
}

/**
 * ¿La fecha escrita dice algo que las cifras de arriba no digan ya?
 *
 * La tarjeta compone la fecha dos veces con dos registros distintos —las cifras espaciadas del
 * rótulo y la frase que escribió el organizador— y casi siempre son lo mismo: «Sábado 12 de
 * junio, 2027» debajo de «12 · JUNIO · 2027» es la misma información repetida en dos renglones
 * seguidos, que en una tarjeta de este tamaño se lee como un error de maquetación.
 *
 * La comprobación es deliberadamente tosca: si la frase trae el día y el año que ya están
 * arriba, sobra. Lo que salva son los casos en que de verdad aporta —«Octubre 2026», «El día de
 * nuestra boda»—, que es justo para lo que existe ese campo. En la duda se pinta, que es el lado
 * seguro: sobra un renglón, no falta un dato.
 *
 * Las cifras se buscan **enteras** y no como texto suelto. Con `includes`, el día 2 aparecía
 * dentro del «2027» del propio año y cualquier frase quedaba oculta; el día 12, dentro de un
 * «2012». Los cercos de no-dígito son lo que hace que «12» encuentre al doce y no a los doses.
 */
function showsDateLabel(dateLabel: string, parts: ReturnType<typeof eventDateParts>): boolean {
  if (!parts) return true;

  const written = dateLabel.toLowerCase();

  return !(hasNumber(written, parts.day) && hasNumber(written, parts.year));
}

/** ¿El texto trae esa cifra como número entero y no dentro de otro más largo? */
function hasNumber(text: string, number: string): boolean {
  return new RegExp(`(?<!\\d)${number}(?!\\d)`).test(text);
}

/** El punto que separa los tramos de la fecha. Adorno, así que no se anuncia. */
function Dot() {
  return (
    <span aria-hidden="true" className="text-inv-accent opacity-70">
      ·
    </span>
  );
}
