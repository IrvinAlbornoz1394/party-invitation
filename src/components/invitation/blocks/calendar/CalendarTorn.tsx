import clsx from 'clsx';
import { eventWeek } from '@/domain/invitation/month-grid';
import { requireDesignAsset } from '@/lib/design-assets';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { DesignAsset } from '../../shared/DesignAsset';
import { hasText } from '../../shared/has-text';
import type { CalendarVariantProps } from './calendar-variant';

const HEART = requireDesignAsset('symbol-heart-solid-001');

/*
 * Los dos cantos rotos de la tarjeta, como `clip-path`.
 *
 * Son dos y no uno porque un papel rasgado tiene **dos** bordes: el de la hoja, más claro, donde
 * la fibra se deshilacha, y el de la tinta del papel, un poco más adentro y con otros dientes. Si
 * los dos siguieran el mismo trazo el canto se leería como un borde troquelado.
 *
 * Los dientes están puestos a mano y sin ritmo, por lo mismo que `TornEdge`: los picos regulares
 * se leen como un zigzag decorativo. En porcentaje y no en píxeles porque la tarjeta cambia de
 * ancho; con ~20 rem de ancho y ~12 de alto, un 3 % son 6-8 px de rasgadura, que es lo que mide
 * un papel roto con los dedos.
 */
const RIM = `polygon(0% 3%, 5% 0.5%, 9% 2.5%, 14% 0%, 20% 3%, 26% 1%, 31% 2.8%, 37% 0.4%, 44% 2.2%,
  50% 0%, 56% 2.6%, 62% 0.8%, 69% 3%, 75% 0.6%, 81% 2.4%, 87% 0%, 93% 2.2%, 100% 0.8%,
  98.6% 9%, 100% 18%, 98.2% 28%, 99.6% 39%, 98.4% 50%, 100% 61%, 98.8% 72%, 99.8% 83%, 98.4% 92%,
  100% 99%, 94% 97.4%, 88% 100%, 82% 97.6%, 76% 99.4%, 69% 97.2%, 63% 100%, 57% 97.8%, 50% 99.6%,
  44% 97.4%, 38% 99.8%, 31% 97.6%, 25% 100%, 18% 97.2%, 12% 99.4%, 6% 97.8%, 0% 100%, 1.4% 90%,
  0% 80%, 1.6% 69%, 0.2% 58%, 1.8% 47%, 0% 36%, 1.2% 25%, 0.2% 14%)`;

const PAPER = `polygon(0% 4%, 6% 1%, 12% 5%, 17% 2%, 24% 6%, 30% 1.5%, 35% 4.5%, 42% 0.5%, 48% 5%,
  55% 2%, 61% 6%, 67% 1%, 73% 4%, 80% 0%, 86% 5%, 92% 1.5%, 100% 4.5%, 97% 12%, 100% 22%,
  96.5% 33%, 99% 45%, 96% 56%, 99.5% 68%, 97% 79%, 100% 90%, 97.5% 97%, 92% 100%, 86% 96%, 79% 99%,
  72% 95.5%, 66% 99.5%, 59% 96%, 52% 100%, 45% 95.5%, 39% 99%, 32% 96.5%, 26% 100%, 19% 95%,
  13% 99%, 7% 96%, 0% 99%, 3% 88%, 0% 77%, 3.5% 65%, 0.5% 53%, 3% 41%, 0% 29%, 2.5% 17%)`;

/**
 * `calendar.torn` — la semana del evento en un trozo de papel rasgado, un poco girado y apoyado
 * sobre la página: el mes a pincel arriba, las iniciales de los días, los siete números y el día
 * señalado dentro de un corazón macizo.
 *
 * Es el calendario de `scrapbook`, tal cual lo trae la referencia. Comparte la pregunta con
 * `calendar.week` —**la semana real**, con el día donde cae, para saber si es fin de semana— y
 * la cuenta con ella (`eventWeek`, en el dominio); lo que cambia es el soporte. Aquella rotula
 * el mes a cuerpo de cartel sobre la página; esta lo escribe a mano en un papel que alguien
 * arrancó de una agenda y pegó en el álbum, porque en un álbum nada está impreso en la hoja.
 *
 * ## El corazón no es `dayMark`
 *
 * El contenido deja elegir la marca del día (corazón, disco, anillo), y esta variante la ignora:
 * el corazón macizo con el número en claro **es** la variante, igual que el papel roto. Un disco
 * aquí sería otro calendario, y para eso están los demás.
 *
 * ## Sombra sin `box-shadow`
 *
 * El `clip-path` que rasga el papel recorta también su sombra, así que la sombra va en un
 * `drop-shadow` del envoltorio, que se calcula sobre la forma ya recortada: sigue los dientes del
 * canto en lugar de dibujar un rectángulo detrás.
 */
