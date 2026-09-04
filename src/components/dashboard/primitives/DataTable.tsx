'use client';

import { Table } from 'antd';
import type { TableProps } from 'antd';
import { useRouter } from 'next/navigation';
import { EmptyState } from './EmptyState';

interface DataTableProps<T> {
  readonly rows: readonly T[];
  readonly columns: TableProps<T>['columns'];
  readonly rowKey: keyof T & string;
  /** Ancho mínimo antes de desplazar en horizontal. Sin él, las columnas se aplastan. */
  readonly minWidth?: number;
  readonly empty: { readonly title: string; readonly description?: string };
  /**
   * A dónde lleva una fila. Devolver `null` la deja sin destino, que es lo correcto para las
   * tablas de catálogo: no todo lo que se lista tiene una pantalla detrás.
   */
  readonly rowHref?: (row: T) => string | null;
  readonly pageSize?: number;
  /**
   * Seleccionar una fila **sin salir de la pantalla**: la tabla es un índice y lo que hay al
   * lado cambia con lo que se elige.
   *
   * Es la alternativa a `rowHref`, no un añadido: una fila que navega y además selecciona haría
   * dos cosas con el mismo clic. Quien pase las dos se queda con la navegación, que es la que
   * cambia de página y por tanto la que manda.
   */
  readonly onRowSelect?: (row: T) => void;
  /** Cuál está seleccionada, para pintarla. Se compara contra el valor de `rowKey`. */
  readonly activeRowKey?: string | number | null;
}

/**
 * La tabla del panel: `Table` de antd con las decisiones ya tomadas.
 *
 * Existe para que ninguna pantalla vuelva a decidir por su cuenta cómo pagina, qué enseña
 * cuando está vacía o cómo se abre una fila. Cuando cada tabla lo resolvía sola, unas
 * paginaban a 10 y otras no paginaban, y el estado vacío iba del «No data» de fábrica a un
 * texto escrito a mano según quién la hubiera hecho.
 *
 * ## La fila entera es el objetivo
 *
 * Y no solo un enlace al final. En una tabla de tres filas, obligar a apuntar a un botón
 * pequeño es fricción sin motivo — y en el móvil, donde el panel se consulta a menudo, es
 * peor.
 *
 * Eso obliga a resolver el teclado a mano: un `<tr>` con `onClick` no es alcanzable ni
 * accionable sin ratón. `tabIndex` lo mete en el orden de tabulación y el manejador de
 * teclas responde a Enter y Espacio, que es lo que hace un enlace de verdad. La alternativa
 * honesta —envolver cada celda en un `<a>`— la descarta antd, que controla el marcado de la
 * fila.
 *
 * `router.push` y no `window.location`: la navegación del lado del cliente conserva el
 * estado del armazón y no vuelve a pedir la barra lateral entera.
 */
export function DataTable<T extends object>({
  rows,
  columns,
  rowKey,
  minWidth = 640,
  empty,
  rowHref,
  pageSize = 25,
  onRowSelect,
  activeRowKey,
}: DataTableProps<T>) {
  const router = useRouter();

  return (
    <Table<T>
      rowKey={rowKey}
      dataSource={[...rows]}
      columns={columns}
      size="middle"
      /*
       * Se pagina solo a partir del umbral. Una paginación bajo una tabla de cuatro filas es
       * un control que no hace nada, y ocupa el sitio de la siguiente tarjeta.
       */
      pagination={
        rows.length > pageSize
          ? { pageSize, size: 'small', showSizeChanger: false, hideOnSinglePage: true }
          : false
      }
      scroll={{ x: minWidth }}
      locale={{
        emptyText: <EmptyState title={empty.title} description={empty.description} />,
      }}
      onRow={(row) => {
        const href = rowHref?.(row) ?? null;

        /* Navegar gana sobre seleccionar: es la acción que se lleva al usuario a otra pantalla,
           y dos comportamientos en el mismo clic no se pueden repartir. */
        const activate = href !== null ? () => router.push(href) : onRowSelect?.bind(null, row);

        if (!activate) return {};

        const active = activeRowKey !== undefined && activeRowKey === row[rowKey];

        return {
          className: active
            ? 'dash-table__row--clickable dash-table__row--active'
            : 'dash-table__row--clickable',
          tabIndex: 0,
          /* `aria-current` y no `aria-selected`: aquella es válida en cualquier elemento, y esta
             solo dentro de un `grid` o un `treegrid` —una tabla de datos normal no lo es—. Lo que
             hay que comunicar es «esta es la fila que se está mirando», que es justo lo que
             `aria-current` dice. Con navegación no se pone: ahí la fila es un enlace, no una
             elección que se queda hecha. */
          'aria-current': href === null && active ? true : undefined,
          onClick: activate,
          onKeyDown: (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;

            // Espacio desplaza la página por defecto; sin esto, abrir una fila con la barra
            // espaciadora salta además media pantalla hacia abajo.
            event.preventDefault();
            activate();
          },
        };
      }}
    />
  );
}
