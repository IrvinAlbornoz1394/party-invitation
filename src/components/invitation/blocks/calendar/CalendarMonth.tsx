import clsx from 'clsx';
import { monthGrid } from '@/domain/invitation/month-grid';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { TornEdge } from '../../shared/paper-ornaments';
import { DayMarkShape } from './calendar-parts';
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

        {/*
          Aquí había una ramita cerrando la lámina, y se quitó: entre la hora y la nota, con los
          dos cantos rasgados a la vista, era el tercer adorno de la misma franja. La lámina se
          remata sola con el rasgado.

          La nota se queda —un evento real puede llevarla— y arranca de la hora directamente.
        */}
        {content.note && (
          <BlockNote note={content.note} tone="inverse" className="mx-auto mt-9 max-w-sm text-center" />
        )}
      </BlockContainer>
    </BlockSection>
  );
}

