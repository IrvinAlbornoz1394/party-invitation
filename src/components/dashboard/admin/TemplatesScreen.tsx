'use client';

import { Alert } from 'antd';
import type { TableProps } from 'antd';
import type { EventTypeSummary, TemplateSummary } from '@/domain/catalog/catalog-repository';
import { pluralize } from '../format';
import { CodeCell, EmptyCell, IdentityCell } from '../primitives/Cell';
import { DataTable } from '../primitives/DataTable';
import { Meter } from '../primitives/Meter';
import { PageHeader } from '../primitives/PageHeader';
import { SectionCard } from '../primitives/SectionCard';
import { StatusPill } from '../primitives/StatusPill';
import { activeStatus } from '../primitives/status-display';

/**
 * Las plantillas de la biblioteca.
 *
 * Una plantilla define la estructura visual general de un evento y puede usar cualquier tema.
 * Esta pantalla es de **consulta**: el rol de la aplicación solo tiene `SELECT` sobre el
 * catálogo, así que no hay formulario de alta ni lo va a haber desde aquí. Ampliar la
 * biblioteca es una decisión de producto —`docs/PROJECT.md` la trata como desarrollo a
 * cotizar, no como autoservicio— y se hace con el rol dueño de Postgres.
 *
 * Decirlo en pantalla, y no dejar que se deduzca por la ausencia de botones, es lo que evita
 * la pregunta «¿por qué no puedo crear una plantilla aquí?».
 */
export function TemplatesScreen({
  templates,
  eventTypes,
}: {
  readonly templates: readonly TemplateSummary[];
  readonly eventTypes: readonly EventTypeSummary[];
}) {
  const orphaned = templates.filter((template) => template.planKeys.length === 0);

  return (
    <>
      <PageHeader
        title="Plantillas"
        description="La estructura visual con la que nace un evento. Cada plantilla trae su composición de bloques por defecto y se ofrece en los planes que tenga asignados."
      />

      {/*
        Una plantilla sin ningún plan no se puede elegir al crear un evento: existe en la
        base de datos y es inalcanzable desde el producto. Es un fallo silencioso —nada se
        rompe, simplemente no aparece— y por eso la pantalla lo señala en vez de dejar que
        se descubra cuando alguien pregunte dónde está.
      */}
      {orphaned.length > 0 && (
        <Alert
          className="dash-page-alert"
          type="warning"
          showIcon
          message={
            orphaned.length === 1
              ? 'Hay una plantilla sin plan asignado'
              : `Hay ${orphaned.length} plantillas sin plan asignado`
          }
          description={`Sin al menos un plan no se pueden ofrecer al crear un evento: ${orphaned
            .map((template) => template.name)
            .join(', ')}.`}
        />
      )}

      <div className="dash-split">
        <SectionCard
          title="Biblioteca de plantillas"
          subtitle={pluralize(templates.length, 'plantilla', 'plantillas')}
          flush
        >
          <DataTable
            rows={templates}
            rowKey="id"
            minWidth={720}
            columns={columns}
            empty={{
              title: 'No hay plantillas registradas',
              description:
                'Las plantillas se cargan con el seed o se dan de alta con el rol dueño de la base de datos.',
            }}
          />
        </SectionCard>

        <SectionCard
          title="Tipos de evento"
          subtitle="Cuántas plantillas cubre cada uno"
        >
          {eventTypes.length > 0 ? (
            <Meter
              rows={eventTypes.map((type) => ({ label: type.name, value: type.templateCount }))}
              total={templates.length}
            />
          ) : (
            <p className="dash-card__subtitle" style={{ margin: 0 }}>
              Todavía no hay tipos de evento registrados.
            </p>
          )}
        </SectionCard>
      </div>
    </>
  );
}

const columns: TableProps<TemplateSummary>['columns'] = [
  {
    title: 'Plantilla',
    dataIndex: 'name',
    key: 'name',
    render: (_value, template) => (
      <IdentityCell primary={template.name} secondary={template.description ?? undefined} />
    ),
  },
  {
    title: 'Clave',
    dataIndex: 'key',
    key: 'key',
    width: 156,
    render: (key: string) => <CodeCell>{key}</CodeCell>,
  },
  {
    /*
     * Los tipos son una lista desde que una plantilla dejó de pertenecer a uno: «editorial» es
     * una estructura, y la misma sirve para una boda y para una graduación. Se enseñan todos
     * porque la pregunta de esta pantalla es «¿dónde puedo usar esta plantilla?».
     */
    title: 'Tipos de evento',
    dataIndex: 'eventTypes',
    key: 'eventTypes',
    width: 260,
    render: (eventTypes: TemplateSummary['eventTypes']) =>
      eventTypes.length === 0 ? (
        <span className="dash-cell__secondary">No se sugiere para ninguno</span>
      ) : (
        <span className="dash-cell__secondary">
          {eventTypes.map((type) => type.name).join(' · ')}
        </span>
      ),
  },
  {
    title: 'Bloques',
    dataIndex: 'blockCount',
    key: 'blockCount',
    width: 96,
    align: 'right',
    sorter: (a, b) => a.blockCount - b.blockCount,
  },
  {
    title: 'Planes',
    dataIndex: 'planKeys',
    key: 'planKeys',
    width: 190,
    render: (planKeys: readonly string[]) =>
      planKeys.length === 0 ? (
        <EmptyCell />
      ) : (
        <span className="dash-chip-row">
          {planKeys.map((planKey) => (
            <CodeCell key={planKey}>{planKey}</CodeCell>
          ))}
        </span>
      ),
  },
  {
    title: 'Estado',
    dataIndex: 'isActive',
    key: 'isActive',
    width: 112,
    render: (isActive: boolean) => <StatusPill appearance={activeStatus(isActive)} />,
  },
];
