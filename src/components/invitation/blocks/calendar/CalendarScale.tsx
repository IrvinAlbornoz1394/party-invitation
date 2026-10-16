import clsx from 'clsx';
import { monthSpan } from '@/domain/invitation/month-grid';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { DayMarkShape } from './calendar-parts';
import type { CalendarVariantProps } from './calendar-variant';

/**
 * `calendar.scale` — el mes como una **escala graduada**: un filete con una marca por día, los
 * cortes largos cada cinco, y el día del evento señalado con una bandera que cuelga sobre el eje.
 *
 * Es la quinta variante del bloque y la primera que no reparte el mes en casillas. Las cuatro
 * anteriores contestan cada una a una pregunta y esta contesta a la que ninguna podía:
 *
 *   `month`  el mes entero en una lámina de color. «¿Cómo se reparte el mes?»
 *   `sheet`  tres días antes y tres después. «¿Cuándo es, más o menos?»
 *   `week`   la semana real, rotulada. «¿Cae en fin de semana?»
 *   `band`   la fecha como dato tipográfico, sin retícula. «¿Qué día es?», leído desde lejos.
 *   `scale`  **por dónde va el mes**. Se ve de un vistazo que el día cae al principio, a mitad o
 *            al final, que es lo que uno quiere saber cuando calcula si le queda tiempo.
 *
 * ## Por qué esta y no otra retícula para `editorial`
 *
 * Porque el lenguaje de esa estructura es el de una revista, y una revista no pega un calendario
 * de pared en la página: **dibuja un gráfico**. La escala es exactamente eso —el recurso con el
 * que un pliego cuenta una magnitud: un eje, sus cortes, un folio en cada extremo y un pie que
 * explica la marca—, y por eso se compone con las mismas piezas que la galería de esa plantilla:
 * filete de un píxel, folios en cifras de dos dígitos y versalitas espaciadas.
 *
 * Una retícula de siete columnas habría sido la quinta manera de dibujar lo mismo que ya hacen
 * tres; esto es una pieza que el bloque no tenía.
 *
 * ## El reparto es el de una recta, y por eso lo hace la variante
 *
 * `monthSpan` da la longitud del mes y el día, no la fracción: en una recta los extremos son dos
 * —el día 1 al principio y el último al final—, así que el reparto es entre `longitud − 1`
 * tramos. En la esfera de `calendar.dial` es entre `longitud`, porque allí el principio y el
 * final son el mismo punto. Un solo número en el dominio estaría mal en una de las dos.
 *
 * ## La bandera se ancla al canto cuando el día cae en un extremo
 *
 * Centrada siempre, un evento el día 1 o el 30 dejaría la mitad del rótulo fuera de la caja. Los
 * dos primeros días alinean la bandera por su izquierda y los dos últimos por su derecha; el
 * tallo, en cambio, no se mueve nunca: va sobre la marca exacta, que es lo que ata el rótulo a su
 * día. Sin esa separación —caja desplazada, tallo quieto— el ajuste de los extremos mentiría
 * sobre qué día está señalado.
 *
 * ## Accesibilidad: la escala es decorativa
 *
 * Como en las otras cuatro. Quien escucha la página oye la frase que escribió el organizador
 * (`dateLabel`), no treinta marcas y dos folios.
 */
