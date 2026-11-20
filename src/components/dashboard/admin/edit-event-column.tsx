import { Button, Tooltip } from 'antd';
import type { TableColumnType } from 'antd';
import { Pencil, Trash2 } from 'lucide-react';
import type { EventSummary } from '@/domain/events/event-repository';

/**
 * La columna de acciones de un evento —el lápiz «Editar evento» y la papelera «Eliminar»—,
 * compartida por la lista de eventos y la ficha de un cliente.
 *
 * La fila entera lleva al editor de la invitación; estos botones hacen otra cosa. Por eso cortan
 * la propagación del clic y también de Enter y espacio, que la fila escucha.
 */
export function editEventColumn(
  onEdit: (event: EventSummary) => void,
  onDelete: (event: EventSummary) => void,
): TableColumnType<EventSummary> {
  return {
    title: '',
    key: 'edit',
    width: 104,
    align: 'right',
    render: (_value, event) => (
      <span className="dash-row-actions">
        <Tooltip title="Editar evento">
          <Button
            type="text"
            icon={<Pencil size={15} strokeWidth={1.9} aria-hidden="true" />}
            aria-label={`Editar ${event.title}`}
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              onEdit(event);
            }}
            onKeyDown={(keyEvent) => keyEvent.stopPropagation()}
          />
        </Tooltip>
        <Tooltip title="Eliminar evento">
          <Button
            type="text"
            danger
            icon={<Trash2 size={15} strokeWidth={1.9} aria-hidden="true" />}
            aria-label={`Eliminar ${event.title}`}
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              onDelete(event);
            }}
            onKeyDown={(keyEvent) => keyEvent.stopPropagation()}
          />
        </Tooltip>
      </span>
    ),
  };
}
