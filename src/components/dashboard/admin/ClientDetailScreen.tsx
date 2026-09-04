'use client';

import { useState } from 'react';
import { Button } from 'antd';
import type { TableProps } from 'antd';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, CircleCheck, Clock, Plus } from 'lucide-react';
import {
  INITIAL_NEW_EVENT_STATE,
  type NewEventState,
} from '@/app/admin/(authenticated)/eventos/form-state';
import type { NewEventOptions } from '@/application/events/create-event';
import type { ClientSummary } from '@/domain/clients/client-repository';
import type { EventSummary } from '@/domain/events/event-repository';
import { formatDate, formatDaysUntil, isUpcoming } from '../format';
import { CodeCell, IdentityCell } from '../primitives/Cell';
import { DataTable } from '../primitives/DataTable';
import { FactList } from '../primitives/FactList';
import { InvitationCell } from '../primitives/InvitationCell';
import { PageHeader } from '../primitives/PageHeader';
import { SectionCard } from '../primitives/SectionCard';
import { StatCard } from '../primitives/StatCard';
import { StatusPill } from '../primitives/StatusPill';
import { clientStatus, eventStatus } from '../primitives/status-display';
import { NewEventDialog, NewEventNotice } from './NewEventDialog';

/**
 * Un cliente visto desde la plataforma: su ficha y todos sus eventos.
 *
 * Es la pantalla que faltaba. `ListEventsOfClient` existía en `application/events` desde que
 * se rehízo el modelo —con su autorización y su contexto de inquilino resueltos— pero ninguna
 * ruta la llamaba, así que para ver los eventos de un cliente había que filtrar a ojo la
 * lista global. Aquí se usa por fin, y por el camino correcto:
 * `withAuthorizedClientContext()` pide permiso a la base de datos ANTES de fijar el contexto,
 * así que Row-Level Security sigue puesta y `/admin` ve exactamente lo mismo que vería el
 * cliente, no una vista paralela sin aislamiento.
 *
 * ## Por qué el nombre del cliente no está en las migas de pan
 *
 * Las migas se derivan del menú, y el menú vive en el layout — que en Next solo recibe los
 * parámetros de SU segmento, no los de las rutas que cuelgan por debajo. El layout de
 * `(authenticated)/` no puede ver el `[id]` de esta página. En vez de montar un contexto para
 * empujar una cadena hacia arriba, el nombre va donde de todas formas hay que mirarlo —el
 * título— y el regreso lo da un botón explícito.
 */
export function ClientDetailScreen({
  client,
  events,
  options,
}: {
  readonly client: ClientSummary;
  readonly events: readonly EventSummary[];
  /** El catálogo con el que se llena el formulario de alta. */
  readonly options: NewEventOptions;
}) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<NewEventState>(INITIAL_NEW_EVENT_STATE);

  const published = events.filter((event) => event.status === 'published').length;
  const upcoming = events
    .filter((event) => isUpcoming(event.startsAt))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const next = upcoming.at(0);

  return (
    <>
      <PageHeader
        title={client.name}
        description={client.contactEmail ?? 'Sin correo de contacto registrado.'}
        actions={
          <>
            <Link href="/admin/clientes">
              <Button size="large" icon={<ArrowLeft size={16} strokeWidth={2} />}>
                Todos los clientes
              </Button>
            </Link>
            {/*
              El alta vive en la cabecera y no dentro de la tarjeta de eventos porque es la acción
              principal de esta pantalla: se entra a la ficha de un cliente sobre todo para darle
              su siguiente evento.
            */}
            <Button
              type="primary"
              size="large"
              icon={<Plus size={16} strokeWidth={2.25} />}
              onClick={() => setDialogOpen(true)}
            >
              Dar de alta evento
            </Button>
          </>
        }
      />

      <NewEventNotice state={feedback} onDismiss={() => setFeedback(INITIAL_NEW_EVENT_STATE)} />

      <div className="dash-grid">
        <StatCard icon={CalendarDays} tone="azure" label="Eventos" value={events.length} />
        <StatCard
          icon={CircleCheck}
          tone="sage"
          label="Publicados"
          value={published}
          suffix={events.length > 0 ? `de ${events.length}` : undefined}
        />
        <StatCard
          icon={Clock}
          tone="plum"
          label="Próximo"
          value={next ? formatDate(next.startsAt) : '—'}
          suffix={next ? formatDaysUntil(next.startsAt) : undefined}
        />
      </div>

      <div className="dash-split">
        <SectionCard
          title="Eventos del cliente"
          /*
           * El salto a la pantalla de eventos llega con este cliente ya elegido: el filtro
           * viaja en la URL, así que enlazarlo es lo mismo que preseleccionarlo. Solo se
           * ofrece si hay algo que ver — mandar a una tabla vacía no ayuda a nadie.
           */
          action={
            events.length > 0
              ? { label: 'Ver en Eventos', href: `/admin/eventos?cliente=${client.id}` }
              : undefined
          }
          flush
        >
          <DataTable
            rows={events}
            rowKey="id"
            minWidth={620}
            columns={columns}
            empty={{
              title: 'Este cliente todavía no tiene eventos',
              description:
                'Dale el primero desde «Dar de alta evento»: elegir plantilla, plan y tema es parte del servicio que se vende.',
            }}
          />
        </SectionCard>

        <SectionCard title="Ficha">
          <FactList
            facts={[
              { label: 'Identificador', value: <CodeCell>{client.slug}</CodeCell> },
              {
                label: 'Estado',
                value: <StatusPill appearance={clientStatus(client.status)} />,
              },
              { label: 'Correo', value: client.contactEmail },
              { label: 'Teléfono', value: client.contactPhone },
              { label: 'Alta', value: formatDate(client.createdAt) },
            ]}
          />
        </SectionCard>
      </div>

      {/*
        Con `client`: el evento es de este cliente y el campo no se enseña. El identificador viaja
        igualmente en el formulario, oculto — que no se vea no lo hace de fiar, y por eso quien
        autoriza sigue siendo la base de datos. Ver `NewEventDialog`.
      */}
      <NewEventDialog
        open={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        onResult={setFeedback}
        options={options}
        client={{ id: client.id, name: client.name }}
      />
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
    width: 164,
    sorter: (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
    defaultSortOrder: 'descend',
    render: (date: Date) => (
      <IdentityCell primary={formatDate(date)} secondary={formatDaysUntil(date)} />
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