export function CalendarScale({ content }: CalendarVariantProps) {
  const span = monthSpan(content.startsAt);

  /* La posición del día en el eje, de 0 a 1. Ver la cabecera: el reparto de una recta. */
  const at = span ? (span.day - 1) / (span.length - 1) : 0;

  return (
    <BlockSection block="calendar" variant="scale">
      <BlockContainer className="max-w-3xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          /* Sin título propio, el nombre del mes: es el rótulo del eje, y pedirlo escrito a mano
             sería pedir un dato que ya está en `startsAt`. Es lo mismo que hace `calendar.month`. */
          title={hasText(content.title) ? content.title : (span ? `${span.monthLabel} ${span.year}` : content.dateLabel)}
        />

        {/* La fecha completa, para quien escucha. Ver la cabecera. */}
        <p className="sr-only">{content.dateLabel}</p>

        {span ? (
          /* El aire de arriba es el de la bandera: cuelga por encima del eje con `bottom-full`,
             así que sale del flujo y no empuja nada. */
          <div aria-hidden="true" className="mt-24 sm:mt-28">
            <div className="relative">
              {/*
                La bandera. El envoltorio no tiene ancho —`w-0`— a propósito: así su borde
                izquierdo **es** la marca del día, y el rótulo puede desbordarlo hacia el lado que
                convenga sin arrastrar consigo el tallo.
              */}
              <div className="absolute bottom-full w-0" style={{ left: `${at * 100}%` }}>
                <div
                  className={clsx(
                    'mb-3 flex w-max flex-col gap-2 pb-1',
                    /* Las tres ramas escriben su propio `items-*`, y ninguna se apoya en una
                       alineación por defecto de la clase base: dos utilidades del mismo grupo en
                       el atributo las resuelve el orden de la hoja de Tailwind, no el del `clsx`.
                       Es el mismo motivo por el que `BlockSection` usa `twMerge`. */
                    at < 0.08
                      ? 'items-start'
                      : at > 0.92
                        ? 'items-end -translate-x-full'
                        : 'items-center -translate-x-1/2',
                  )}
                >
                  {/*
                    La cifra, con la marca del día detrás. Es la misma pieza que en las otras
                    cuatro variantes (`calendar-parts.tsx`): el corazón, el disco o el aro los
                    elige el organizador, y si cada calendario dibujara el suyo, cambiar de
                    variante en el panel le cambiaría también la forma que ya había elegido.
                  */}
                  <span className="relative flex size-11 items-center justify-center">
                    <DayMarkShape mark={content.dayMark} className="size-11" />
                    <span className="relative font-inv-display text-[1.45rem] leading-none text-inv-ink tabular-nums">
                      {span.day}
                    </span>
                  </span>

                  {/* El pie de la marca, en versalitas y con la hora detrás del punto: la misma
                      composición que los pies de foto de `gallery.editorial`. */}
                  <span className="text-[10px] tracking-[0.24em] whitespace-nowrap text-inv-ink-soft uppercase">
                    {span.weekday}
                    {hasText(content.timeLabel) && (
                      <>
                        <span className="mx-2 opacity-50">·</span>
                        <span className="tabular-nums">{content.timeLabel}</span>
                      </>
                    )}
                  </span>
                </div>

                {/* El tallo, sobre la marca exacta y no sobre el rótulo. Ver la cabecera. */}
                <span className="absolute bottom-0 left-0 block h-5 w-px bg-inv-accent" />
              </div>

              {/*
                El eje. Las marcas van absolutas y no en una fila flexible: con celdas, la que
                llevara un folio dentro sería más ancha que sus vecinas —el contenido impone su
                mínimo— y la escala dejaría de estar graduada por la mitad. Absolutas, cada marca
                cae en su fracción exacta y la caja no se entera.
              */}
              <div className="relative h-4 border-t border-inv-line">
                {Array.from({ length: span.length }, (_, index) => {
                  const day = index + 1;

                  return (
                    <span
                      key={day}
                      className={clsx(
                        'absolute top-0 block w-px -translate-x-1/2',
                        day === span.day
                          ? 'h-4 bg-inv-accent'
                          : day % 5 === 0
                            ? 'h-2.5 bg-inv-ink-soft/70'
                            : 'h-1.5 bg-inv-line',
                      )}
                      style={{ left: `${(index / (span.length - 1)) * 100}%` }}
                    />
                  );
                })}
              </div>

              {/*
                Los folios de los extremos, alineados con los cantos de la caja y no centrados
                bajo su marca: el primero y el último son los únicos que no caben centrados —se
                saldrían medio dígito— y así además hacen de pie del eje, que es como se rotula un
                gráfico impreso. Dos dígitos siempre, como los folios de la galería.
              */}
              <div className="mt-2 flex items-baseline justify-between font-inv-display text-[12px] text-inv-accent tabular-nums">
                <span>01</span>
                <span>{span.length}</span>
              </div>
            </div>
          </div>
        ) : (
          /*
            Sin escala que graduar —una fecha que no se deja leer—, la frase del organizador en
            grande, salvo que ya sea el título: sin título propio el respaldo del encabezado **es**
            `dateLabel`, y repetirla dejaría la misma línea dos veces seguidas.
          */
          hasText(content.title) && (
            <p className="mt-10 mb-0 font-inv-display text-[clamp(1.6rem,5vw,2.4rem)] leading-tight font-light text-inv-primary">
              {content.dateLabel}
            </p>
          )
        )}

        {hasText(content.note) && <BlockNote note={content.note} className="mt-12 max-w-md" />}
      </BlockContainer>
    </BlockSection>
  );
}
