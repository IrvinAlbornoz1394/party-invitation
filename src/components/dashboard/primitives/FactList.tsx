import type { ReactNode } from 'react';

export interface Fact {
  readonly label: string;
  readonly value: ReactNode;
}

/**
 * Una ficha de datos: etiqueta a la izquierda, valor a la derecha.
 *
 * Es un `<dl>` de verdad y no una tabla de dos columnas ni una pila de `<div>`. La relación
 * entre una etiqueta y su valor es semántica, y un lector de pantalla la anuncia como tal:
 * «Fecha, 7 de agosto de 2026». Con `<div>`s leería las dos cadenas seguidas y quien
 * escuchara tendría que deducir cuál es cuál.
 *
 * Las filas que no tienen valor se omiten antes de pintar, en lugar de mostrar un guion. Una
 * ficha llena de «—» obliga a leerla entera para descubrir que no dice nada; una ficha corta
 * se entiende de un vistazo.
 */
export function FactList({ facts }: { readonly facts: readonly Fact[] }) {
  const visible = facts.filter((fact) => fact.value !== null && fact.value !== undefined && fact.value !== '');

  return (
    <dl className="dash-facts">
      {visible.map((fact) => (
        <div className="dash-facts__row" key={fact.label}>
          <dt className="dash-facts__label">{fact.label}</dt>
          <dd className="dash-facts__value">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
