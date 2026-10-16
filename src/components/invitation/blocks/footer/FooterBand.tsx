import clsx from 'clsx';
import { Heart } from 'lucide-react';
import { blockIconComponent } from '../../shared/block-icons';
import { BlockSection } from '../../shared/BlockSection';
import { hasText } from '../../shared/has-text';
import { externalLinkAttributes } from '../../shared/href';
import { FooterCredits, FooterTopLink, type FooterVariantProps } from './footer-parts';

/**
 * `footer.band` — el pie como una franja rosada a sangre: el nombre a mano, el mensaje y los
 * contactos como medallones redondos de solo icono, con un corazón al final.
 *
 * Es el pie de `blush`, y repite la franja de la fecha (`calendar.strip`) para cerrar la
 * invitación con el mismo rosa más intenso con el que la partió a la mitad. Las otras diez
 * escriben los contactos como enlaces con su rótulo; este los reduce a **iconos en círculo**,
 * que es lo que hace la referencia («¿Tienes dudas?» y tres botones redondos) y lo que cabe en
 * una franja sin que se vuelva un listado.
 *
 * Sin monograma: el nombre a mano ya ocupa su sitio, y las iniciales a cuerpo de versalita
 * encima se leían como una errata.
 *
 * El rótulo de cada contacto no se pierde: va como nombre accesible y como `title`. Sin él, un
 * lector de pantalla anunciaría tres enlaces mudos.
 *
 * La franja es el fondo de la sección entera: el rosa se pone sobre el de `BlockSection` (que
 * `twMerge` sustituye) y no en una caja dentro, para que llegue de canto a canto.
 */
export function FooterBand({ content }: FooterVariantProps) {
  return (
    <BlockSection
      block="footer"
      variant="band"
      className="bg-inv-primary/[0.13] px-6 py-14 text-center sm:py-16"
    >
      <div className="mx-auto flex max-w-md flex-col items-center">
        <p className="m-0 font-inv-script text-[clamp(2rem,8vw,2.6rem)] leading-[1.15] text-inv-accent">
          {content.names}
        </p>
        {(hasText(content.dateLabel) || hasText(content.city)) && (
          <p className="mt-3 mb-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-inv-display text-[11px] tracking-[0.22em] text-inv-ink-soft uppercase">
            {hasText(content.dateLabel) && <span>{content.dateLabel}</span>}
            {hasText(content.dateLabel) && hasText(content.city) && (
              <Heart size={8} strokeWidth={0} aria-hidden="true" className="fill-current opacity-60" />
            )}
            {hasText(content.city) && <span>{content.city}</span>}
          </p>
        )}
        {hasText(content.message) && (
          <p className="mt-6 mb-0 max-w-xs text-[13.5px] leading-relaxed text-inv-ink">
            {content.message}
          </p>
        )}

        {content.links.length > 0 && (
          <ul className="m-0 mt-7 flex list-none flex-wrap justify-center gap-3.5 p-0">
            {content.links.map((link, index) => {
              const Icon = blockIconComponent(link.icon);

              return (
                <li key={index}>
                  <a
                    href={link.href}
                    {...externalLinkAttributes(link.href)}
                    aria-label={link.label}
                    title={link.label}
                    className={clsx(
                      'grid size-11 place-items-center rounded-full border border-solid transition-colors',
                      /* Importante: ver la nota de `shared/action-styles.ts`. */
                      'border-inv-primary/40! text-inv-primary! hover:bg-inv-primary/10!',
                      'focus-visible:ring-2 focus-visible:ring-inv-accent focus-visible:outline-none',
                    )}
                  >
                    <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                  </a>
                </li>
              );
            })}
          </ul>
        )}

        <Heart
          size={11}
          strokeWidth={0}
          aria-hidden="true"
          className="mt-8 fill-current text-inv-accent"
        />

        {(hasText(content.credits) || content.topAction) && (
          <div className="mt-8 flex w-full flex-col items-center gap-4 border-t border-inv-primary/20 pt-7">
            {hasText(content.credits) && <FooterCredits credits={content.credits} />}
            {content.topAction && (
              <FooterTopLink label={content.topAction.label} href={content.topAction.href} />
            )}
          </div>
        )}
      </div>
    </BlockSection>
  );
}
