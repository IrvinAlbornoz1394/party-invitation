'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Segmented, Select } from 'antd';
import type { TableProps } from 'antd';
import { Plus, Search } from 'lucide-react';
import {
  INITIAL_NEW_EVENT_STATE,
  type NewEventState,
} from '@/app/admin/(authenticated)/eventos/form-state';
import type { NewEventOptions } from '@/application/events/create-event';
import type { ClientSummary } from '@/domain/clients/client-repository';
import type { EventSummary } from '@/domain/events/event-repository';
import { formatDate, formatDaysUntil, isUpcoming, pluralize } from '../format';
import { CodeCell, IdentityCell } from '../primitives/Cell';
import { DataTable } from '../primitives/DataTable';
import { InvitationCell } from '../primitives/InvitationCell';
import { PageHeader } from '../primitives/PageHeader';
import { SectionCard } from '../primitives/SectionCard';
import { StatusPill } from '../primitives/StatusPill';
import { eventStatus } from '../primitives/status-display';
import { NewEventDialog, NewEventNotice } from './NewEventDialog';

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
 *
 * El de cliente sí es un desplegable, y por lo contrario: los clientes crecen sin techo, así
 * que lo que hace falta ahí es **escribir para buscar**, no ver todas las opciones a la vez.
 *
 * ## Por qué el cliente vive en la URL y el resto no
 *
 * El estado y el texto son exploración —se cambian diez veces seguidas y no significan nada
 * fuera de esta sesión—, pero «los eventos de este cliente» es un sitio al que se llega desde
 * otra pantalla y que se quiere poder compartir o recargar. Por eso ese filtro se refleja en
 * `?cliente=<id>` y los otros dos no.
 */
/**
 * Los filtros de la lista.
 *
 * `review` es el que de verdad se usa a diario: es la bandeja de lo que espera a la plataforma.
 * Va justo después de «Todos» y antes que los demás por eso — el orden de una barra de filtros es
 * el orden en que se miran.
 */
type StatusFilter = 'todos' | 'review' | 'published' | 'draft' | 'archived';

