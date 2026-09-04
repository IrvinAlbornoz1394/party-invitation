import { BlockContainer, BlockSection } from '../../shared/BlockSection';
import { LeafSprig, TornEdge } from '../../shared/paper-ornaments';
import {
  FooterCredits,
  FooterLinks,
  FooterTopLink,
  type FooterVariantProps,
} from './footer-parts';

/**
 * `footer.sprig` — la última hoja de la papelería: el monograma grabado entre dos ramitas, sobre
 * un papel de otro tono rasgado por arriba.
 *
 * Es el pie de la estructura `botanical`, y no es «el centrado con hojitas». Lo que cambia es el
 * **soporte**: `footer.centered` va sobre el mismo papel que el resto de la invitación y se
 * separa con un filete; este es *otra hoja*, de un tono distinto, rasgada por el canto que la une
 * a la página. Es la misma pieza que ya usan la bienvenida, la franja del calendario y la
 * confirmación de esa plantilla, y por eso cierra: la invitación termina con el material con el
 * que empezó.
 *
 * ## Por qué el velo y no un color
 *
 * `primary` al 10 % sobre el papel del tema, igual que en `rsvp.torn` y por lo mismo: un tono
 * intermedio escrito a mano solo funcionaría en los temas que lo tuvieran, y aquí hay siete. El
 * velo sale salvia en el oliva y malva en el ciruela sin que este archivo sepa que existen, y
 * mueve tan poco la luminancia que el contraste que el tema garantiza entre `ink` y `bg` sigue
 * valiendo.
 *
 * Va **más flojo** que el de la confirmación —10 % contra 15 %— porque un pie no compite: es lo
 * último y tiene que quedar por debajo de lo que hay encima, que en esta plantilla es el cierre
 * en sobre.
 *
 * ## El canto rasgado, solo arriba
 *
 * Abajo es el final de la página. Una rasgadura ahí no se lee como papel troquelado sino como una
 * hoja cortada a medias — el mismo motivo por el que `footer.ribbon` pone su onda solo en el canto
 * superior.
 *
 * ## El monograma va sin círculo
 *
 * Y es la única variante de pie que no usa `FooterMonogram`. El círculo de aquella pieza es un
 * medallón: funciona como remate cuando está solo, y aquí no lo está — lo flanquean dos ramitas.
 * Un medallón entre dos ramas se lee como un sello encima de un adorno, tres objetos peleándose;
 * las iniciales sueltas entre las ramas son una sola pieza, que es el grabado de una papelería.
 *
 * ## Las dos ramitas son la misma, reflejada
 *
 * `-scale-x-100` en la de la derecha. Es el mismo criterio que en el canto rasgado: un segundo
 * trazo para lo que es la misma figura en espejo acaba corregido en una sola de las dos copias.
 * Y a diferencia de la rasgadura —que se refleja mal porque sus picos no coinciden—, una ramita
 * enfrentada a su espejo es exactamente lo que se busca aquí: las dos apuntando al monograma.
 *
 * ## Sin monograma no hay dos ramitas, hay una
 *
 * `monogram` es opcional en el contenido —«Ana & Diego» no tiene iniciales que quepan en un
 * monograma— y dejar las dos ramas enfrentadas alrededor de un hueco es peor que no ponerlas: se
 * lee como una pieza que no cargó. Sin iniciales el remate es **una sola ramita centrada**, que
 * es lo que ya hacen la portada enmarcada y el cierre en sobre cuando les falta su pieza.
 */
export function FooterSprig({ content }: FooterVariantProps) {
  return (
    <BlockSection
      block="footer"
      variant="sprig"
      /* `isolate` mantiene el velo por debajo del contenido sin que se escape de la sección; el
         relleno de arriba deja sitio al canto rasgado, que se come unos treinta píxeles. */
      className="relative isolate py-16 sm:py-20"
    >
      {/* La tinta, como capa encima del papel y NO como fondo de la sección: un color
          translúcido en el fondo se compondría contra el fondo del documento y no contra el papel
          del tema. Ver la nota larga en `rsvp/RsvpTorn.tsx`. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-inv-primary/10" />

      <TornEdge className="absolute inset-x-0 top-0 h-5 w-full text-inv-bg sm:h-7" />

      <BlockContainer className="max-w-xl">
        <div className="flex flex-col items-center text-center">
          {content.monogram ? (
            <div className="flex items-center gap-4 sm:gap-6">
              <LeafSprig className="h-6 w-20 text-inv-accent opacity-70 sm:w-28" />

              <span className="font-inv-display text-[clamp(1.5rem,5vw,2rem)] leading-none tracking-[0.12em] text-inv-primary">
                {content.monogram}
              </span>

              <LeafSprig className="h-6 w-20 -scale-x-100 text-inv-accent opacity-70 sm:w-28" />
            </div>
          ) : (
            <LeafSprig className="h-6 w-32 text-inv-accent opacity-70 sm:w-44" />
          )}

          <p className="mt-7 mb-0 font-inv-display text-[clamp(1.35rem,3vw,1.8rem)] leading-tight font-light text-inv-primary">
            {content.names}
          </p>

          {(content.dateLabel || content.city) && (
            <p className="mt-3 mb-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12.5px] tracking-[0.2em] text-inv-ink-soft uppercase">
              {content.dateLabel && <span>{content.dateLabel}</span>}
              {content.dateLabel && content.city && (
                <span aria-hidden="true" className="opacity-50">
                  ·
                </span>
              )}
              {content.city && <span>{content.city}</span>}
            </p>
          )}

          {content.message && (
            <p className="mt-6 mb-0 max-w-md text-[14.5px] leading-relaxed text-inv-ink-soft">
              {content.message}
            </p>
          )}

          <FooterLinks links={content.links} className="mt-8 justify-center" />

          {(content.credits || content.topAction) && (
            /* El filete se saca del color del texto y no de `line`: sobre el velo, el filete del
               tema —calculado para el papel limpio— queda casi invisible. */
            <div className="mt-10 flex w-full flex-col items-center gap-4 border-t border-inv-ink/12 pt-7">
              {content.credits && <FooterCredits credits={content.credits} />}
              {content.topAction && (
                <FooterTopLink label={content.topAction.label} href={content.topAction.href} />
              )}
            </div>
          )}
        </div>
      </BlockContainer>
    </BlockSection>
  );
}
