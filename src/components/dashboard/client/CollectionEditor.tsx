'use client';

import type { ReactNode } from 'react';
import { Button } from 'antd';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

/**
 * Una lista ordenada que se edita: sedes, cronograma, galería.
 *
 * Las tres comparten la misma mecánica —añadir, reordenar, quitar— y aquí vive esa mecánica una
 * sola vez. Lo que cambia entre ellas es qué campos tiene una fila, y eso lo pone quien la usa
 * con `renderRow`. Tres editores copiados serían tres sitios donde el botón de quitar se comporta
 * distinto.
 *
 * ## No hay arrastrar y soltar
 *
 * Se reordena con dos flechas. Arrastrar es más vistoso y peor aquí: necesita una biblioteca,
 * no funciona con teclado sin trabajo extra, y en una pantalla táctil compite con el gesto de
 * desplazar la página. Con dos botones el orden se cambia igual, se entiende sin explicación y
 * funciona con el tabulador.
 *
 * ## El estado vive arriba
 *
 * Este componente no guarda nada: recibe las filas y devuelve la lista nueva por `onChange`. Es
 * lo que permite que el formulario entero se envíe de una vez —las tres listas serializadas en un
 * campo oculto— en lugar de que cada lista tenga su propio guardado y su propio momento de
 * quedarse a medias.
 */
export function CollectionEditor<Row>({
  title,
  description,
  rows,
  onChange,
  makeEmpty,
  renderRow,
  rowTitle,
  addLabel,
  emptyLabel,
  max,
}: {
  readonly title: string;
  readonly description?: string;
  readonly rows: readonly Row[];
  readonly onChange: (rows: readonly Row[]) => void;
  /** Cómo es una fila recién añadida. Sin `id`: todavía no existe en la base. */
  readonly makeEmpty: () => Row;
  readonly renderRow: (row: Row, index: number, update: (patch: Partial<Row>) => void) => ReactNode;
  /** El encabezado de cada fila, para poder distinguirlas plegadas. */
  readonly rowTitle: (row: Row, index: number) => string;
  readonly addLabel: string;
  readonly emptyLabel: string;
  readonly max: number;
}) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= rows.length) return;

    const next = [...rows];
    const [moved] = next.splice(from, 1);

    // `moved` existe: `from` viene de recorrer el propio array. La comprobación está para que
    // activar `noUncheckedIndexedAccess` algún día no rompa este archivo.
    if (moved !== undefined) next.splice(to, 0, moved);

    onChange(next);
  };

  return (
    <section className="collection">
      <header className="collection__head">
        <div>
          <h3 className="collection__title">{title}</h3>
          {description && <p className="collection__description">{description}</p>}
        </div>
        <span className="collection__count">
          {rows.length} de {max}
        </span>
      </header>

      {rows.length === 0 ? (
        <p className="collection__empty">{emptyLabel}</p>
      ) : (
        <ol className="collection__rows">
          {rows.map((row, index) => (
            /*
             * La `key` es el índice, y aquí sí corresponde pese a la regla general. Una fila
             * nueva no tiene `id` —no existe en la base todavía— así que no hay ninguna identidad
             * estable que usar, y los campos de la fila son controlados: su valor sale del estado
             * de arriba, no del DOM. Con eso, reordenar mueve los valores aunque las claves se
             * queden quietas, que es exactamente lo que se quiere.
             *
             * El caso contra `key={index}` es el de una lista con estado propio DENTRO de cada
             * fila —un desplegable abierto, un campo sin controlar—. Aquí no hay ninguno.
             */
            // eslint-disable-next-line react/no-array-index-key
            <li className="collection__row" key={index}>
              <div className="collection__row-head">
                <span className="collection__row-title">
                  {rowTitle(row, index) || `Sin título`}
                </span>

                <div className="collection__row-tools">
                  <Button
                    type="text"
                    size="small"
                    aria-label={`Subir «${rowTitle(row, index)}»`}
                    disabled={index === 0}
                    icon={<ChevronUp size={15} />}
                    onClick={() => move(index, index - 1)}
                  />
                  <Button
                    type="text"
                    size="small"
                    aria-label={`Bajar «${rowTitle(row, index)}»`}
                    disabled={index === rows.length - 1}
                    icon={<ChevronDown size={15} />}
                    onClick={() => move(index, index + 1)}
                  />
                  <Button
                    type="text"
                    size="small"
                    danger
                    aria-label={`Quitar «${rowTitle(row, index)}»`}
                    icon={<Trash2 size={15} />}
                    onClick={() => onChange(rows.filter((_, position) => position !== index))}
                  />
                </div>
              </div>

              <div className="collection__row-body">
                {renderRow(row, index, (patch) =>
                  onChange(
                    rows.map((candidate, position) =>
                      position === index ? { ...candidate, ...patch } : candidate,
                    ),
                  ),
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      <Button
        type="dashed"
        icon={<Plus size={15} />}
        disabled={rows.length >= max}
        onClick={() => onChange([...rows, makeEmpty()])}
        block
      >
        {addLabel}
      </Button>
    </section>
  );
}
