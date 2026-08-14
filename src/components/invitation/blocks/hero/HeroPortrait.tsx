import type { CSSProperties } from 'react';
import clsx from 'clsx';
import { eventDateParts, type EventDateParts } from '@/domain/invitation/event-date';
import { ActionLink } from '../../shared/ActionLink';
import { BlockImage } from '../../shared/BlockImage';
import { Countdown } from '../../shared/Countdown';
import type { HeroVariantProps } from './hero-variant';

/**
 * `hero.portrait` — el retrato se deshace en el papel y el nombre nace de ahí.
 *
 * Las otras tres portadas ponen el texto **sobre** la fotografía y la velan para que se lea.
 * Esta hace lo contrario: la foto ocupa la mitad de arriba y se desvanece hacia abajo hasta ser
 * el fondo del tema, y el texto empieza justo en ese desvanecido. No hay velo, no hay recuadro
 * y no hay corte — la imagen y la papelería son la misma superficie. Es la composición de las
 * invitaciones de estudio: el vestido, la sotana o el ramo se disuelven en el papel y sobre ese
 * blanco va la caligrafía.
 *
 * ## Sirve igual para unos XV que para una boda
 *
 * Y no por una condición: porque nada aquí sabe de qué evento se trata. Lo que cambia el
 * registro son tres campos del contenido —`eventTypeLabel` («Mis XV años» o «Nuestra boda»),
 * el nombre y el apellido— y el tema que la viste. Con «Dayana / Geraldín» se lee como unos XV;
 * con «Ana & Diego» y el apellido a `null`, como una participación de boda. Si esta variante
 * preguntara por el tipo de evento sería una plantilla disfrazada de componente, y el catálogo
 * tendría que duplicarla para cada tipo.
 *
 * ## El desvanecido
 *
 * Es una máscara (`inv-dissolve`), no un degradado encima. La diferencia importa: un degradado
 * del color del papel sobre la foto solo funciona si el papel es el que el degradado tiene
 * escrito, y con seis temas —uno de ellos oscuro— habría que pintarlo del color del tema y
 * confiar en que coincida exactamente con el fondo. La máscara recorta la propia imagen, así
 * que lo que aparece debajo **es** el fondo del tema, sea cual sea, y la costura no existe.
 *
 * ## Por qué la fecha va partida y no en una línea
 *
 * Porque es el gesto de papelería de esta portada: el día en grande en el centro, con el día de
 * la semana y la hora a un lado y el mes y el año al otro, separados por filetes. Las piezas
 * salen de `startsAt` —ver `domain/invitation/event-date.ts`, que explica por qué de la cadena
 * y no de un `Date`—, y `dateLabel` sigue siendo lo que se lee en voz alta: la retícula es
 * decorativa para los lectores de pantalla y la frase del organizador va delante, entera. Si la
 * fecha no se deja partir, se pinta esa misma frase y la portada no se entera.
 */
