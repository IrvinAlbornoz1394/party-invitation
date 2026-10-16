import { Button, Tooltip } from 'antd';
import type { TableColumnType } from 'antd';
import { Pencil } from 'lucide-react';
import type { EventSummary } from '@/domain/events/event-repository';

/**
 * La columna del lápiz «Editar evento», compartida por la lista de eventos y la ficha de un
 * cliente.
 *
 * La fila entera lleva al editor de la invitación; el lápiz abre los datos del evento. Por eso el
 * botón corta la propagación del clic y también de Enter y espacio, que la fila escucha.
 */
export function editEventColumn(
  onEdit: (event: EventSummary) => void,
): TableColumnType<EventSummary> {
  return {
    title: '',
    key: 'edit',
    width: 64,
    align: 'right',
    render: (_value, event) => (
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
    ),
  };
}
