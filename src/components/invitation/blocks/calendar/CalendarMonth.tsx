import clsx from 'clsx';
import type { DayMark } from '@/domain/invitation/blocks/calendar';
import { monthGrid } from '@/domain/invitation/month-grid';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { LeafSprig, TornEdge } from '../../shared/paper-ornaments';
import type { CalendarVariantProps } from './calendar-variant';

/**
 * `calendar.month` — el mes entero en una franja de color, con el día señalado.
 *
 * Es la sección que hace que una fecha se recuerde. «Sábado 12 de junio» se lee y se olvida; el
 * mes completo con una marca en el 12 se **ve**, y quien lo ve calcula solo si cae en puente y si
 * tiene que pedir el viernes. Está en casi toda la papelería de boda impresa y en casi ninguna
 * invitación digital, que es justo lo que la hace valer.
 *
 * ## Por qué va sobre el color del tema y con los cantos rasgados
 *
 * Porque un calendario es una retícula, y una retícula sobre el mismo papel que el resto de la
 * invitación se lee como una tabla de datos. Al cambiar el fondo de la sección entera, la
 * retícula pasa a ser una **lámina** —un trozo de otro papel pegado en medio— y ahí una rejilla
 * de números deja de parecer un formulario. Los cantos rasgados son lo que remata la idea: la
 * franja no empieza con una recta de lado a lado, se rompe.
 *
 * Es el mismo dibujo arriba y abajo, girado media vuelta. Ver `shared/paper-ornaments.tsx` para
 * por qué eso no se nota y en `BlockCurve` sí se habría notado.
 *
 * ## La retícula es decorativa para quien no la ve, y es deliberado
 *
 * El mes va marcado como decorativo y la fecha se anuncia como la frase que el organizador
 * escribió (`dateLabel`, en un `sr-only`). Leídos en voz alta, treinta y un números seguidos no
 * son información: son ruido del que hay que salir para llegar a la siguiente sección. Es la
 * misma decisión que la retícula de fecha de `hero.portrait`, y la que hace que este bloque no
 * empeore la invitación para quien la escucha.
 *
 * ## Si la fecha no se deja partir
 *
 * Se pinta `dateLabel` en grande y no hay calendario. `monthGrid` devuelve `null` en lugar de
 * lanzar —ver `domain/invitation/month-grid.ts`—, así que una fecha guardada en un formato raro
 * cuesta una sección menos bonita y no una invitación en blanco.
 */