export function HeroPortrait({ content }: HeroVariantProps) {
  const parts = eventDateParts(content.startsAt);

  return (
    <section
      data-block="hero"
      data-variant="portrait"
      className="relative isolate flex min-h-[var(--inv-viewport,100svh)] w-full flex-col overflow-hidden bg-inv-bg font-inv-body text-inv-ink"
    >
      {/*
        La caja de la fotografía mide en función del alto del bloque y no en `svh` a secas: en la
        previsualización del panel «pantalla completa» son 560px y no el monitor, y `--inv-viewport`
        es lo que lleva ese dato. Con `svh` fijo, el retrato se saldría del recuadro del panel.
      */}
      <div
        aria-hidden={content.image ? undefined : 'true'}
        className={clsx(
          'pointer-events-none relative -z-10 w-full shrink-0',
          content.image
            ? 'h-[calc(var(--inv-viewport,100svh)*0.54)] min-h-[240px]'
            : 'h-[calc(var(--inv-viewport,100svh)*0.14)]',
        )}
      >
        {content.image ? (
          /* `object-top`: en un retrato la cara está arriba, y es lo último que puede recortarse
             cuando la caja se estrecha en un móvil. */
          <BlockImage image={content.image} priority className="inv-dissolve object-top" />
        ) : (
          /* Sin fotografía queda un aliento de color en lugar de un borde seco: una invitación
             recién creada tiene que verse presentable antes de que suban nada. */
          <div className="absolute inset-0 bg-linear-to-b from-inv-primary/10 to-transparent" />
        )}
      </div>

      <PetalDrift />

      {/*
        El margen negativo es lo que mete el rótulo dentro del desvanecido: sin él, el texto
        empezaría por debajo de la foto y se leerían dos piezas pegadas en vez de una sola.
      */}
      <div className="inv-rise relative z-10 mx-auto -mt-[clamp(2.5rem,9vw,5rem)] flex w-full max-w-2xl flex-col items-center px-6 pb-14 text-center sm:px-10 sm:pb-20">
        {content.intro && (
          <p className="m-0 max-w-sm text-[11px] leading-relaxed tracking-[0.24em] text-inv-ink-soft uppercase">
            {content.intro}
          </p>
        )}

        {content.eventTypeLabel && (
          <p className="mt-4 mb-0 font-inv-script text-[clamp(1.4rem,5.5vw,2rem)] leading-none text-inv-accent">
            {content.eventTypeLabel}
          </p>
        )}

        {/*
          El nombre en manuscrita y a dos líneas, que es lo que hace de esta portada un retrato y
          no una ficha. La `script` del tema decide la letra: en «corporate» apunta a un palo seco
          y la misma portada sale sobria sin tocar este archivo.
        */}
        <h1 className="mt-3 mb-0 font-inv-script text-[clamp(3.25rem,17vw,7rem)] leading-[0.86] font-normal text-inv-primary">
          {content.celebrantName}
          {content.celebrantLastName && (
            /* Un pelo más pequeño y desplazado: dos líneas de caligrafía del mismo cuerpo y en
               el mismo eje se leen como un bloque de texto, no como una firma. */
            <span className="mt-2 block translate-x-[0.06em] text-[0.78em]">
              {content.celebrantLastName}
            </span>
          )}
        </h1>

        {content.tagline && (
          <p className="mt-6 mb-0 max-w-md text-[15px] leading-relaxed text-inv-ink-soft">
            {content.tagline}
          </p>
        )}

        <EventDate parts={parts} label={content.dateLabel} />

        {content.city && (
          <p className="mt-6 mb-0 max-w-sm text-[13px] leading-relaxed tracking-[0.08em] text-inv-ink-soft">
            {content.city}
          </p>
        )}

        {content.showCountdown && (
          <Countdown startsAt={content.startsAt} tone="onSurface" className="mt-9" />
        )}

        {content.action && (
          <ActionLink
            label={content.action.label}
            href={content.action.href}
            tone="onSurface"
            className="mt-9"
          />
        )}
      </div>
    </section>
  );
}

/**
 * La fecha: la frase completa para quien escucha, la retícula para quien mira.
 *
 * Las dos cosas a la vez y no una elegida. El `sr-only` lleva `dateLabel` tal como se escribió
 * —«Sábado 26 de diciembre, 2026»—, que es lo que un lector de pantalla debe anunciar; la
 * retícula va marcada como decorativa porque leída en voz alta sería «sábado, 09:00, 26,
 * diciembre, 2026», cinco fragmentos sueltos que hay que recomponer de memoria.
 */
function EventDate({ parts, label }: { readonly parts: EventDateParts | null; readonly label: string }) {
  if (!parts) {
    return (
      <p className="mt-8 mb-0 text-[13px] tracking-[0.22em] text-inv-ink-soft uppercase">{label}</p>
    );
  }

  return (
    <div className="mt-8 w-full max-w-sm">
      <p className="sr-only">{label}</p>

      <div
        aria-hidden="true"
        className="grid grid-cols-[1fr_auto_1fr] items-center justify-items-center gap-x-4 sm:gap-x-6"
      >
        <DateColumn top={parts.weekday} bottom={parts.time} />

        {/* Los filetes verticales son los bordes de la cifra, no dos elementos aparte: así miden
            exactamente lo que mide el día y crecen con él al cambiar el cuerpo de la tipografía. */}
        <span className="border-x border-inv-line px-4 font-inv-display text-[clamp(2.5rem,11vw,3.75rem)] leading-none font-light tabular-nums sm:px-6">
          {parts.day}
        </span>

        <DateColumn top={parts.month} bottom={parts.year} />
      </div>
    </div>
  );
}

