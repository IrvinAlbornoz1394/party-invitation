import type { ReactNode } from 'react';
import Link from 'next/link';

/**
 * La superficie sobre la que se apoya todo el contenido del panel.
 *
 * No usa `Card` de antd. La razón no es de gusto: el suyo trae su propio borde, su sombra y
 * su cabecera, y ajustarlos exige sobreescribir cuatro selectores por variante hasta que
 * cualquier retoque implica descubrir cuál de las dos hojas está ganando. Estas veinte
 * líneas de CSS propio se leen de una vez y no pelean con nadie.
 *
 * `flush` quita el relleno del cuerpo, y existe para las tablas: una tabla trae su propio
 * relleno de celda, así que sumarle el de la tarjeta la deja flotando en medio con un marco
 * de aire alrededor.
 */
export function SectionCard({
  title,
  subtitle,
  action,
  flush = false,
  children,
}: {
  readonly title?: string;
  readonly subtitle?: string;
  /** El enlace de la esquina: «Ver todos →». Discreto hasta que se busca. */
  readonly action?: { readonly label: string; readonly href: string };
  readonly flush?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <section className="dash-card">
      {title && (
        <header className="dash-card__header">
          <div>
            <h2 className="dash-card__title">{title}</h2>
            {subtitle && <p className="dash-card__subtitle">{subtitle}</p>}
          </div>
          {action && (
            <Link className="dash-card__action" href={action.href}>
              {action.label} <span aria-hidden="true">→</span>
            </Link>
          )}
        </header>
      )}
      <div className={`dash-card__body${flush ? ' dash-card__body--flush' : ''}`}>{children}</div>
    </section>
  );
}
