'use client';

import type { TableProps } from 'antd';
import type { EventSummary } from '@/domain/events/event-repository';
import { formatDate, formatDaysUntil, isUpcoming, pluralize } from '../format';
import { CodeCell, IdentityCell } from '../primitives/Cell';
import { DataTable } from '../primitives/DataTable';
import { InvitationCell } from '../primitives/InvitationCell';
import { PageHeader } from '../primitives/PageHeader';
import { SectionCard } from '../primitives/SectionCard';
import { StatusPill } from '../primitives/StatusPill';
import { eventStatus } from '../primitives/status-display';

/**
 * Todos los eventos del cliente.
 *
 * Existe aparte del resumen porque el menú necesita un destino para «Eventos»: sin él, un
 * cliente con seis eventos solo vería los cinco primeros del resumen y no tendría dónde ver
 * el resto. El resumen enseña lo urgente; esta pantalla enseña todo.
 *
 * No hay columna de cliente, a diferencia de la tabla equivalente de `/admin`: aquí sería la
 * misma cadena repetida en todas las filas, y una columna que siempre dice lo mismo es ruido.
 */
export function ClientEventsScreen({ events }: { readonly events: readonly EventSummary[] }) {
  return (
    <>
      <PageHeader
        title="Eventos"
        description={
          events.length > 0
            ? `${pluralize(events.length, 'evento', 'eventos')} en tu cuenta.`
            : 'Aquí aparecerán tus celebraciones en cuanto las demos de alta.'
        }
      />

      <SectionCard flush>
        <DataTable
          rows={events}
          rowKey="id"
          minWidth={620}
          columns={columns}
          rowHref={(event) => `/panel/eventos/${event.id}`}
          empty={{
            title: 'Todavía no tienes ningún evento',
            description:
              'Los eventos los damos de alta nosotros, con su plantilla y su tema ya elegidos. En cuanto esté listo lo verás aquí.',
          }}
        />
      </SectionCard>
    </>
  );
}

const columns: TableProps<EventSummary>['columns'] = [
  {
    title: 'Evento',
    dataIndex: 'title',
    key: 'title',
    render: (_value, event) => (
      <IdentityCell
        primary={event.title}
        secondary={
          <InvitationCell
            slug={event.slug}
            accessCode={event.accessCode}
            eventTitle={event.title}
          />
        }
      />
    ),
  },
  {
    title: 'Fecha',
    dataIndex: 'startsAt',
    key: 'startsAt',
    width: 168,
    sorter: (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
    defaultSortOrder: 'ascend',
    render: (date: Date) => (
      <IdentityCell
        primary={formatDate(date)}
        secondary={isUpcoming(date) ? formatDaysUntil(date) : 'Ya pasó'}
      />
    ),
  },
  {
    title: 'Plan',
    dataIndex: 'planKey',
    key: 'planKey',
    width: 112,
    render: (planKey: string) => <CodeCell>{planKey}</CodeCell>,
  },
  {
    title: 'Estado',
    dataIndex: 'status',
    key: 'status',
    width: 122,
    render: (status: string) => <StatusPill appearance={eventStatus(status)} />,
  },
];
