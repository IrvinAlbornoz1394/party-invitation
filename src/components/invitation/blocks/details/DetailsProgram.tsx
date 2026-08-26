import { BlockHeading } from '../../shared/BlockHeading';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { blockIconComponent } from '../../shared/block-icons';
import { LeafSprig } from '../../shared/paper-ornaments';
import { TextLink } from '../../shared/TextLink';
import type { DetailsVariantProps } from './details-variant';

/**
 * `details.program` — los detalles como el programa impreso de una ceremonia: el rótulo a la
 * derecha de un filete central y lo que hay que saber a la izquierda del otro lado.
 *
 * Es la quinta variante del bloque y existe porque `botanical` no tenía detalles: al añadírselos no
 * quedaba ninguna libre —las cuatro estaban repartidas una por plantilla— y la regla del catálogo
 * (`assertTemplateVariantsAreExclusive()`, en `scripts/seed.ts`) prohíbe compartirlas entre
 * plantillas del mismo tipo de evento.
 *
 * ## El filete central, que es toda la variante
 *
 * Las otras cuatro apilan `icono → rótulo → texto` de izquierda a derecha, y se diferencian en
 * qué caja los envuelve:
 *
 *   `cards`  cada detalle en su tarjeta, en rejilla.
 *   `list`   una columna, filetes horizontales entre filas.
 *   `split`  el encabezado a un lado, la rejilla de detalles al otro.
 *   `panel`  la misma rejilla sobre una franja del color del tema.
 *
 * Aquí la retícula es otra: **dos columnas contra un filete vertical**, con el rótulo alineado a
 * la derecha —o sea, contra el filete— y la explicación empezando al otro lado. Es la composición
 * de un programa de mano o de una carta de menú, y en el catálogo no la hacía nada. El texto
 * alineado a la derecha es además un recurso que solo funciona con rótulos cortos, que es
 * exactamente lo que esta plantilla escribe: sustantivos grabados, no frases.
 *
 * ## En móvil no hay dos columnas
 *
 * Con 320px, dos columnas contra un filete dejan renglones de tres palabras a cada lado. Ahí la
 * entrada se centra —rótulo arriba, explicación debajo— y lo que separa una de otra es el aire y
 * una ramita, no un filete. Sigue siendo una carta de menú; es la que se lee de arriba abajo.
 *
 * ## El icono va sin medallón
 *
 * Es el mismo gesto que `schedule.itinerary`, el cronograma de esta plantilla: el dibujo a tamaño
 * de texto junto al rótulo, en `accent`, sin círculo detrás. `IconBadge` —el medallón que usan las
 * otras cuatro— es interfaz, y aquí lo que hay es papel grabado.
 */
export function DetailsProgram({ content }: DetailsVariantProps) {
  return (
    <BlockSection block="details" variant="program">
      <BlockContainer className="max-w-3xl">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleCase="caps"
        />

        {content.image && (
          /*
            La fotografía como lámina montada, no como banda a sangre: es el tratamiento de esta
            plantilla —`hero.framed`, `story.pressed`— y lo que la separa de la panorámica 21:9 de
            `details.cards`. Estrecha y centrada, para que no compita con la carta que viene debajo.
          */
          <figure className="mx-auto mt-10 m-0 w-full max-w-md">
            <div className="border border-inv-line bg-inv-surface p-1.5 shadow-inv-soft">
              <div className="relative isolate aspect-[3/2] w-full overflow-hidden">
                <BlockImage image={content.image} sizes="(min-width: 640px) 28rem, 90vw" />
              </div>
            </div>
          </figure>
        )}

        <ul className="mx-auto mt-12 grid max-w-2xl list-none grid-cols-1 gap-9 p-0 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] sm:gap-x-0 sm:gap-y-8">
          {content.items.map((item, index) => {
            const Icon = blockIconComponent(item.icon);

            return (
              // El índice como clave es correcto aquí: los detalles no se reordenan ni se insertan
              // en caliente, se renderizan una vez desde contenido guardado.
              <li key={index} className="contents">
                {/*
                  `display: contents` en el `<li>` y sus dos mitades como celdas de la retícula.
                  Es lo que permite que TODOS los rótulos compartan una sola columna —y por tanto
                  que el filete quede recto de arriba abajo— sin renunciar a que cada detalle sea
                  un elemento de lista para quien lo escucha. Envolviendo cada par en su caja, cada
                  fila mediría lo suyo y el filete saldría escalonado.
                */}
                <h3 className="m-0 flex items-baseline gap-2.5 text-[11.5px] leading-snug font-normal tracking-[0.2em] text-inv-primary uppercase sm:justify-end sm:pr-6 sm:text-right">
                  <Icon aria-hidden="true" className="size-3.5 shrink-0 translate-y-[0.15em] text-inv-accent" strokeWidth={1.5} />
                  {item.title}
                </h3>

                <div className="min-w-0 sm:border-l sm:border-inv-line sm:pl-6">
                  {item.description && (
                    <p className="m-0 text-[14.5px] leading-relaxed text-inv-ink-soft">
                      {item.description}
                    </p>
                  )}

                  {item.action && <TextLink action={item.action} className="mt-3" />}
                </div>
              </li>
            );
          })}
        </ul>

        {/* La ramita cierra la carta. En móvil hace además de separador visual entre la última
            entrada y la nota, donde no hay filete que lo haga. */}
        <LeafSprig className="mx-auto mt-12 h-6 w-28 text-inv-accent opacity-70" />

        {content.note && <BlockNote note={content.note} className="mx-auto mt-8 max-w-md text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
