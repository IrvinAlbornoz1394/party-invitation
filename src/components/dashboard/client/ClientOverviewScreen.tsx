'use client';

import type { TableProps } from 'antd';
import { CalendarDays, CircleCheck, Clock } from 'lucide-react';
import type { EventSummary } from '@/domain/events/event-repository';
import { formatDate, formatDaysUntil, isUpcoming } from '../format';
import { IdentityCell } from '../primitives/Cell';
import { DataTable } from '../primitives/DataTable';
import { EmptyState } from '../primitives/EmptyState';
import { InvitationCell } from '../primitives/InvitationCell';
import { PageHeader } from '../primitives/PageHeader';
import { SectionCard } from '../primitives/SectionCard';
import { StatCard } from '../primitives/StatCard';
import { StatusPill } from '../primitives/StatusPill';
import { eventStatus } from '../primitives/status-display';

/**
 * El inicio del panel de un cliente: sus eventos.
 *
 * No hay botón de «crear evento». Los eventos los da de alta la plataforma junto con el
 * cliente, porque crear uno implica elegir plantilla, plan y tema — decisiones que hoy son
 * parte del servicio que se vende, no de lo que el cliente configura solo. El día que eso
 * cambie, el botón entra aquí.
 *
 * El estado vacío lo dice con esas palabras en lugar de dejar una tabla en blanco: quien
 * acaba de recibir su acceso y todavía no tiene nada dado de alta necesita saber que eso es
 * lo esperado y no un fallo.
 */
export function ClientOverviewScreen({ events }: { readonly events: readonly EventSummary[] }) {
  const published = events.filter((event) => event.status === 'published').length;
  const upcoming = events
    .filter((event) => isUpcoming(event.startsAt))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const next = upcoming.at(0);

  if (events.length === 0) {
    return (
      <>
        <PageHeader title="Resumen" description="Aquí verás todo lo que ocurre en tus eventos." />
        <SectionCard>
          <EmptyState
            title="Todavía no tienes ningún evento"
            description="En cuanto lo demos de alta lo verás aquí, con su invitación y sus confirmaciones."
          />
        </SectionCard>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Resumen" description="Gestiona cada detalle de tus celebraciones." />

      <div className="dash-grid">
        <StatCard icon={CalendarDays} tone="rose" label="Tus eventos" value={events.length} />
        <StatCard
          icon={CircleCheck}
          tone="sage"
          label="Publicados"
          value={published}
          suffix={`de ${events.length}`}
        />
        <StatCard
          icon={Clock}
          tone="plum"
          label="Próximo"
          value={next ? formatDate(next.startsAt) : '—'}
          suffix={next ? formatDaysUntil(next.startsAt) : undefined}
        />
      </div>

      <div style={{ marginTop: 'var(--dash-gap)' }}>
        <SectionCard
          title="Tus eventos"
          action={events.length > 5 ? { label: 'Ver todos', href: '/panel/eventos' } : undefined}
          flush
        >
          <DataTable
            rows={events.slice(0, 5)}
            rowKey="id"
            minWidth={620}
            columns={columns}
            rowHref={(event) => `/panel/eventos/${event.id}`}
            empty={{ title: 'Todavía no tienes ningún evento' }}
          />
        </SectionCard>
      </div>
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
    title: 'Estado',
    dataIndex: 'status',
    key: 'status',
    width: 122,
    render: (status: string) => <StatusPill appearance={eventStatus(status)} />,
  },
];
