import { Button, Tooltip } from 'antd';
import type { TableColumnType } from 'antd';
import { Link2 } from 'lucide-react';
import type { EventSummary } from '@/domain/events/event-repository';

/** El botón del enlace para el cliente, al final de la fila. Ver `ContentLinkDialog`. */
export function contentLinkColumn(
  onOpen: (event: EventSummary) => void,
): TableColumnType<EventSummary> {
  return {
    title: '',
    key: 'content-link',
    width: 56,
    align: 'right',
    render: (_value, event) =>
      event.status === 'archived' ? null : (
        <Tooltip title="Enlace para el cliente">
          <Button
            type="text"
            icon={<Link2 size={15} strokeWidth={1.9} aria-hidden="true" />}
            aria-label={`Enlace para el cliente de ${event.title}`}
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              onOpen(event);
            }}
            onKeyDown={(keyEvent) => keyEvent.stopPropagation()}
          />
        </Tooltip>
      ),
  };
}
