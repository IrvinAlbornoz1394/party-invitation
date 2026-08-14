'use client';

import { useMemo, useState } from 'react';
import { Alert, Button, Input } from 'antd';
import type { TableProps } from 'antd';
import { Plus, Search } from 'lucide-react';
import { IDLE_ACTION_STATE, type ActionState } from '@/app/action-state';
import type { ClientSummary } from '@/domain/clients/client-repository';
import { formatDate, pluralize } from '../format';
import { CodeCell, EmptyCell, IdentityCell } from '../primitives/Cell';
import { DataTable } from '../primitives/DataTable';
import { PageHeader } from '../primitives/PageHeader';
import { SectionCard } from '../primitives/SectionCard';
import { StatusPill } from '../primitives/StatusPill';
import { clientStatus } from '../primitives/status-display';
import { NewClientDialog } from './NewClientDialog';

/**
 * Alta y listado de clientes.
 *
 * El filtro es local, sobre la lista que ya está en memoria, y no una consulta al servidor.
 * Con decenas de clientes es instantáneo y no gasta un viaje por pulsación; el día que la
 * lista se pagine habrá que subirlo al servidor, y la señal será la misma que para las cifras
 * del resumen: en cuanto deje de traerse entera, filtrar aquí empezaría a mentir.
 */
export function ClientsScreen({ clients }: { readonly clients: readonly ClientSummary[] }) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<ActionState>(IDLE_ACTION_STATE);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (needle === '') return clients;

    // Se busca por nombre, identificador y correo: son las tres cosas por las que alguien
    // llega preguntando en soporte.
    return clients.filter((client) =>
      [client.name, client.slug, client.contactEmail ?? '']
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [clients, query]);

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Cada cliente tiene sus propios eventos y su propio equipo. Dar de alta uno crea también su primera cuenta."
        actions={
          <Button
            type="primary"
            size="large"
            icon={<Plus size={16} strokeWidth={2.25} />}
            onClick={() => setDialogOpen(true)}
          >
            Dar de alta cliente
          </Button>
        }
      />

      {/* El resultado del alta se anuncia además de mostrarse: quien acaba de enviar el
          formulario puede tener el foco lejos de este punto de la página. */}
      <div role="status" aria-live="polite">
        {feedback.message && (
          <Alert
            className="dash-page-alert"
            type={feedback.status === 'error' ? 'error' : 'success'}
            showIcon
            closable
            message={feedback.message}
            onClose={() => setFeedback(IDLE_ACTION_STATE)}
          />
        )}
      </div>

      <div className="dash-toolbar">
        <Input
          allowClear
          size="large"
          placeholder="Buscar por nombre, identificador o correo"
          prefix={<Search size={16} strokeWidth={1.5} aria-hidden="true" />}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={{ maxWidth: 380 }}
          aria-label="Buscar clientes"
        />
        <span className="dash-toolbar__count">
          {filtered.length === clients.length
            ? pluralize(clients.length, 'cliente', 'clientes')
            : `${filtered.length} de ${clients.length}`}
        </span>
      </div>

      <SectionCard flush>
        <DataTable
          rows={filtered}
          rowKey="id"
          minWidth={720}
          columns={columns}
          rowHref={(client) => `/admin/clientes/${client.id}`}
          empty={
            query.trim() === ''
              ? {
                  title: 'Todavía no hay clientes',
                  description:
                    'Da de alta el primero para empezar. Se creará junto con la cuenta de su persona responsable.',
                }
              : {
                  title: 'Ningún cliente coincide',
                  description: `No hay resultados para «${query.trim()}». Prueba con parte del nombre o del correo.`,
                }
          }
        />
      </SectionCard>

      <NewClientDialog
        open={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        onResult={setFeedback}
      />
    </>
  );
}

const columns: TableProps<ClientSummary>['columns'] = [
  {
    title: 'Cliente',
    dataIndex: 'name',
    key: 'name',
    render: (_value, client) => (
      <IdentityCell primary={client.name} secondary={client.contactEmail ?? undefined} />
    ),
  },
  {
    title: 'Identificador',
    dataIndex: 'slug',
    key: 'slug',
    width: 176,
    render: (slug: string) => <CodeCell>{slug}</CodeCell>,
  },
  {
    title: 'Eventos',
    dataIndex: 'eventCount',
    key: 'eventCount',
    width: 104,
    align: 'right',
    // Ordenable porque «quién tiene más eventos» es una pregunta real, y ordenar por ella a
    // ojo en una tabla de treinta filas no se puede.
    sorter: (a, b) => a.eventCount - b.eventCount,
    render: (count: number) => (count === 0 ? <EmptyCell /> : count),
  },
  {
    title: 'Estado',
    dataIndex: 'status',
    key: 'status',
    width: 128,
    render: (status: string) => <StatusPill appearance={clientStatus(status)} />,
  },
  {
    title: 'Alta',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 128,
    sorter: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    render: (date: Date) => <span className="dash-cell__secondary">{formatDate(date)}</span>,
  },
];
