'use client';

import { useState } from 'react';
import { Tabs } from 'antd';
import type { TableProps } from 'antd';
import { CircleCheck, CircleX, Hourglass, Users } from 'lucide-react';
import { summarizeGuestList, type GuestGroup, type GuestList } from '@/domain/guests/guest-group';
import { formatDate } from '../format';
import { IdentityCell } from '../primitives/Cell';
import { DataTable } from '../primitives/DataTable';
import { EmptyState } from '../primitives/EmptyState';
import { PageHeader } from '../primitives/PageHeader';
import { SectionCard } from '../primitives/SectionCard';
import { StatCard } from '../primitives/StatCard';
import { StatusPill } from '../primitives/StatusPill';
import { rsvpStatus } from '../primitives/status-display';
import { RsvpSummaryCard } from './RsvpSummaryCard';

type Filter = 'all' | 'confirmed' | 'declined' | 'pending';

/**
 * Las confirmaciones de un evento: cuántos vienen y quién falta.
 *
 * Arriba las cifras que pide el salón —personas confirmadas y lugares que todavía pueden
 * llegar—, y abajo la lista por familia con su respuesta y, si no van, lo que escribieron. Las
 * pestañas filtran sin cambiar de pantalla: lo que más se hace aquí es mirar a los pendientes
 * para escribirles.
 */
export function RsvpScreen({ list }: { readonly list: GuestList }) {
  const [filter, setFilter] = useState<Filter>('all');
  const summary = summarizeGuestList(list.groups);

  if (list.groups.length === 0) {
    return (
      <>
        <PageHeader title="Confirmaciones" description="Quién viene y cuántos son." />
        <SectionCard>
          <EmptyState
            icon={Users}
            title="Todavía no hay invitaciones"
            description="Agrega a tus invitados por familia en «Invitados» y mándale a cada una su enlace. Sus respuestas aparecerán aquí."
          />
        </SectionCard>
      </>
    );
  }

  const rows = list.groups.filter((group) => matches(group, filter));

  return (
    <>
      <PageHeader title="Confirmaciones" description="Quién viene, cuántos son y quién falta por responder." />

      <div className="dash-grid" style={{ marginBottom: 'var(--dash-gap)' }}>
        <StatCard
          icon={Users}
          tone="sage"
          label="Personas confirmadas"
          value={summary.attendees}
          suffix={`de ${summary.seats}`}
        />
        <StatCard icon={CircleCheck} tone="azure" label="Familias que vienen" value={summary.confirmedFamilies} />
        <StatCard icon={CircleX} tone="slate" label="No asistirán" value={summary.declinedFamilies} />
        <StatCard
          icon={Hourglass}
          tone="gold"
          label="Sin responder"
          value={summary.pendingFamilies}
          suffix={summary.pendingSeats === 1 ? '1 lugar' : `${summary.pendingSeats} lugares`}
        />
      </div>

      <div style={{ marginBottom: 'var(--dash-gap)' }}>
        <RsvpSummaryCard summary={summary} />
      </div>

      <Tabs
        activeKey={filter}
        onChange={(key) => setFilter(key as Filter)}
        items={[
          { key: 'all', label: `Todas (${summary.families})` },
          { key: 'confirmed', label: `Confirmaron (${summary.confirmedFamilies})` },
          { key: 'declined', label: `No asistirán (${summary.declinedFamilies})` },
          { key: 'pending', label: `Sin responder (${summary.pendingFamilies})` },
        ]}
      />

      <SectionCard flush>
        <DataTable
          rows={rows}
          rowKey="id"
          minWidth={760}
          columns={COLUMNS}
          empty={{ title: 'Nadie en esta lista por ahora' }}
        />
      </SectionCard>
    </>
  );
}

function matches(group: GuestGroup, filter: Filter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'pending':
      return group.reply === null;
    default:
      return group.reply?.status === filter;
  }
}

const COLUMNS: TableProps<GuestGroup>['columns'] = [
  {
    title: 'Invitación',
    dataIndex: 'name',
    key: 'name',
    render: (_value, group) => <IdentityCell primary={group.name} secondary={group.notes} />,
  },
  {
    title: 'Respuesta',
    key: 'reply',
    width: 150,
    render: (_value, group) => <StatusPill appearance={rsvpStatus(group.reply)} />,
  },
  {
    title: 'Asistentes',
    key: 'attendees',
    width: 120,
    render: (_value, group) => (
      <span className="dash-cell__secondary">
        {group.reply?.status === 'confirmed'
          ? `${group.reply.attendees} de ${group.seats}`
          : `— de ${group.seats}`}
      </span>
    ),
  },
  {
    title: 'Mensaje',
    key: 'message',
    render: (_value, group) =>
      group.reply?.message ? (
        <span style={{ whiteSpace: 'pre-line' }}>{group.reply.message}</span>
      ) : (
        <span className="dash-cell__secondary">—</span>
      ),
  },
  {
    title: 'Respondió',
    key: 'respondedAt',
    width: 130,
    render: (_value, group) => (
      <span className="dash-cell__secondary">
        {group.reply ? formatDate(group.reply.respondedAt) : 'Aún no'}
      </span>
    ),
  },
];
