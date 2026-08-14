import type { ReactNode } from 'react';

/**
 * La celda de identidad de una tabla: el nombre y, debajo, su dato de apoyo.
 *
 * Se repite en casi todas las tablas del panel —cliente y correo, evento y dirección,
 * persona y correo— y por eso es un componente. El patrón importa más de lo que parece:
 * pone el dato que se busca en primera línea y el que se necesita para desambiguar justo
 * debajo, en vez de gastar dos columnas en algo que se lee como una sola cosa.
 */
export function IdentityCell({
  primary,
  secondary,
}: {
  readonly primary: ReactNode;
  readonly secondary?: ReactNode;
}) {
  return (
    <div>
      <span className="dash-cell__primary">{primary}</span>
      {secondary !== undefined && secondary !== null && (
        <span className="dash-cell__secondary">{secondary}</span>
      )}
    </div>
  );
}

/**
 * Un identificador técnico: slug, clave de plan, `registry_id`.
 *
 * En monoespaciada porque se dictan por teléfono en soporte, y ahí la diferencia entre un
 * cero y una O —o entre una ele y un uno— deja de ser cosmética.
 */
export function CodeCell({ children }: { readonly children: ReactNode }) {
  return <code className="dash-code">{children}</code>;
}

/** Un valor ausente. Un guion, en gris, en lugar de una celda vacía que parece un fallo. */
export function EmptyCell() {
  return (
    <span className="dash-cell__secondary" aria-label="Sin dato">
      —
    </span>
  );
}
