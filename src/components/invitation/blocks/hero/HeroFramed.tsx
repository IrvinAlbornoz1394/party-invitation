import { eventDateParts } from '@/domain/invitation/event-date';
import { BlockImage } from '../../shared/BlockImage';
import { ScrollHint } from '../../shared/ScrollHint';
import { blockIconComponent } from '../../shared/block-icons';
import { BlockOrnament } from '../../shared/BlockOrnament';
import { Countdown } from '../../shared/Countdown';
import { LeafSprig } from '../../shared/paper-ornaments';
import type { HeroVariantProps } from './hero-variant';

/**
 * `hero.framed` — el rótulo arriba, el retrato enmarcado en medio y los nombres a mano debajo.
 *
 * Las otras cuatro portadas parten de la fotografía: la velan, la difuminan o la ponen a un lado.
 * Esta parte del **papel**. La foto no ocupa la pantalla ni se funde con nada: entra en un marco
 * con su filete, centrada, con papel por los cuatro costados — que es exactamente cómo se
 * compone una participación impresa, donde el retrato es una lámina pegada y no el fondo.
 *
 * La consecuencia práctica es que aquí la fotografía **no tiene que ser buena para el formato**.
 * En una portada a sangre, una foto con poco margen alrededor del sujeto obliga a recortar cabezas
 * en vertical; dentro de un marco de proporción fija, la misma foto se ve bien y el texto no
 * depende de que haya una zona oscura donde apoyarse.
 *
 * ## El orden es el de la papelería, no el de una página web
 *
 * Frase de invitación → tipo de evento en versalitas → retrato → corazón → nombres en manuscrita
 * → promesa → fecha. Es la secuencia de una invitación de boda impresa, y es la que hace que lo
 * primero que se lea sea *a qué te invitan* y lo último *cuándo*: al revés —fecha arriba— la
 * portada se lee como un cartel de un evento.
 *
 * ## Sirve igual para unos XV que para una boda
 *
 * Y no por una condición: porque nada aquí sabe de qué evento se trata. Lo que cambia el registro
 * son tres campos del contenido —`eventTypeLabel`, el nombre y el apellido— y el tema que la
 * viste. Con «Ana & Diego» y el apellido a `null` se lee como una participación de boda; con
 * «Renata / Villanueva Sosa», como unos XV. Si esta variante preguntara por el tipo de evento
 * sería una plantilla disfrazada de componente.
 *
 * ## El apellido no va en manuscrita
 *
 * A diferencia de `hero.portrait`, que apila dos líneas de caligrafía. Aquí el nombre ya es la
 * pieza manuscrita y el apellido baja a versalitas espaciadas: dos líneas de script seguidas
 * compiten entre ellas, y con un nombre largo —«Valentina Sofía / Robles Cámara»— la segunda
 * línea se come el ancho del marco y descuadra el eje. En versalitas cabe siempre.
 */
