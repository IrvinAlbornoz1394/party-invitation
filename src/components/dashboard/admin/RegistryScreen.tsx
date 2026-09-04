'use client';

import { useState } from 'react';
import { Tabs, Tooltip } from 'antd';
import type { TableProps } from 'antd';
import type {
  BlockSummary,
  ComponentVariantSummary,
  PlanSummary,
} from '@/domain/catalog/catalog-repository';
import { compareBlockKeys } from '@/domain/invitation/blocks/block-order';
import { pluralize } from '../format';
import { blockIcon } from './block-icons';
import { PhoneStage, type PreviewTheme } from './BlockPreview';
import { previewableVariants } from './previewable-variants';
import { CodeCell, IdentityCell } from '../primitives/Cell';
import { DataTable } from '../primitives/DataTable';
import { EmptyState } from '../primitives/EmptyState';
import { PageHeader } from '../primitives/PageHeader';
import { SectionCard } from '../primitives/SectionCard';
import { StatusPill } from '../primitives/StatusPill';
import { activeStatus } from '../primitives/status-display';

/**
 * El Component Registry: los doce bloques y sus variantes, con el móvil al lado.
 *
 * ## Por qué una tabla y no tarjetas
 *
 * Porque esto es un **índice**, no un escaparate. Las tarjetas se pusieron cuando el bloque más
 * grande tenía cuatro variantes y se abarcaban de un vistazo; hoy la bienvenida tiene doce y las
 * galerías diez, y una rejilla de doce tarjetas obliga a leer en zigzag para responder a la única
 * pregunta que se hace aquí —«¿cuál es cuál y desde qué plan?»—. En columnas, la respuesta está
 * alineada y se lee de arriba abajo.
 *
 * La tabla es además la pieza que ya usan las otras seis pantallas del panel (`DataTable`), así
 * que esta deja de ser la rara: paginación, estado vacío y teclado se comportan igual en todas.
 *
 * ## Por qué el teléfono y no una ventana
 *
 * Antes, cada variante traía un botón que abría un modal. Para comparar dos había que abrir,
 * mirar, cerrar y volver a abrir — y comparar es justo lo que se hace en esta pantalla, porque de
 * eso va el catálogo. Con el marco puesto al lado, elegir una fila cambia lo que se ve y nada
 * más: se recorre la tabla con las flechas y el teléfono va enseñando.
 *
 * La ventana grande no se retira: sigue en «Temas», donde lo que se compara es el tema y hace
 * falta el ancho de escritorio.
 *
 * ## Las pestañas van sin texto
 *
 * Doce bloques con su nombre no caben en una barra sin partirse en dos filas o abrir un
 * desplegable de «más», y las dos salidas esconden la mitad del catálogo. Con el dibujo solo, los
 * doce caben siempre y el nombre lo da el `title` al pasar por encima —y a los lectores de
 * pantalla, un texto oculto que no depende del ratón, que es lo que un `tooltip` a secas no
 * garantiza.
 */
export function RegistryScreen({
  blocks,
  plans,
  themes,
}: {
  readonly blocks: readonly BlockSummary[];
  readonly plans: readonly PlanSummary[];
  readonly themes: readonly PreviewTheme[];
}) {
  const variantCount = blocks.reduce((total, block) => total + block.variants.length, 0);
  const previewVariants = previewableVariants(blocks);
  const registered = new Set(previewVariants.map((variant) => variant.registryId));
  const orderedBlocks = [...blocks].sort((a, b) => compareBlockKeys(a.key, b.key));

  /*
   * El tema vive aquí y no dentro del teléfono: se elige una vez y se mantiene al cambiar de
   * variante y de bloque, que es como se usa —«a ver cómo queda todo esto en Emerald»—. Dentro
   * del marco se reiniciaría en cada pestaña.
   */
  const [themeKey, setThemeKey] = useState(themes[0]?.key ?? '');

  return (
    <>
      <PageHeader
        title="Componentes"
        description={`El registro de bloques y variantes con el que se arma cada invitación. ${pluralize(
          blocks.length,
          'bloque',
          'bloques',
        )} y ${pluralize(variantCount, 'variante', 'variantes')} dadas de alta, de las que ${
          previewVariants.length
        } ya tienen componente y se pueden ver aquí mismo.`}
      />

      {blocks.length === 0 ? (
        <SectionCard>
          <EmptyState
            title="El registro está vacío"
            description="Los bloques y sus variantes se cargan con el seed o se dan de alta con el rol dueño de la base de datos."
          />
        </SectionCard>
      ) : (
        <Tabs
          className="dash-tabs dash-tabs--icons"
          defaultActiveKey={orderedBlocks[0]?.key}
          items={orderedBlocks.map((block) => {
            const Icon = blockIcon(block.key);

            return {
              key: block.key,
              label: (
                <Tooltip title={block.name} placement="bottom">
                  <span className="dash-tab dash-tab--icon">
                    <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
                    {/* El nombre, para quien no ve el dibujo ni puede pasar el ratón. */}
                    <span className="dash-sr-only">{block.name}</span>
                  </span>
                </Tooltip>
              ),
              children: (
                <BlockPanel
                  block={block}
                  plans={plans}
                  themes={themes}
                  themeKey={themeKey}
                  onThemeChange={setThemeKey}
                  registered={registered}
                />
              ),
            };
          })}
        />
      )}
    </>
  );
}

