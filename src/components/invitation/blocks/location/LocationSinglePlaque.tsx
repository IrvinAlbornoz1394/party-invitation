import { ActionLink } from '../../shared/ActionLink';
import { BlockHeading } from '../../shared/BlockHeading';
import { BlockImage } from '../../shared/BlockImage';
import { BlockNote } from '../../shared/BlockNote';
import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { IconBadge } from '../../shared/IconBadge';
import { venueIcon } from './venue-icon';
import type { LocationVariantProps } from './location-parts';

/**
 * `location.single-plaque` — la sede grabada: la hora arriba, el rótulo y el nombre centrados
 * entre dos filetes, y el botón debajo. La fotografía, si la hay, en una banda estrecha encima.
 *
 * Es el décimo componente de ubicación y el único que **no usa `VenueFacts`**, que es la pieza
 * compartida con la que las otras nueve componen una sede. No es un descuido y conviene decir por
 * qué, porque saltarse una pieza común es siempre sospechoso:
 *
 * `VenueFacts` compone en el orden «rótulo → nombre → hora → dirección → enlace» y con la hora en
 * el color de acento debajo del nombre. Esta variante invierte las dos primeras cosas: la **hora
 * abre** la ficha, en versalitas y separada, porque en esta plantilla la sección es un renglón de
 * un programa —«5:00 pm · RECEPCIÓN · Salón Garde House»— y lo que ordena esa lectura es la hora.
 * Con la pieza compartida habría que contradecirla desde fuera con clases, que es como acaban dos
 * reglas peleándose cada vez que alguien retoca la común.
 *
 * Lo que sí se conserva es todo lo que **no puede divergir**: los mismos campos, el mismo enlace
 * externo con sus atributos y el mismo criterio de que ninguna sede se esconde nunca.
 *
 * ## La fotografía es una banda y no el fondo
 *
 * `21/9` y con el filete pegado, como el retrato de la portada. En una invitación oscura, una
 * fotografía a sangre detrás del texto obligaría a velarla y la sección pasaría a ser una portada
 * más; en banda estrecha acompaña y no compite. Sin foto no queda hueco: el medallón con el icono
 * de la sede ocupa su sitio, que es el único caso en el que esta variante dibuja un medallón.
 */
export function LocationSinglePlaque({ content }: LocationVariantProps) {
  return (
    <BlockSection block="location" variant="single-plaque">
      <BlockContainer className="max-w-md text-center">
        <BlockHeading
          eyebrow={content.eyebrow}
          title={content.title}
          subtitle={content.subtitle}
          align="center"
          titleCase="caps"
        />

        <div className="mt-12 grid gap-14">
          {content.venues.map((venue, index) => (
            // El índice como clave es correcto aquí: las sedes no se reordenan ni se insertan en
            // caliente, se renderizan una vez desde contenido guardado.
            <article key={index} className="flex flex-col items-center">
              {venue.image ? (
                <figure className="relative m-0 w-full">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-10 border border-inv-accent/60"
                  />
                  <div className="relative aspect-[21/9] w-full overflow-hidden bg-inv-primary/10">
                    <BlockImage
                      image={venue.image}
                      sizes="(min-width: 640px) 28rem, 90vw"
                      priority={index === 0}
                    />
                  </div>
                </figure>
              ) : (
                <IconBadge icon={venueIcon(venue.kind)} size="lg" />
              )}

              {venue.timeLabel && (
                <p className="mt-8 mb-0 text-[13px] tracking-[0.24em] text-inv-accent uppercase tabular-nums">
                  {venue.timeLabel}
                </p>
              )}

              {venue.label && (
                <p className="mt-4 mb-0 text-[11px] tracking-[0.3em] text-inv-ink-soft uppercase">
                  {venue.label}
                </p>
              )}

              {/* El nombre entre los dos filetes: es lo que convierte la ficha en una placa. Van
                  como bordes del propio párrafo y con relleno, no como elementos aparte, para que
                  midan exactamente lo que mide el nombre. */}
              <p className="mt-3 mb-0 border-y border-inv-accent/40 px-4 py-4 font-inv-display text-[clamp(1.3rem,4.5vw,1.75rem)] leading-tight font-light tracking-[0.12em] text-inv-ink uppercase">
                {venue.name}
              </p>

              {venue.address && (
                <p className="mt-5 mb-0 max-w-xs text-[13.5px] leading-relaxed text-inv-ink-soft">
                  {venue.address}
                </p>
              )}

              {venue.detail && (
                <p className="mt-2 mb-0 max-w-xs text-[13px] leading-relaxed text-inv-ink-soft opacity-80">
                  {venue.detail}
                </p>
              )}

              {venue.mapAction && (
                <ActionLink
                  label={venue.mapAction.label}
                  href={venue.mapAction.href}
                  tone="onSurface"
                  className="mt-8"
                />
              )}
            </article>
          ))}
        </div>

        {content.note && <BlockNote note={content.note} className="mt-10 text-center" />}
      </BlockContainer>
    </BlockSection>
  );
}
