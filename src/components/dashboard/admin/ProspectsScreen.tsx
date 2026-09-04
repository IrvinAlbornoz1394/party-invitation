'use client';

import { useMemo, useState } from 'react';
import { Input, Segmented } from 'antd';
import type { TableProps } from 'antd';
import { Ban, CircleCheck, Inbox, MessageCircle, Search } from 'lucide-react';
import { isOverdue, type Prospect } from '@/domain/prospects/prospect';
import { formatDate, pluralize } from '../format';
import { EmptyCell, IdentityCell } from '../primitives/Cell';
import { DataTable } from '../primitives/DataTable';
import { PageHeader } from '../primitives/PageHeader';
import { SectionCard } from '../primitives/SectionCard';
import { StatCard } from '../primitives/StatCard';
import { StatusPill } from '../primitives/StatusPill';
import { prospectStatus, type StatusAppearance } from '../primitives/status-display';

/**
 * La bandeja de prospectos.
 *
 * ## Es una bandeja de trabajo, no un archivo
 *
 * Llega ya ordenada por urgencia desde el caso de uso —primero los nuevos sin contactar, luego los
 * que toca insistir, luego el resto— y sin los cerrados. Esa es la diferencia entre abrirla cada
 * mañana y no abrirla nunca: una lista por fecha obliga a leerla entera para saber qué hacer.
 *
 * ## Las cerradas se pueden mirar, y por eso no se pierden
 *
 * Ganadas y descartadas salen de la lista abierta pero no de la pantalla: están detrás de las otras
 * dos pastillas. Es lo que responde «¿qué pasó con aquella?» seis meses después, y lo que hace que
 * descartar no dé miedo — una decisión que se puede consultar y deshacer se toma a tiempo, y la
 * bandeja se queda con lo que de verdad sigue vivo.
 *
 * Las de «Descartadas» enseñan **por qué** en lugar del estado. Que estén ahí ya dice que se
 * cerraron; lo que no se sabe de memoria es si fue el precio o la fecha, que es justo lo que hay
 * que mirar cuando se repite.
 *
 * ## El vencimiento se calcula, no se guarda
 *
 * `isOverdue` compara la fecha de seguimiento con el ahora. Guardarlo como estado obligaría a que
 * alguien lo actualizara cada día, y el primer día que no lo hiciera la bandeja empezaría a
 * mentir. Ver `domain/prospects/prospect.ts`.
 */
export function ProspectsScreen({
  prospects,
  closed,
  now,
}: {
  /** Las abiertas, ya ordenadas por urgencia. */
  readonly prospects: readonly Prospect[];
  /** Las que ya tuvieron desenlace, de la más reciente a la más antigua. */
  readonly closed: readonly Prospect[];
  /**
   * El ahora llega del servidor y no se lee en el navegador. Con un `new Date()` aquí, el render
   * del servidor y la hidratación podrían pintar «toca insistir» distinto en el mismo segundo.
   */
  readonly now: Date;
}) {
  const [view, setView] = useState<ProspectView>('open');
  const [query, setQuery] = useState('');

  const won = useMemo(() => closed.filter((prospect) => prospect.status === 'won'), [closed]);
  const lost = useMemo(() => closed.filter((prospect) => prospect.status === 'lost'), [closed]);

  const listed = view === 'open' ? prospects : view === 'won' ? won : lost;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (needle === '') return listed;

    // Por nombre, teléfono y correo: las tres cosas por las que alguien busca cuando le acaban de
    // contestar un mensaje y no recuerda de quién era.
    return listed.filter((prospect) =>
      [prospect.contactName, prospect.contactPhone, prospect.contactEmail ?? '']
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [listed, query]);

  return (
    <>
      <PageHeader
        title="Prospectos"
        description="Quién pidió información y a quién toca escribirle. Al contratar se vuelve cliente; si no, se descarta con su motivo."
      />

      <div className="dash-grid">
        <StatCard
          icon={Inbox}
          tone="plum"
          label="Solicitudes"
          value={prospects.length + closed.length}
        />
        <StatCard
          icon={MessageCircle}
          tone="azure"
          label="En conversación"
          value={prospects.length}
        />
        <StatCard icon={CircleCheck} tone="sage" label="Se volvieron cliente" value={won.length} />
        <StatCard icon={Ban} tone="slate" label="Descartadas" value={lost.length} />
      </div>

      <div className="dash-toolbar">
        <div className="dash-toolbar__filters">
          <Input
            allowClear
            size="large"
            placeholder="Buscar por nombre, teléfono o correo"
            prefix={<Search size={16} strokeWidth={1.5} aria-hidden="true" />}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{ maxWidth: 340 }}
            aria-label="Buscar prospectos"
          />
          {/*
            Los conteos van en la propia pastilla y se calculan sobre las listas completas, no
            sobre lo filtrado: sirven para saber cuánto hay al otro lado antes de cambiar de vista.
          */}
          <Segmented<ProspectView>
            value={view}
            onChange={setView}
            options={[
              { label: `Abiertas (${prospects.length})`, value: 'open' },
              { label: `Clientes (${won.length})`, value: 'won' },
              { label: `Descartadas (${lost.length})`, value: 'lost' },
            ]}
          />
        </div>
        <span className="dash-toolbar__count">
          {filtered.length === listed.length
            ? pluralize(listed.length, 'solicitud', 'solicitudes')
            : `${filtered.length} de ${listed.length}`}
        </span>
      </div>

      <SectionCard flush>
        <DataTable
          rows={filtered}
          rowKey="id"
          minWidth={860}
          columns={columnsFor(view, now)}
          rowHref={(prospect) => `/admin/prospectos/${prospect.id}`}
          empty={
            query.trim() === ''
              ? EMPTY[view]
              : {
                  title: 'Nadie coincide con esa búsqueda',
                  description: 'Prueba con el teléfono o con parte del nombre.',
                }
          }
        />
      </SectionCard>
    </>
  );
}

