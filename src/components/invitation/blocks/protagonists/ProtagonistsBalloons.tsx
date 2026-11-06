import { BlockImage } from '../../shared/BlockImage';
import { BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { Reveal } from '../../shared/Reveal';
import { staggerDelay } from '../../shared/stagger';
import {
  Blob,
  CLAY_TAN,
  Confetti,
  DoodleHearts,
  HeartBalloon,
  Squiggle,
  TerracottaHeading,
} from '../../shared/terracotta-ornaments';
import type { ProtagonistsVariantProps } from './protagonists-variant';

/**
 * `protagonists.balloons` — los novios de `terracota`: cada uno con su foto en el marco abombado,
 * un globo de corazón atado con lazo con su inicial —el «Mrs.» y «Mr.» de la referencia, que aquí
 * sirve a cualquier pareja—, el nombre grande a pincel, el papel en versalitas terracota y sus
 * líneas debajo.
 *
 * Son la cabecera de «The Wedding Party» de la referencia —la novia y el novio en dos columnas—
 * con los globos de «The Happy Couple». En el teléfono, uno debajo del otro; desde tableta, en
 * dos columnas. Con más de dos personas la rejilla sigue en pares.
 *
 * Sin foto, el marco se queda en el color de las líneas con los dos corazones dentro, y el globo
 * sigue en su sitio.
 */
export function ProtagonistsBalloons({ content }: ProtagonistsVariantProps) {
  return (
    <BlockSection block="protagonists" variant="balloons" className="relative isolate overflow-hidden">
      <Blob shape="pebble" className="top-[28rem] -left-32 -z-10 h-64 w-48 text-inv-accent sm:top-24 sm:-left-24" />
      <Blob shape="drop" rotate={-30} className="-right-32 -bottom-10 -z-10 h-56 w-44 text-inv-primary sm:-top-16 sm:-right-24 sm:bottom-auto" />
      <Squiggle className={`top-10 -left-10 -z-10 hidden w-40 lg:block ${CLAY_TAN}`} />

      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <TerracottaHeading eyebrow={content.eyebrow} title={content.title} subtitle={content.subtitle} />
        </Reveal>

        <ul className="m-0 mt-14 grid list-none gap-16 p-0 sm:grid-cols-2 sm:gap-x-10">
          {content.people.map((person, index) => {
            const left = index % 2 === 0;

            return (
              <li key={`${person.name}-${index}`}>
                <Reveal delay={staggerDelay(index, 0.1)} className="flex flex-col items-center text-center">
                  <div className="relative w-full max-w-[24rem]">
                    {index === 0 && <Confetti className="-top-[10%] -left-[6%] z-10 w-[30%]" />}
                    <div className="inv-squircle relative aspect-[4/3] overflow-hidden bg-inv-line">
                      {person.image ? (
                        <BlockImage image={person.image} sizes="(min-width: 640px) 384px, 88vw" />
                      ) : (
                        <div className="grid h-full place-items-center">
                          <DoodleHearts className="w-16 opacity-70" />
                        </div>
                      )}
                    </div>
                    <HeartBalloon
                      letter={person.name.trim().charAt(0).toUpperCase()}
                      tone={left ? 'primary' : 'accent'}
                      className={left ? '-bottom-10 -left-3 w-14 sm:w-16' : '-right-3 -bottom-10 w-14 sm:w-16'}
                      style={{ animationDelay: `${index * 0.3}s` }}
                    />
                  </div>

                  <h3 className="mt-9 mb-0 font-inv-display text-[clamp(2.1rem,9vw,2.8rem)] leading-tight font-normal text-inv-ink">
                    {person.name}
                  </h3>
                  {hasText(person.role) && (
                    <p className="mt-1.5 mb-0 text-[14px] font-semibold tracking-[0.16em] text-inv-primary uppercase">
                      {person.role}
                    </p>
                  )}
                  {hasText(person.bio) && (
                    <p className="mx-auto mt-4 mb-0 max-w-sm text-[16px] leading-relaxed text-inv-ink-soft">
                      {person.bio}
                    </p>
                  )}
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </BlockSection>
  );
}
