import { CalendarDays, MapPin } from 'lucide-react';
import { BlockImage } from '../../shared/BlockImage';
import { ScrollHint } from '../../shared/ScrollHint';
import { Countdown } from '../../shared/Countdown';
import type { HeroVariantProps } from './hero-variant';

/**
 * `hero.classic` — la portada de siempre: foto a sangre y el nombre apoyado abajo.
 *
 * Es la que se elige por defecto, y por eso es la más conservadora de las tres. La lectura baja
 * en el orden en que se pregunta —qué se celebra, quién, cuándo, dónde, cuánto falta— y todo
 * el contenido se apoya por debajo del centro, donde la fotografía casi siempre tiene menos
 * información: en un retrato, la cara queda arriba y el texto no la tapa.
 *
 * ## Dónde se apoya el texto, y por qué no es `justify-end`
 *
 * Anclado al canto de abajo, **todo** el aire que sobra se acumula arriba: la portada mide una
 * pantalla, el bloque mide lo que mide, y la diferencia se la queda entera el hueco sobre el
 * rótulo. En un móvil no se nota —el contenido llena la pantalla— pero en una ventana alta son
 * doscientos y pico píxeles de fotografía vacía encima del texto y el rótulo arrancando a media
 * altura.
 *
 * Va centrado y el aire se reparte a los dos lados. Que siga leyéndose como una portada apoyada
 * abajo lo hace el **relleno asimétrico**: el de arriba es el doble que el de abajo, así que el
 * bloque queda por debajo del centro sin que el hueco superior crezca sin límite. Y como es
 * relleno y no una posición, se autolimita: cuanto más alto es el contenido, menos aire hay que
 * repartir y más se parece al comportamiento de antes — cuando no cabe, la sección crece
 * (`min-h`, no `h`) y no se recorta nada.
 *
 * ## El velo
 *
 * El degradado sobre la foto no es un efecto: es lo que hace legible el texto encima de una
 * imagen que el organizador sube y que nadie revisó. Va de opaco abajo a casi limpio arriba
 * —y no uniforme— para oscurecer solo donde hay letras y dejar la fotografía intacta donde no.
 * Su color lo pone el tema (`overlay`), así que un tema claro puede velar con marfil en lugar
 * de con negro sin tocar este archivo.
 *
 * ## Sin fotografía
 *
 * `image` es opcional en el contenido, así que la portada tiene que sostenerse sin ella: cae a
 * un fondo del color primario del tema. Es el estado en el que está una invitación recién
 * creada, y verla presentable desde el minuto uno es parte de que el admin la pueda armar.
 */
export function HeroClassic({ content }: HeroVariantProps) {
  return (
    <section
      data-block="hero"
      data-variant="classic"
      className="relative isolate flex min-h-[var(--inv-viewport,100svh)] w-full flex-col justify-center overflow-hidden bg-inv-bg font-inv-body text-inv-on-primary inv-on-photo"
    >
      {content.image ? (
        <>
          <BlockImage image={content.image} priority className="-z-20" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 inv-scrim" data-from="bottom" />
        </>
      ) : (
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-inv-primary" />
      )}

      {/* El relleno de arriba es el doble que el de abajo: es lo único que mantiene el bloque por
          debajo del centro ahora que el aire se reparte. Ver el comentario de la variante. */}
      <div className="inv-rise mx-auto w-full max-w-5xl px-6 pt-28 pb-14 sm:px-10 sm:pt-36 sm:pb-20">
        {content.eventTypeLabel && (
          <p className="m-0 flex items-center gap-3 text-[11px] tracking-[0.32em] uppercase opacity-85">
            {/* El filete acompaña al rótulo en lugar de subrayarlo: marca dónde empieza la
                columna de texto y da un punto de apoyo horizontal a un bloque muy vertical. */}
            <span aria-hidden="true" className="h-px w-8 bg-current opacity-70" />
            {content.eventTypeLabel}
          </p>
        )}

        {content.intro && (
          <p className="mt-6 mb-0 max-w-md text-[15px] leading-relaxed opacity-90">
            {content.intro}
          </p>
        )}

        <h1 className="mt-3 mb-0 font-inv-display text-[clamp(3rem,11vw,6.25rem)] leading-[0.92] font-light">
          {content.celebrantName}
        </h1>

        {content.celebrantLastName && (
          <p className="mt-4 mb-0 text-[13px] tracking-[0.4em] uppercase opacity-85">
            {content.celebrantLastName}
          </p>
        )}

        {content.tagline && (
          <p className="mt-6 mb-0 max-w-xl text-[15px] leading-relaxed opacity-90">
            {content.tagline}
          </p>
        )}

        <p className="mt-8 mb-0 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] tracking-[0.06em]">
          <span className="inline-flex items-center gap-2">
            <CalendarDays size={16} strokeWidth={1.6} aria-hidden="true" />
            {content.dateLabel}
          </span>
          {content.city && (
            <span className="inline-flex items-center gap-2">
              <MapPin size={16} strokeWidth={1.6} aria-hidden="true" />
              {content.city}
            </span>
          )}
        </p>

        {/* Las casillas con velo: es la portada de `cinematic` —la foto a sangre—, y sobre una
            imagen la cuenta regresiva necesita una caja para leerse. Ver `shared/Countdown.tsx`
            para por qué la forma la elige la variante y no el tema. */}
        {content.showCountdown && (
          <Countdown startsAt={content.startsAt} variant="boxes" className="mt-9" />
        )}
      </div>
      <ScrollHint tone="onImage" />
    </section>
  );
}