export function CalendarMonth({ content }: CalendarVariantProps) {
  const grid = monthGrid(content.startsAt, content.weekStartsOn);

  return (
    <BlockSection
      block="calendar"
      variant="month"
      className="relative isolate bg-inv-primary text-inv-on-primary"
    >
      {/*
        El papel mordiendo la franja por los dos cantos. Se pinta **dentro** de la sección y del
        color del papel, no asomando por fuera: la franja lleva `isolate` y eso la convierte en un
        contexto de apilamiento, así que una figura que sobresaliera quedaría tapada por el fondo
        de la sección siguiente. Es el mismo razonamiento que `shared/BlockCurve.tsx`.
      */}
      <TornEdge className="absolute inset-x-0 top-0 h-5 w-full text-inv-bg sm:h-7" />
      <TornEdge className="absolute inset-x-0 bottom-0 h-5 w-full rotate-180 text-inv-bg sm:h-7" />

      <BlockContainer className="max-w-xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          /* Sin título propio, el nombre del mes. Es lo que hace un calendario de papel, y evita
             pedir un dato —«Junio»— que el sistema ya tiene en `startsAt`. */
          title={content.title ?? (grid ? `${grid.monthLabel} ${grid.year}` : content.dateLabel)}
          align="center"
          tone="inverse"
          titleCase="caps"
        />

        {grid ? (
          <div className="mt-10">
            {/* La frase completa para quien escucha; la retícula, decorativa. Ver la cabecera. */}
            <p className="sr-only">{content.dateLabel}</p>

            <div aria-hidden="true">
              <div className="grid grid-cols-7 text-center text-[10.5px] tracking-[0.16em] uppercase opacity-70">
                {grid.weekdayInitials.map((initial, index) => (
                  // El índice como clave, y aquí es obligatorio: hay dos «M» y dos claves iguales
                  // dejarían a React reconciliando dos columnas distintas como si fueran una.
                  <span key={index} className="py-2">
                    {initial}
                  </span>
                ))}
              </div>

              <div className="mt-1 grid grid-cols-7 gap-y-1 text-center text-[14px] tabular-nums sm:text-[15.5px]">
                {/* Las casillas vacías hasta que el día 1 cae en su columna. */}
                {Array.from({ length: grid.leadingBlanks }, (_, index) => (
                  <span key={`blank-${index}`} />
                ))}

                {grid.days.map((cell) => (
                  <span key={cell.day} className="relative flex h-10 items-center justify-center">
                    {cell.isEvent && <DayMarkShape mark={content.dayMark} />}
                    {/*
                      El número del día señalado se queda en el color de la franja
                      (`onPrimary`), que es la única pareja de contraste que el tema garantiza.
                      La tentación era rellenar la marca de acento y poner el número oscuro
                      encima —como en la papelería impresa—, y no se puede: el acento de un tema
                      puede ser un dorado claro o un azul medio, y no existe un token
                      «color sobre el acento» que diga qué se lee encima. Con la marca
                      translúcida y su contorno, el número sigue leyéndose en los siete temas y
                      el día sigue estando señalado.
                    */}
                    <span className={clsx('relative', cell.isEvent && 'font-medium')}>
                      {cell.day}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /*
            Sin retícula, la fecha se pinta en grande — salvo que ya sea el título. Cuando el
            evento no trae título propio, el respaldo del encabezado **es** `dateLabel`, y
            repetirla aquí dejaría la misma frase dos veces seguidas en la misma franja.
          */
          content.title && (
            <p className="mt-10 mb-0 text-center font-inv-display text-[clamp(1.6rem,5vw,2.4rem)] leading-tight font-light">
              {content.dateLabel}
            </p>
          )
        )}

        {content.timeLabel && (
          <p className="mt-8 mb-0 text-center text-[12px] tracking-[0.26em] uppercase opacity-85">
            {content.timeLabel}
          </p>
        )}

        {/* La ramita cierra la lámina. Va en acento y no en el color del texto: es el único
            elemento de la franja que no es información, y conviene que se lea como tal. */}
        <LeafSprig className="mx-auto mt-9 h-8 w-44 text-inv-accent opacity-90 sm:w-52" />

        {content.note && (
          <BlockNote note={content.note} tone="inverse" className="mx-auto mt-6 max-w-sm text-center" />
        )}
      </BlockContainer>
    </BlockSection>
  );
}

/**
 * La marca del día del evento: corazón, disco o aro.
 *
 * Las tres se dibujan del color de acento, con relleno translúcido y contorno sólido, y las tres
 * miden lo mismo (36px) para que la casilla no cambie de alto según la forma elegida. Van
 * absolutas y centradas con `m-auto`, así que la cifra sigue mandando en la retícula: si la marca
 * ocupara sitio, la fila del día señalado sería más alta que las otras cinco.
 *
 * El corazón es un trazo propio y no el icono del vocabulario común. Los de `block-icons.ts` son
 * dibujos de trazo pensados para un medallón junto a un texto; este va **detrás de una cifra** y
 * necesita controlar relleno y contorno por separado, que es algo que el contrato de aquellos no
 * expone a propósito.
 */
function DayMarkShape({ mark }: { readonly mark: DayMark }) {
  if (mark === 'heart') {
    return (
      <svg
        viewBox="0 0 32 30"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 m-auto size-9 fill-inv-accent/30 stroke-inv-accent"
        strokeWidth="1.2"
      >
        <path d="M16 27.5C16 27.5 2.5 19.4 2.5 11.1 2.5 6.4 6.2 3 10.3 3c2.5 0 4.6 1.3 5.7 3.3C17.1 4.3 19.2 3 21.7 3 25.8 3 29.5 6.4 29.5 11.1c0 8.3-13.5 16.4-13.5 16.4Z" />
      </svg>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={clsx(
        'pointer-events-none absolute inset-0 m-auto size-9 rounded-full border border-inv-accent',
        /* El aro es el mismo círculo sin relleno: la forma sobria, para cuando la franja ya lleva
           bastante color y una mancha más ensucia la retícula. */
        mark === 'disc' && 'bg-inv-accent/30',
      )}
    />
  );
}
