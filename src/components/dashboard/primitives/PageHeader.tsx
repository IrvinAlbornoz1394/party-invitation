import type { ReactNode } from 'react';

/**
 * El encabezado de una pantalla: título, una línea de contexto y sus acciones.
 *
 * Toda pantalla del panel empieza por esto, y por eso es un componente y no un patrón que
 * cada página repite. Cuando cada una maquetaba su propia cabecera, los títulos acababan en
 * tres tamaños distintos y el botón principal unas veces arriba y otras al pie.
 *
 * `description` es opcional pero se recomienda: es donde cabe la frase que explica qué
 * significa la pantalla —«cada cliente tiene sus propios eventos y su propio equipo»— y
 * ahorra la pregunta a quien entra por primera vez. Se limita a 68 caracteres de ancho por
 * CSS, que es el rango en el que un párrafo se lee sin que la vista se pierda al saltar de
 * línea.
 *
 * `<h1>` y no `<h2>`: es el título de la página, y en cada pantalla solo hay uno. La
 * cabecera del armazón no compite porque las migas de pan no son un encabezado.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  readonly title: string;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
}) {
  return (
    <div className="dash-page-header">
      <div>
        <h1 className="dash-page-header__title">{title}</h1>
        {description && <p className="dash-page-header__description">{description}</p>}
      </div>
      {actions && <div className="dash-page-header__actions">{actions}</div>}
    </div>
  );
}