export function HeroFramed({ content }: HeroVariantProps) {
  const parts = eventDateParts(content.startsAt);
  /* El corazón viene del vocabulario común y no de un `import` de la librería de iconos: es la
     única frontera con lucide (`shared/block-icons.ts`) y saltársela por un dibujo decorativo es
     como se acaba con dos juegos de iconos en la misma invitación. */
  const HeartMark = blockIconComponent('heart');

  return (
    <section
      data-block="hero"
      data-variant="framed"
      className="relative isolate flex min-h-[var(--inv-viewport,100svh)] w-full flex-col items-center justify-center overflow-hidden bg-inv-bg px-6 py-16 font-inv-body text-inv-ink sm:px-10 sm:py-20"
    >
      {/*
        La marca de agua botánica de la esquina. Dos, opuestas, y muy apagadas: es lo que hace que
        el papel no se lea como un fondo plano. Van fuera del flujo y recortadas por la sección, así
        que asoman por el canto como una guirnalda impresa que se sale del troquel.
      */}
      <LeafSprig className="absolute -top-6 -left-16 h-24 w-[16rem] -rotate-[14deg] text-inv-primary opacity-20 sm:-left-10 sm:h-32 sm:w-[22rem]" />
      <LeafSprig className="absolute -right-16 -bottom-6 h-24 w-[16rem] rotate-[166deg] text-inv-primary opacity-15 sm:-right-10 sm:h-32 sm:w-[22rem]" />

      <div className="inv-rise relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        {content.intro && (
          <p className="m-0 max-w-xs text-[10.5px] leading-relaxed tracking-[0.3em] text-inv-ink-soft uppercase sm:max-w-sm sm:text-[11px]">
            {content.intro}
          </p>
        )}

        {content.eventTypeLabel && (
          <h1 className="mt-5 mb-0 font-inv-display text-[clamp(1.55rem,7vw,2.6rem)] leading-[1.1] font-light tracking-[0.14em] text-inv-primary uppercase">
            {content.eventTypeLabel}
          </h1>
        )}

        {content.image ? (
          /*
            El marco: la foto y un filete separado de ella. El filete va en un elemento aparte con
            `-inset-2` en lugar de como borde de la propia caja, y esa separación es todo el gesto
            —un borde pegado al canto de la foto se lee como el marco de una interfaz; despegado,
            como el filete impreso alrededor de una lámina—. El relleno de la sección (24px) es lo
            que garantiza que los 8px del filete no se salgan por los lados en un móvil.
          */
          <figure className="relative m-0 mt-9 w-full max-w-[19rem] sm:max-w-sm">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-2 border border-inv-accent/45"
            />

            <div className="relative aspect-[4/5] w-full overflow-hidden bg-inv-primary/5">
              <BlockImage
                image={content.image}
                priority
                sizes="(min-width: 640px) 24rem, 80vw"
                /* `object-top`: en un retrato la cara está arriba, y es lo último que puede
                   recortarse cuando la caja se estrecha. */
                className="object-top"
              />
            </div>
          </figure>
        ) : (
          /* Sin fotografía no queda un hueco ni un marco vacío —un marco vacío se ve como una
             imagen que no cargó—: queda la ramita, que es el ornamento que la portada ya usa. */
          <LeafSprig className="mt-9 h-8 w-40 text-inv-accent opacity-70" />
        )}

        <HeartMark
          size={18}
          strokeWidth={1.5}
          aria-hidden="true"
          className="mt-8 text-inv-accent"
        />

        {/*
          El nombre en manuscrita, que es lo que convierte la portada en una invitación de alguien
          y no en la ficha de un evento. La `script` la decide el tema: en «corporate» apunta a un
          palo seco y la misma portada sale sobria sin tocar este archivo.
        */}
        <p className="mt-3 mb-0 font-inv-script text-[clamp(2.6rem,13vw,4.4rem)] leading-[0.95] text-inv-primary">
          {content.celebrantName}
        </p>

        {content.celebrantLastName && (
          <p className="mt-3 mb-0 text-[11px] tracking-[0.32em] text-inv-ink-soft uppercase">
            {content.celebrantLastName}
          </p>
        )}

        {content.tagline && (
          <p className="mt-7 mb-0 max-w-sm text-[14.5px] leading-relaxed text-inv-ink-soft">
            {content.tagline}
          </p>
        )}

        {/*
          La fecha, en una línea y discreta. En esta plantilla el bloque de calendario es el que
          la enseña en grande, y repetirla aquí con el mismo peso dejaría dos fechas compitiendo en
          las dos primeras pantallas. Discreta **pero presente**: la variante no puede dar por
          hecho que la invitación lleva calendario, porque el bloque se puede quitar.

          Se pinta `dateLabel` —la frase que el organizador escribió— y las piezas de `startsAt`
          solo se usan para la hora, que esa frase no siempre trae.
        */}
        <p className="mt-8 mb-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11.5px] tracking-[0.24em] text-inv-ink uppercase">
          <DateOrnament />
          {content.dateLabel}
          {parts?.time && <span className="tabular-nums">· {parts.time}</span>}
          <DateOrnament />
        </p>

        {content.city && (
          <p className="mt-3 mb-0 text-[12.5px] tracking-[0.12em] text-inv-ink-soft">
            {content.city}
          </p>
        )}

        {/* Grabada: cifra, filete y versalita, sin caja. Es la portada de `botanical`, donde todo
            —la lámina, el calendario del mes, la confirmación— imita papelería impresa, y una
            fila de cajas con desenfoque era lo único de la plantilla que se veía como interfaz. */}
        {content.showCountdown && (
          <Countdown
            startsAt={content.startsAt}
            variant="engraved"
            tone="onSurface"
            className="mt-9"
          />
        )}
      </div>
      <ScrollHint tone="onSurface" />
    </section>
  );
}

/**
 * El filete que flanquea la fecha, o nada.
 *
 * Nada en el teléfono, y no por ahorrar adorno: «sábado 12 de junio, 2027 · 17:00» en versalitas
 * con 0.24em de tracking mide casi el ancho útil de un móvil, y con un ornamento a cada lado la
 * línea no cabe. Lo que hacía entonces el navegador era **comprimirlos**, porque un
 * `inline-flex` sin `shrink-0` cede ancho antes que el texto: al de la izquierda le quedaba medio
 * filete y al de la derecha ni eso. Dos adornos que deberían ser espejo salían distintos, que se
 * lee como un defecto de maquetación y no como una decisión.
 *
 * Así que por debajo de `sm` no hay ninguno —cero es simétrico— y desde `sm` van los dos enteros,
 * con `shrink-0` para que ninguna línea larga vuelva a estrujarlos.
 *
 * El `hidden` va en esta envoltura y no en el propio `BlockOrnament`: `.inv-ornament` declara su
 * `display` en `globals.css` fuera de toda `@layer`, así que le gana a cualquier utilidad de
 * Tailwind y un `hidden` puesto ahí no haría nada.
 */
function DateOrnament() {
  return (
    <span aria-hidden="true" className="hidden shrink-0 sm:block">
      <BlockOrnament className="text-inv-accent" />
    </span>
  );
}
