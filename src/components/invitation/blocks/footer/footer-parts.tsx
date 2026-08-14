import clsx from 'clsx';
import { ArrowUp } from 'lucide-react';
import type { ComponentType } from 'react';
import type { FooterContent, FooterLink } from '@/domain/invitation/blocks/footer';
import { blockIconComponent } from '../../shared/block-icons';
import { externalLinkAttributes } from '../../shared/href';

/**
 * Las piezas del pie, compartidas por sus tres componentes.
 *
 * El pie es el bloque que más se copia mal entre proyectos: los enlaces de contacto acaban
 * siendo texto sin `href`, el teléfono no marca al pulsarlo y el «volver arriba» es un `div`
 * con un `onClick`. Resuelto aquí una vez, los tres lo hacen bien.
 */

export interface FooterVariantProps {
  readonly content: FooterContent;
}

/** El tipo con el que el registro guarda un pie, sea cual sea su forma. */
export type FooterVariant = ComponentType<FooterVariantProps>;

/**
 * El monograma: las iniciales dentro de un filete circular.
 *
 * Cierra la invitación con la misma marca con la que empezó, que es lo que hace una papelería
 * cuidada. Va en la tipografía de titulares y con el filete del tema, no con un fondo lleno: un
 * círculo macizo compite con el texto que tiene debajo, y esto es un remate, no un botón.
 */
export function FooterMonogram({
  monogram,
  tone = 'default',
  className,
}: {
  readonly monogram: string;
  readonly tone?: 'default' | 'inverse';
  readonly className?: string;
}) {
  return (
    <span
      className={clsx(
        'grid size-14 place-items-center rounded-full border font-inv-display text-[1.35rem] leading-none',
        tone === 'inverse'
          ? 'border-current/35 text-inv-on-primary'
          : 'border-inv-line text-inv-primary',
        className,
      )}
    >
      {monogram}
    </span>
  );
}

/**
 * Los contactos, como enlaces de verdad.
 *
 * `href` se escribe entero en el contenido —`tel:`, `https://wa.me/…`, `https://instagram.com/…`—
 * y no se compone aquí a partir de un número. Es deliberado: componerlo obligaría a que el
 * dominio supiera de servicios de mensajería y a normalizar prefijos de país, y bastaría un
 * cliente con un formato raro para dejar el enlace roto sin que nadie lo notara hasta el día del
 * evento.
 */
export function FooterLinks({
  links,
  tone = 'default',
  className,
}: {
  readonly links: readonly FooterLink[];
  readonly tone?: 'default' | 'inverse';
  readonly className?: string;
}) {
  if (links.length === 0) return null;

  return (
    <ul className={clsx('m-0 flex list-none flex-wrap items-center gap-x-6 gap-y-3 p-0', className)}>
      {links.map((link, index) => {
        const Icon = blockIconComponent(link.icon);

        return (
          // El índice como clave es correcto aquí: los enlaces no se reordenan ni se insertan en
          // caliente, se renderizan una vez desde contenido guardado.
          <li key={index}>
            <a
              href={link.href}
              {...externalLinkAttributes(link.href)}
              className={clsx(
                'inline-flex items-center gap-2 text-[13.5px] transition-opacity hover:opacity-70',
                'focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none',
                /* Importante: ver la nota de `shared/action-styles.ts`. */
                tone === 'inverse' ? 'text-inv-on-primary!' : 'text-inv-ink!',
              )}
            >
              <Icon
                size={16}
                strokeWidth={1.7}
                aria-hidden="true"
                className={tone === 'inverse' ? undefined : 'text-inv-accent'}
              />
              {link.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * El enlace de volver al principio.
 *
 * Es un ancla y no un botón con desplazamiento programado: así funciona sin JavaScript, se puede
 * abrir en otra pestaña y el navegador respeta por su cuenta la preferencia de movimiento
 * reducido —el desplazamiento suave está declarado en `globals.css` dentro de una consulta
 * `prefers-reduced-motion: no-preference`—.
 *
 * Sin él, el pie es un callejón sin salida: en un móvil, volver arriba en una invitación de seis
 * pantallas son varios segundos de arrastre.
 */
export function FooterTopLink({
  label,
  href,
  tone = 'default',
  className,
}: {
  readonly label: string;
  readonly href: string;
  readonly tone?: 'default' | 'inverse';
  readonly className?: string;
}) {
  return (
    <a
      href={href}
      className={clsx(
        'inline-flex items-center gap-2 text-[12px] tracking-[0.18em] uppercase transition-opacity hover:opacity-70',
        'focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none',
        tone === 'inverse' ? 'text-inv-on-primary! opacity-85' : 'text-inv-ink-soft!',
        className,
      )}
    >
      <ArrowUp size={15} strokeWidth={1.8} aria-hidden="true" />
      {label}
    </a>
  );
}

/** Los créditos de abajo del todo, en el cuerpo más pequeño de la invitación. */
export function FooterCredits({
  credits,
  tone = 'default',
  className,
}: {
  readonly credits: string;
  readonly tone?: 'default' | 'inverse';
  readonly className?: string;
}) {
  return (
    <p
      className={clsx(
        'm-0 text-[12px]',
        tone === 'inverse' ? 'text-inv-on-primary opacity-70' : 'text-inv-ink-soft opacity-80',
        className,
      )}
    >
      {credits}
    </p>
  );
}