/**
 * Un bloque: su ficha, la tabla de variantes y el teléfono.
 *
 * Es un componente aparte y no el cuerpo de un `map` porque **tiene estado**: cuál es la variante
 * elegida. Escrito dentro del `map`, el estado sería uno solo para los doce bloques y cambiar de
 * pestaña dejaría seleccionada una variante que no está en la tabla que se está mirando.
 */
function BlockPanel({
  block,
  plans,
  themes,
  themeKey,
  onThemeChange,
  registered,
}: {
  readonly block: BlockSummary;
  readonly plans: readonly PlanSummary[];
  readonly themes: readonly PreviewTheme[];
  readonly themeKey: string;
  readonly onThemeChange: (key: string) => void;
  readonly registered: ReadonlySet<string>;
}) {
  /* Se abre con la primera que se pueda ver, no con la primera de la lista: un teléfono vacío al
     entrar en la pestaña no dice nada, y las variantes sin componente son la excepción. */
  const firstRenderable = block.variants.find((variant) => registered.has(variant.registryId));
  const [registryId, setRegistryId] = useState<string | null>(
    firstRenderable?.registryId ?? null,
  );

  const planForRank = (rank: number): string | null => {
    const eligible = [...plans].sort((a, b) => a.rank - b.rank).find((plan) => plan.rank >= rank);

    return eligible?.name ?? null;
  };

  const columns: TableProps<ComponentVariantSummary>['columns'] = [
    {
      title: 'Variante',
      dataIndex: 'name',
      /* El nombre manda y el identificador va debajo: lo que se busca con la vista es «la de los
         discos», y lo que luego se copia al configurar el evento es `dresscode.discs`. Los dos
         hacen falta, en ese orden. */
      render: (_value, variant) => (
        <IdentityCell primary={variant.name} secondary={<CodeCell>{variant.registryId}</CodeCell>} />
      ),
    },
    {
      title: 'Desde',
      dataIndex: 'minPlanRank',
      width: 130,
      render: (_value, variant) => {
        const planName = planForRank(variant.minPlanRank);

        return variant.minPlanRank === 0 || planName === null ? (
          <span className="dash-cell__secondary">Todos los planes</span>
        ) : (
          <span className="dash-cell__secondary">{planName}</span>
        );
      },
    },
    {
      /* Que una variante esté dada de alta y no tenga componente es el aviso más útil de esta
         pantalla: asignarla a un evento dejaría el bloque en blanco. Antes se deducía de que no
         hubiera botón de «ver ejemplo», que es enterarse por una ausencia. */
      title: 'Componente',
      dataIndex: 'registryId',
      width: 130,
      render: (_value, variant) =>
        registered.has(variant.registryId) ? (
          <span className="dash-cell__secondary">Registrado</span>
        ) : (
          <span className="dash-cell__warning">Sin componente</span>
        ),
    },
    {
      title: 'Estado',
      dataIndex: 'isActive',
      width: 110,
      render: (_value, variant) => <StatusPill appearance={activeStatus(variant.isActive)} />,
    },
  ];

  return (
    <div className="dash-registry">
      <div className="dash-registry__list">
        <SectionCard
          title={block.name}
          subtitle={pluralize(block.variants.length, 'variante', 'variantes')}
          flush
        >
          <div className="dash-block__intro">
            <p className="dash-block__description">
              {block.description ??
                'Sin descripción. Se añade en la tabla «blocks» de la base de datos.'}
            </p>
            <p className="dash-block__requirement">
              {block.featureName
                ? `Requiere la funcionalidad «${block.featureName}»`
                : 'Disponible en todos los planes'}
            </p>
          </div>

          <DataTable
            rows={block.variants}
            rowKey="registryId"
            minWidth={520}
            columns={columns}
            activeRowKey={registryId}
            onRowSelect={(variant) => setRegistryId(variant.registryId)}
            pageSize={50}
            empty={{
              title: 'Este bloque no tiene variantes',
              description:
                'Sin al menos una variante registrada, el bloque no se puede usar en ninguna plantilla.',
            }}
          />
        </SectionCard>
      </div>

      <aside className="dash-registry__preview">
        <PhoneStage
          registryId={registryId}
          themes={themes}
          themeKey={themeKey}
          onThemeChange={onThemeChange}
        />
      </aside>
    </div>
  );
}