type ProspectView = 'open' | 'won' | 'lost';

/*
 * Las dos urgencias de la columna de seguimiento. No son estados guardados —una se deduce de una
 * fecha vencida y la otra de una bitácora vacía— así que no viven en `status-display.ts`, que
 * traduce lo que sí existe en la base de datos. Van en la misma pastilla que los estados para que
 * la tabla se lea como una sola cosa.
 */
const OVERDUE: StatusAppearance = { label: 'Toca insistir', tone: 'danger' };
const UNTOUCHED: StatusAppearance = { label: 'Sin contactar', tone: 'pending' };

/**
 * Las columnas cambian con la vista, y esa es la idea.
 *
 * Las tres comparten quién escribió y qué pidió, y se diferencian en la última: en las abiertas lo
 * que importa es a quién toca escribirle; en las cerradas, cómo acabó. Mantener «Estado» en las
 * cerradas sería una columna que repite lo que ya dice la pastilla elegida arriba, ocupando el
 * sitio de lo único que ahí se quiere leer.
 */
function columnsFor(view: ProspectView, now: Date): TableProps<Prospect>['columns'] {
  const identity: TableProps<Prospect>['columns'] = [
    {
      title: 'Quién',
      dataIndex: 'contactName',
      key: 'contactName',
      render: (_value, prospect) => (
        <IdentityCell primary={prospect.contactName} secondary={prospect.contactPhone} />
      ),
    },
    {
      title: 'Qué pide',
      key: 'asks',
      render: (_value, prospect) => {
        /*
         * Se concatena lo que haya en vez de dar una columna a cada cosa. Casi todos estos campos
         * son opcionales, así que cuatro columnas estarían vacías la mayor parte del tiempo y la
         * tabla se leería peor que con una línea que dice justo lo que esa persona contó.
         */
        const parts = [
          prospect.eventTypeKey,
          prospect.planKey,
          prospect.templateKey,
          prospect.guestRange,
        ].filter((part): part is string => Boolean(part));

        return parts.length > 0 ? <span>{parts.join(' · ')}</span> : <EmptyCell />;
      },
    },
  ];

  const arrival: TableProps<Prospect>['columns'] = [
    {
      title: 'Llegó',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 132,
      render: (_value, prospect) => (
        <span className="dash-cell__secondary">{formatDate(prospect.createdAt)}</span>
      ),
    },
  ];

  if (view === 'won') {
    return [
      ...identity,
      {
        title: 'Cliente',
        key: 'client',
        width: 220,
        render: (_value, prospect) =>
          prospect.clientName ? <span>{prospect.clientName}</span> : <EmptyCell />,
      },
      ...arrival,
    ];
  }

  if (view === 'lost') {
    return [
      ...identity,
      {
        title: 'Por qué se descartó',
        key: 'lostReason',
        width: 260,
        render: (_value, prospect) =>
          prospect.lostReason ? <span>{prospect.lostReason}</span> : <EmptyCell />,
      },
      ...arrival,
    ];
  }

  return [
    ...identity,
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      width: 132,
      render: (_value, prospect) => <StatusPill appearance={prospectStatus(prospect.status)} />,
    },
    {
      title: 'Seguimiento',
      key: 'followUp',
      width: 168,
      render: (_value, prospect) => {
        if (isOverdue(prospect, now)) return <StatusPill appearance={OVERDUE} />;
        if (prospect.touchCount === 0) return <StatusPill appearance={UNTOUCHED} />;
        if (prospect.nextFollowUpAt) return <span>{formatDate(prospect.nextFollowUpAt)}</span>;

        return <EmptyCell />;
      },
    },
    ...arrival,
  ];
}

/**
 * El vacío de cada vista dice algo distinto, y ninguno es un fallo.
 *
 * Una bandeja abierta vacía es el estado deseable —está todo atendido—, mientras que «todavía
 * nadie se volvió cliente» es un dato del embudo. Un solo texto genérico haría leer los tres como
 * si faltara algo.
 */
const EMPTY: Record<ProspectView, { readonly title: string; readonly description: string }> = {
  open: {
    title: 'No hay solicitudes abiertas',
    description:
      'Cuando alguien llene el formulario de la web, aparecerá aquí. Las cerradas siguen contando en las cifras de arriba.',
  },
  won: {
    title: 'Todavía ninguna se volvió cliente',
    description:
      'Al cerrar una venta, crea su cliente desde la ficha de la solicitud y aparecerá en esta lista.',
  },
  lost: {
    title: 'No has descartado ninguna',
    description:
      'Cuando una solicitud ya no vaya a comprar, descártala desde su ficha con el motivo: sale de la bandeja y se queda aquí.',
  },
};
