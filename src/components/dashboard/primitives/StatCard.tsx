import type { ComponentType } from 'react';

/** Los tonos de la pastilla del icono. Están definidos en `dashboard.css`. */
export type StatTone = 'rose' | 'sage' | 'azure' | 'gold' | 'plum' | 'slate';

/**
 * La tarjeta de una cifra: icono en pastilla, etiqueta pequeña y el número en serif.
 *
 * El número va en el serif de la marca (Cormorant) mientras el resto de la interfaz va en el
 * palo seco (Jost). Es lo que lo convierte en el elemento principal de la tarjeta sin
 * necesidad de agrandarlo más ni de darle color — y el color, en un panel, conviene
 * reservarlo para lo que significa algo.
 *
 * Va en peso 400, no en negrita: a 32px, un garalde fino tiene presencia de sobra, y
 * engordarlo es justo lo que lo haría parecer un serif de sistema.
 *
 * `suffix` es el «de 12» que va detrás: da la referencia sin la que un número suelto no
 * dice nada. «8 publicados» invita a preguntar de cuántos; «8 de 12» ya lo responde.
 */
export function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  suffix,
}: {
  readonly icon: ComponentType<{ readonly size?: number; readonly strokeWidth?: number }>;
  readonly tone: StatTone;
  readonly label: string;
  readonly value: string | number;
  readonly suffix?: string;
}) {
  return (
    <div className="dash-card">
      <div className="dash-stat">
        <span className={`dash-stat__icon dash-tone-${tone}`} aria-hidden="true">
          <Icon size={19} strokeWidth={1.5} />
        </span>
        <div className="dash-stat__body">
          <span className="dash-stat__label">{label}</span>
          <span className="dash-stat__value">
            {value}
            {suffix && <span className="dash-stat__suffix">{suffix}</span>}
          </span>
        </div>
      </div>
    </div>
  );
}