/** Una de las dos columnas laterales de la fecha: rótulo, filete y dato. */
function DateColumn({ top, bottom }: { readonly top: string; readonly bottom: string | null }) {
  return (
    <span className="flex w-full min-w-0 flex-col items-center gap-1.5">
      <span className="text-[clamp(0.6rem,2.7vw,0.72rem)] tracking-[0.2em] uppercase">{top}</span>
      {/* Sin hora —una fecha guardada sin ella— la columna se queda en el rótulo: un filete
          suelto debajo de nada se lee como un dato que falta. */}
      {bottom && (
        <>
          <span className="h-px w-full max-w-28 bg-inv-line" />
          <span className="text-[clamp(0.7rem,3vw,0.85rem)] tracking-[0.12em] text-inv-ink-soft tabular-nums">
            {bottom}
          </span>
        </>
      )}
    </span>
  );
}

/**
 * Los pétalos suspendidos: el aire de la portada.
 *
 * Flotan en el sitio en lugar de caer, y es una decisión de robustez además de de gusto. Una
 * caída tiene que recorrer el alto del bloque, y ese alto cambia —pantalla completa en el móvil,
 * 560px en la previsualización del panel—: en el recuadro pequeño los pétalos pasarían de largo
 * y la mayor parte del tiempo no habría ninguno. Un balanceo corto se ve igual mida lo que mida.
 *
 * El color es `accent`, así que son los del tema y no unos rosas escritos a mano. Cada uno lleva
 * su duración y su desfase para que no laten a la vez, que es lo que delata una animación de CSS.
 */
function PetalDrift() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {PETALS.map((petal, index) => (
        <span
          key={index}
          className="inv-float absolute block rounded-[0_100%_0_100%] bg-inv-accent"
          style={
            {
              left: petal.left,
              top: petal.top,
              width: `${petal.size}px`,
              height: `${petal.size}px`,
              opacity: petal.opacity,
              filter: petal.size > 20 ? 'blur(0.5px)' : undefined,
              '--inv-float-duration': petal.duration,
              '--inv-float-delay': petal.delay,
              '--inv-float-x': petal.x,
              '--inv-float-y': petal.y,
              '--inv-float-tilt': petal.tilt,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/**
 * Siete pétalos, colocados a mano.
 *
 * A mano y no al azar por dos razones: `Math.random()` en el render daría una posición en el
 * servidor y otra en el cliente —y React avisaría del desajuste—, y sobre todo porque una
 * distribución aleatoria acaba amontonando tres en una esquina. Están repartidos por los bordes,
 * lejos del eje central: por el medio baja el nombre, y un pétalo detrás de la caligrafía la
 * ensucia.
 */
const PETALS = [
  { left: '7%', top: '10%', size: 22, opacity: 0.5, duration: '15s', delay: '0s', x: '10px', y: '-16px', tilt: '12deg' },
  { left: '86%', top: '16%', size: 16, opacity: 0.42, duration: '19s', delay: '-4s', x: '-12px', y: '-12px', tilt: '-24deg' },
  { left: '15%', top: '34%', size: 12, opacity: 0.35, duration: '13s', delay: '-7s', x: '8px', y: '-10px', tilt: '38deg' },
  { left: '91%', top: '42%', size: 26, opacity: 0.28, duration: '22s', delay: '-2s', x: '-9px', y: '-18px', tilt: '-8deg' },
  { left: '4%', top: '62%', size: 14, opacity: 0.3, duration: '17s', delay: '-9s', x: '11px', y: '-13px', tilt: '20deg' },
  { left: '80%', top: '76%', size: 18, opacity: 0.26, duration: '20s', delay: '-5s', x: '-10px', y: '-15px', tilt: '-32deg' },
  { left: '22%', top: '88%', size: 10, opacity: 0.24, duration: '16s', delay: '-11s', x: '7px', y: '-9px', tilt: '16deg' },
] as const;
