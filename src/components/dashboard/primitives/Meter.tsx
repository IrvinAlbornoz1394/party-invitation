import { toPercentage } from '../format';

export interface MeterRow {
  readonly label: string;
  readonly value: number;
}

/**
 * Una distribución en barras: planes por evento, eventos por estado.
 *
 * No trae ninguna librería de gráficas, y es deliberado. Recharts pesa unos 100 kB
 * comprimidos y aquí lo único que se necesita son cuatro barras horizontales; el coste no
 * está en el tamaño del bundle sino en lo que arrastra: un componente que hay que hidratar,
 * que no se renderiza en el servidor y que hay que configurar para que respete
 * `prefers-reduced-motion`. Todo eso, para lo que `div` y `width` ya resuelven.
 *
 * El valor va SIEMPRE escrito al lado de la barra. El ancho da la comparación de un vistazo;
 * el número da el dato exacto, y quien no distinga los tonos sigue teniendo la cifra — que
 * es la misma regla que la pastilla de estado.
 *
 * El total se pasa por fuera en vez de sumarse aquí porque no siempre es la suma: «8 de 12
 * eventos publicados» se mide contra los 12, no contra los 8 que hay en la lista.
 */
export function Meter({
  rows,
  total,
}: {
  readonly rows: readonly MeterRow[];
  readonly total: number;
}) {
  return (
    <div>
      {rows.map((row) => {
        const percentage = toPercentage(row.value, total);

        return (
          <div className="dash-meter" key={row.label}>
            <div className="dash-meter__head">
              <span className="dash-meter__label">{row.label}</span>
              <span className="dash-meter__value">{row.value}</span>
            </div>
            {/*
              `role="img"` con su etiqueta: sin él, un lector de pantalla encuentra dos
              `div` vacíos y no anuncia nada. Con él lee «Bodas: 8 de 12, 67%», que es
              exactamente lo que transmite la barra a quien la ve.
            */}
            <div
              className="dash-meter__track"
              role="img"
              aria-label={`${row.label}: ${row.value} de ${total}, ${percentage}%`}
            >
              <div className="dash-meter__fill" style={{ width: `${percentage}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
