'use client';

import { useMemo, useState } from 'react';
import { Input, Segmented } from 'antd';
import type { TableProps } from 'antd';
import { Search } from 'lucide-react';
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
 * Todos los eventos de todos los clientes.
 *
 * Es la pantalla que responde «¿qué hay en marcha?» sin tener que entrar cliente por cliente.
 * Por eso el cliente va como segunda línea de la primera columna y no en una columna aparte:
 * lo que se busca aquí casi siempre empieza por «el evento de fulano», así que el nombre del
 * cliente tiene que estar junto al del evento, no a tres columnas de distancia.
 *
 * El filtro por estado es `Segmented` y no un desplegable porque solo hay cuatro opciones y
 * se alternan constantemente. Un desplegable cuesta dos clics —abrir y elegir— cada vez que
 * se cambia de vista; estas pastillas cuestan uno y además enseñan de un vistazo en cuál
 * estás.
 */
type StatusFilter = 'todos' | 'published' | 'draft' | 'archived';

export function EventsScreen({ events }: { readonly events: readonly EventSummary[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('todos');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return events.filter((event) => {
      if (status !== 'todos' && event.status !== status) return false;
      if (needle === '') return true;

      return [event.title, event.slug, event.clientName ?? '', event.planKey]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [events, query, status]);

  /*
   * Los conteos se calculan sobre la lista COMPLETA, no sobre la filtrada. Si contaran lo
   * filtrado, al elegir «Borrador» las demás pastillas dirían cero y dejarían de servir para
   * lo único que sirven: saber cuánto hay en cada estado antes de cambiar a él.
   */
  const counts = useMemo(
    () => ({
      todos: events.length,
      published: events.filter((event) => event.status === 'published').length,
      draft: events.filter((event) => event.status === 'draft').length,
      archived: events.filter((event) => event.status === 'archived').length,
    }),
    [events],
  );

  return (
    <>
      <PageHeader
        title="Eventos"
        description="Todo lo que está en marcha en la plataforma, de todos los clientes."
      />

      <div className="dash-toolbar">
        <div className="dash-toolbar__filters">
          <Input
            allowClear
            size="large"
            placeholder="Buscar por evento, cliente o dirección"
            prefix={<Search size={16} strokeWidth={1.5} aria-hidden="true" />}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{ maxWidth: 340 }}
            aria-label="Buscar eventos"
          />
          <Segmented<StatusFilter>
            value={status}
            onChange={setStatus}
            options={[
              { label: `Todos (${counts.todos})`, value: 'todos' },
              { label: `Publicados (${counts.published})`, value: 'published' },
              { label: `Borradores (${counts.draft})`, value: 'draft' },
              { label: `Archivados (${counts.archived})`, value: 'archived' },
            ]}
          />
        </div>
        <span className="dash-toolbar__count">
          {filtered.length === events.length
            ? pluralize(events.length, 'evento', 'eventos')
            : `${filtered.length} de ${events.length}`}
        </span>
      </div>

      <SectionCard flush>
        <DataTable
          rows={filtered}
          rowKey="id"
          minWidth={760}
          columns={columns}
          rowHref={(event) => `/admin/clientes/${event.clientId}`}
          empty={
            events.length === 0
              ? {
                  title: 'Todavía no hay eventos en ningún cliente',
                  description:
                    'Los eventos se dan de alta desde la plataforma, junto con su plantilla, su plan y su tema.',
                }
              : {
                  title: 'Ningún evento coincide',
                  description: 'Prueba con otro texto o cambia el filtro de estado.',
                }
          }
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
      <IdentityCell primary={event.title} secondary={event.clientName ?? undefined} />
    ),
  },
  {
    title: 'Invitación',
    dataIndex: 'slug',
    key: 'slug',
    width: 232,
    render: (_value, event) => (
      <InvitationCell slug={event.slug} accessCode={event.accessCode} eventTitle={event.title} />
    ),
  },
  {
    title: 'Fecha',
    dataIndex: 'startsAt',
    key: 'startsAt',
    width: 168,
    sorter: (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
    /*
     * Por defecto, lo más próximo primero. Un listado de eventos ordenado al azar obliga a
     * ordenarlo a mano en cada visita, y lo que se viene a mirar casi siempre es lo que está
     * a punto de pasar.
     */
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