export function EventsScreen({
  events,
  clients,
  selectedClientId,
  options,
}: {
  readonly events: readonly EventSummary[];
  readonly clients: readonly ClientSummary[];
  /** El cliente por el que se filtra, tal como llega en la URL. `null` es «todos». */
  readonly selectedClientId: string | null;
  /** El catálogo con el que se llena el formulario de alta. */
  readonly options: NewEventOptions;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('todos');
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<NewEventState>(INITIAL_NEW_EVENT_STATE);

  /*
   * `replace` y no `push`: cambiar de cliente es afinar la misma vista, no navegar. Con `push`,
   * volver atrás obligaría a deshacer un filtro por clic hasta salir de la pantalla.
   */
  const selectClient = (clientId?: string) => {
    router.replace(clientId ? `/admin/eventos?cliente=${clientId}` : '/admin/eventos', {
      scroll: false,
    });
  };

  /*
   * El cliente acota **antes** que todo lo demás, y de ahí salen los conteos. Si las pastillas
   * contaran sobre la lista completa, con un cliente elegido dirían «12 publicados» y la tabla
   * enseñaría dos: el número dejaría de describir lo que se está mirando.
   */
  const scoped = useMemo(
    () =>
      selectedClientId ? events.filter((event) => event.clientId === selectedClientId) : events,
    [events, selectedClientId],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return scoped.filter((event) => {
      if (status !== 'todos' && event.status !== status) return false;
      if (needle === '') return true;

      return [event.title, event.slug, event.clientName ?? '', event.planKey]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [scoped, query, status]);

  /*
   * Los conteos se calculan sobre la lista COMPLETA, no sobre la filtrada. Si contaran lo
   * filtrado, al elegir «Borrador» las demás pastillas dirían cero y dejarían de servir para
   * lo único que sirven: saber cuánto hay en cada estado antes de cambiar a él.
   */
  const selectedClient = clients.find((client) => client.id === selectedClientId) ?? null;

  const counts = useMemo(
    () => ({
      todos: scoped.length,
      review: scoped.filter((event) => event.status === 'review').length,
      published: scoped.filter((event) => event.status === 'published').length,
      draft: scoped.filter((event) => event.status === 'draft').length,
      archived: scoped.filter((event) => event.status === 'archived').length,
    }),
    [scoped],
  );

  return (
    <>
      <PageHeader
        title="Eventos"
        description={
          selectedClient
            ? `Los eventos de ${selectedClient.name}.`
            : 'Todo lo que está en marcha en la plataforma, de todos los clientes.'
        }
        actions={
          <Button
            type="primary"
            size="large"
            icon={<Plus size={16} strokeWidth={2.25} />}
            onClick={() => setDialogOpen(true)}
          >
            Dar de alta evento
          </Button>
        }
      />

      <NewEventNotice state={feedback} onDismiss={() => setFeedback(INITIAL_NEW_EVENT_STATE)} />

      <div className="dash-toolbar">
        <div className="dash-toolbar__filters">
          <Select
            showSearch
            allowClear
            size="large"
            placeholder="Todos los clientes"
            /*
              Se busca por la etiqueta —el nombre— y no por el valor, que es un UUID: filtrar
              por él no encontraría nada de lo que alguien puede llegar a teclear.
            */
            optionFilterProp="label"
            value={selectedClientId ?? undefined}
            onChange={(value?: string) => selectClient(value)}
            options={clients.map((client) => ({
              value: client.id,
              label: client.name,
            }))}
            style={{ minWidth: 224 }}
            aria-label="Filtrar por cliente"
          />
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
              { label: `En revisión (${counts.review})`, value: 'review' },
              { label: `Publicados (${counts.published})`, value: 'published' },
              { label: `Borradores (${counts.draft})`, value: 'draft' },
              { label: `Archivados (${counts.archived})`, value: 'archived' },
            ]}
          />
        </div>
        <span className="dash-toolbar__count">
          {filtered.length === scoped.length
            ? pluralize(scoped.length, 'evento', 'eventos')
            : `${filtered.length} de ${scoped.length}`}
        </span>
      </div>

      <SectionCard flush>
        <DataTable
          rows={filtered}
          rowKey="id"
          minWidth={760}
          columns={columns}
          /*
           * La fila lleva al **contenido del evento** y ya no a la ficha de su cliente.
           *
           * Es donde se va a trabajar: revisar lo que mandó el cliente, completar lo que falte y
           * publicar. Llegar al cliente para después buscar el evento en su lista era un rodeo
           * en la pantalla que existe precisamente para no darlo.
           */
          rowHref={(event) => `/admin/eventos/${event.id}/contenido`}
          empty={
            /*
              Tres vacíos distintos, porque piden tres cosas distintas: dar de alta un evento,
              elegir otro cliente, o aflojar el filtro. Uno solo mandaría a la mitad de la gente
              al sitio equivocado.
            */
            events.length === 0
              ? {
                  title: 'Todavía no hay eventos en ningún cliente',
                  description:
                    'Da de alta el primero desde el botón de arriba: se elige su plan, su plantilla y su tema, y nace con su invitación lista para llenar.',
                }
              : scoped.length === 0
                ? {
                    title: `${selectedClient?.name ?? 'Este cliente'} todavía no tiene eventos`,
                    description:
                      'Quita el filtro de cliente para ver los del resto de la plataforma.',
                  }
                : {
                    title: 'Ningún evento coincide',
                    description: 'Prueba con otro texto o cambia el filtro de estado.',
                  }
          }
        />
      </SectionCard>

      {/*
        Sin `client`: desde aquí se ven todos, así que hay que elegir a cuál pertenece. El cliente
        del filtro NO se pasa como fijo a propósito — filtrar una lista es mirar, y dar de alta es
        escribir; heredar lo uno en lo otro crearía el evento en el cliente que quedó filtrado de
        una visita anterior.
      */}
      <NewEventDialog
        open={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        onResult={setFeedback}
        options={options}
        clients={clients}
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
    width: 168,
    /*
     * El estado y, debajo, a quién espera. Son dos datos y no uno: un borrador que espera al
     * cliente y uno que nos espera a nosotros se ven igual en la pastilla, y son trabajos
     * distintos —a uno hay que perseguirlo, al otro hay que hacerlo—.
     *
     * Solo se dice cuando aporta: un evento publicado ya no espera a nadie.
     */
    render: (status: string, event) => (
      <div>
        <StatusPill appearance={eventStatus(status)} />
        {event.clientFillsContent && status !== 'published' && status !== 'archived' && (
          <span className="dash-cell__secondary">Esperando al cliente</span>
        )}
      </div>
    ),
  },
];
