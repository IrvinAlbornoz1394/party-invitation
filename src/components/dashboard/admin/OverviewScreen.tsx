'use client';

import type { TableProps } from 'antd';
import { Building2, CalendarDays, CircleCheck, FileText } from 'lucide-react';
import type { ClientSummary } from '@/domain/clients/client-repository';
import type { EventSummary } from '@/domain/events/event-repository';
import { formatDate, formatDaysUntil, isUpcoming, pluralize } from '../format';
import { IdentityCell } from '../primitives/Cell';
import { DataTable } from '../primitives/DataTable';
import { Meter } from '../primitives/Meter';
import { PageHeader } from '../primitives/PageHeader';
import { SectionCard } from '../primitives/SectionCard';
import { StatCard } from '../primitives/StatCard';
import { StatusPill } from '../primitives/StatusPill';
import { eventStatus } from '../primitives/status-display';

/**
 * El resumen de la plataforma: qué hay, qué viene y con qué se está vendiendo.
 *
 * ## Las cifras se calculan aquí
 *
 * Sobre las listas que ya se pidieron, en lugar de con consultas de agregado aparte. A esta
 * escala es más barato —dos consultas en vez de seis— y sobre todo hace imposible que el
 * número y la tabla que hay debajo se contradigan, que es el fallo clásico de los paneles:
 * un contador que dice 12 encima de una lista de 11.
 *
 * Cuando los clientes se cuenten por miles esto tendrá que volverse un agregado en SQL. La
 * señal de que llegó el momento es la paginación: en cuanto la lista deje de traerse entera,
 * el cálculo de aquí empezaría a mentir.
 */
export function OverviewScreen({
  clients,
  events,
}: {
  readonly clients: readonly ClientSummary[];
  readonly events: readonly EventSummary[];
}) {
  const activeClients = clients.filter((client) => client.status === 'active').length;
  const published = events.filter((event) => event.status === 'published').length;
  const drafts = events.filter((event) => event.status === 'draft').length;

  // Lo que viene, no lo que pasó: un resumen que abre con la boda del año pasado no sirve
  // para decidir nada.
  const upcoming = events
    .filter((event) => isUpcoming(event.startsAt))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  /*
   * Distribución por plan. Se cuenta sobre los eventos y no sobre los clientes porque el
   * plan se vende POR EVENTO: un mismo cliente puede tener una boda Premium y unos XV
   * Esencial, y contarlo por cliente daría una cifra que no corresponde a nada facturable.
   */
  const planRows = [...countBy(events, (event) => event.planKey)]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  // Los clientes con más eventos primero: es la lista que responde "¿quién es quién?" al
  // llegar por la mañana, y el orden alfabético no la responde.
  const topClients = [...clients].sort((a, b) => b.eventCount - a.eventCount).slice(0, 6);

  return (
    <>
      <PageHeader
        title="Resumen"
        description="Cómo va la plataforma: clientes activos, eventos en marcha y lo que viene."
      />

      <div className="dash-grid">
        <StatCard
          icon={Building2}
          tone="plum"
          label="Clientes activos"
          value={activeClients}
          suffix={clients.length > activeClients ? `de ${clients.length}` : undefined}
        />
        <StatCard icon={CalendarDays} tone="azure" label="Eventos" value={events.length} />
        <StatCard
          icon={CircleCheck}
          tone="sage"
          label="Publicados"
          value={published}
          suffix={events.length > 0 ? `de ${events.length}` : undefined}
        />
        <StatCard icon={FileText} tone="gold" label="En borrador" value={drafts} />
      </div>

      <div className="dash-split">
        <SectionCard
          title="Próximos eventos"
          subtitle={
            upcoming.length > 0
              ? `${pluralize(upcoming.length, 'evento', 'eventos')} por celebrar`
              : undefined
          }
          action={{ label: 'Ver todos', href: '/admin/eventos' }}
          flush
        >
          <DataTable
            rows={upcoming.slice(0, 8)}
            rowKey="id"
            minWidth={560}
            columns={upcomingColumns}
            empty={{
              title: 'No hay eventos próximos',
              description:
                'Cuando se dé de alta un evento con fecha futura aparecerá aquí, ordenado por cercanía.',
            }}
          />
        </SectionCard>

        <div className="dash-stack">
          <SectionCard
            title="Eventos por plan"
            subtitle="El plan se vende por evento, no por cliente"
          >
            {planRows.length > 0 ? (
              <Meter rows={planRows} total={events.length} />
            ) : (
              <p className="dash-card__subtitle" style={{ margin: 0 }}>
                Todavía no hay eventos que repartir entre planes.
              </p>
            )}
          </SectionCard>

          <SectionCard
            title="Clientes"
            action={{ label: 'Gestionar', href: '/admin/clientes' }}
            flush
          >
            <DataTable
              rows={topClients}
              rowKey="id"
              minWidth={280}
              columns={clientColumns}
              rowHref={(client) => `/admin/clientes/${client.id}`}
              empty={{
                title: 'Todavía no hay clientes',
                description: 'Da de alta el primero para empezar a crear sus eventos.',
              }}
            />
          </SectionCard>
        </div>
      </div>
    </>
  );
}

const upcomingColumns: TableProps<EventSummary>['columns'] = [
  {
    title: 'Evento',
    dataIndex: 'title',
    key: 'title',
    render: (_value, event) => (
      <IdentityCell primary={event.title} secondary={event.clientName ?? undefined} />
    ),
  },
  {
    title: 'Fecha',
    dataIndex: 'startsAt',
    key: 'startsAt',
    width: 168,
    /*
     * La fecha y, debajo, cuánto falta. El dato exacto es el que se necesita para trabajar;
     * "en 12 días" es el que se lee de un vistazo para saber qué urge. Poner solo uno de los
     * dos obliga a calcular mentalmente el otro.
     */
    render: (date: Date) => (
      <IdentityCell primary={formatDate(date)} secondary={formatDaysUntil(date)} />
    ),
  },
  {
    title: 'Estado',
    dataIndex: 'status',
    key: 'status',
    width: 122,
    render: (status: string) => <StatusPill appearance={eventStatus(status)} />,
  },
];

const clientColumns: TableProps<ClientSummary>['columns'] = [
  {
    title: 'Cliente',
    dataIndex: 'name',
    key: 'name',
    render: (_value, client) => (
      <IdentityCell
        primary={client.name}
        secondary={
          client.eventCount === 0
            ? 'Sin eventos'
            : pluralize(client.eventCount, 'evento', 'eventos')
        }
      />
    ),
  },
];

/**
 * Cuenta ocurrencias por clave.
 *
 * Un `Map` y no un objeto: las claves vienen de la base de datos (`plan_key`) y un objeto
 * plano heredaría `constructor`, `toString` y compañía del prototipo, así que un plan que se
 * llamara así daría un conteo absurdo en lugar de un error visible.
 */
function countBy<T>(items: readonly T[], key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();

  for (const item of items) {
    const value = key(item);

    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return counts;
}