export function CalendarTorn({ content }: CalendarVariantProps) {
  const week = eventWeek(content.startsAt, content.weekStartsOn);
  const hasHeading = hasText(content.eyebrow) || hasText(content.title);

  return (
    <BlockSection block="calendar" variant="torn">
      <BlockContainer className="max-w-md text-center">
        {hasText(content.eyebrow) && (
          <p className="m-0 text-[10.5px] tracking-[0.28em] text-inv-accent uppercase">
            {content.eyebrow}
          </p>
        )}
        {hasText(content.title) && (
          <h2
            className={clsx(
              'mb-0 font-inv-script text-[clamp(2.2rem,10vw,3rem)] leading-[1.15] font-normal text-inv-ink',
              hasText(content.eyebrow) ? 'mt-3' : 'mt-0',
            )}
          >
            {content.title}
          </h2>
        )}

        {/* La fecha completa, para quien escucha: siete números sueltos bajo unas iniciales no
            dicen «el sábado 27 de junio». */}
        <p className="sr-only">{content.dateLabel}</p>

        {week ? (
          <>
            <div
              aria-hidden="true"
              className={clsx(
                'mx-auto w-[min(88vw,22rem)] rotate-[-2deg] drop-shadow-lg drop-shadow-inv-ink/15',
                hasHeading ? 'mt-9' : 'mt-0',
              )}
            >
              <div className="relative bg-inv-surface px-5 pt-6 pb-7 sm:px-7" style={{ clipPath: RIM }}>
                <div className="absolute inset-1.5 bg-inv-ink/[0.06]" style={{ clipPath: PAPER }} />

                <div className="relative">
                  <p className="m-0 font-inv-script text-[clamp(1.9rem,8.5vw,2.4rem)] leading-[1.15] text-inv-primary">
                    {week.monthLabel}
                  </p>

                  {/* Casillas de ancho fijo: las iniciales caen a plomo sobre sus números aunque
                      un «31» sea más ancho que un «1». */}
                  <div className="mt-3 flex justify-center gap-x-0.5 sm:gap-x-1.5">
                    {week.days.map((cell, index) => (
                      // El índice como clave: hay dos «M», martes y miércoles.
                      <span
                        key={index}
                        className="w-9 text-[11px] tracking-[0.12em] text-inv-ink-soft uppercase sm:w-10"
                      >
                        {cell.initial}
                      </span>
                    ))}
                  </div>

                  <div className="mt-2 flex justify-center gap-x-0.5 sm:gap-x-1.5">
                    {week.days.map((cell, index) => (
                      <span
                        key={index}
                        className="relative flex h-11 w-9 items-center justify-center text-[15px] tabular-nums sm:w-10 sm:text-[16px]"
                      >
                        {cell.isEvent && (
                          <DesignAsset
                            asset={HEART}
                            rotate={-6}
                            className="absolute top-1/2 left-1/2 w-11 -translate-x-1/2 -translate-y-1/2 text-inv-primary"
                          />
                        )}
                        <span
                          className={clsx(
                            'relative',
                            /* El número sube un poco: el centro visual de un corazón está por
                               encima del de su caja, porque la punta de abajo pesa poco. */
                            cell.isEvent ? '-mt-1 font-medium text-inv-on-primary' : 'text-inv-ink',
                          )}
                        >
                          {cell.day}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-7 mb-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-inv-display text-[clamp(1.1rem,4.8vw,1.3rem)] text-inv-primary italic">
              <span className="tabular-nums">{week.year}</span>
              {hasText(content.timeLabel) && (
                <>
                  <span aria-hidden="true" className="opacity-50">
                    ·
                  </span>
                  <span className="tabular-nums">{content.timeLabel}</span>
                </>
              )}
            </p>
          </>
        ) : (
          /* Sin semana que componer, la frase del organizador: es lo que tiene que verse en una
             invitación ya repartida. */
          <p
            className={clsx(
              'mb-0 font-inv-display text-[clamp(1.4rem,5vw,1.9rem)] leading-tight text-inv-primary italic',
              hasHeading ? 'mt-6' : 'mt-0',
            )}
          >
            {content.dateLabel}
            {hasText(content.timeLabel) && <span className="block mt-1 text-[0.8em]">{content.timeLabel}</span>}
          </p>
        )}

        {hasText(content.note) && (
          <BlockNote note={content.note} className="mx-auto mt-8 max-w-sm text-center" />
        )}
      </BlockContainer>
    </BlockSection>
  );
}
