import clsx from 'clsx';
import { BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { HexFrame, NocturneHeading } from '../../shared/nocturne-ornaments';
import { Reveal } from '../../shared/Reveal';
import type { ProtagonistsVariantProps } from './protagonists-variant';

/**
 * `protagonists.hexagon` — quiénes celebran, en la composición de `nocturne`: cada persona en el
 * hexágono de filete dorado con sus dos ramos de acuarela, el papel que tiene en oro y en
 * versalitas —«LA NOVIA»—, el nombre en capitulares y sus líneas debajo.
 *
 * Es la sección «the groom / the bride» de la referencia. En el teléfono va una persona por
 * pantalla, que es como se lee un retrato; desde la tableta, de dos en dos. Las de las posiciones
 * impares entran desde el otro lado (los ramos se reflejan), para que una pareja se lea como dos
 * retratos que se miran y no como una ficha repetida.
 *
 * El encabezado es opcional: la referencia no lo lleva, y con una pareja los dos retratos ya dicen
 * de qué va la sección.
 */
export function ProtagonistsHexagon({ content }: ProtagonistsVariantProps) {
  return (
    <BlockSection block="protagonists" variant="hexagon" className="overflow-hidden">
      <div className="mx-auto max-w-4xl px-6">
        <Reveal>
          <NocturneHeading
            eyebrow={content.eyebrow}
            title={content.title}
            subtitle={content.subtitle}
            className="mb-16"
          />
        </Reveal>

        <ul
          className={clsx(
            'm-0 grid list-none gap-y-20 p-0',
            content.people.length > 1 && 'sm:grid-cols-2 sm:gap-x-10',
          )}
        >
          {content.people.map((person, index) => (
            <li key={`${person.name}-${index}`} className="text-center">
              <Reveal delay={index % 2 === 0 ? 0 : 0.12}>
                <HexFrame image={person.image} mirror={index % 2 === 1} />

                {hasText(person.role) && (
                  <p className="mt-10 mb-0 font-inv-display text-[clamp(1rem,4.6vw,1.1rem)] font-bold tracking-[0.04em] text-inv-accent uppercase">
                    {person.role}
                  </p>
                )}
                <h3
                  className={clsx(
                    'mb-0 font-inv-display text-[clamp(1.9rem,9vw,2.4rem)] leading-tight font-normal text-inv-ink',
                    hasText(person.role) ? 'mt-1' : 'mt-10',
                  )}
                >
                  {person.name}
                </h3>
                {hasText(person.bio) && (
                  <p className="mx-auto mt-6 mb-0 max-w-sm text-[16px] leading-[1.75] text-inv-ink-soft">
                    {person.bio}
                  </p>
                )}
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </BlockSection>
  );
}
