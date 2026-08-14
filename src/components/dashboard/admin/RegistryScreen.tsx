'use client';

import { Tabs } from 'antd';
import type { BlockSummary, PlanSummary } from '@/domain/catalog/catalog-repository';
import { compareBlockKeys } from '@/domain/invitation/blocks/block-order';
import { pluralize } from '../format';
import { blockIcon } from './block-icons';
import { BlockPreviewButton, type PreviewTheme } from './BlockPreview';
import { previewableVariants } from './previewable-variants';
import { CodeCell } from '../primitives/Cell';
import { EmptyState } from '../primitives/EmptyState';
import { PageHeader } from '../primitives/PageHeader';
import { SectionCard } from '../primitives/SectionCard';
import { StatusPill } from '../primitives/StatusPill';
import { activeStatus } from '../primitives/status-display';

/**
 * El Component Registry: qué bloques existen y qué variantes tiene cada uno.
 *
 * Es la pantalla que materializa la regla central de la arquitectura —«el sistema nunca
 * conocerá directamente los componentes, únicamente sus identificadores»—. Lo que se lista
 * aquí son los `registry_id` (`hero.classic`, `gallery.masonry`) con los que el Template
 * Renderer resuelve qué componente pintar.
 *
 * Se agrupa por bloque en lugar de dar una tabla plana de variantes porque la pregunta que
 * se trae aquí es «¿qué opciones tengo para la galería?», no «¿qué variantes hay en total?».
 * Una tabla ordenable por bloque respondería lo mismo con más pasos.
 *
 * ## Por qué pestañas y no una lista de tarjetas
 *
 * Los once bloques apilados hacían una página de varias pantallas en la que la portada —el
 * bloque con el que se empieza a armar cualquier invitación— caía cerca del final, porque la
 * base de datos los devuelve por nombre y «Portada» va después de «Galería» en el alfabeto.
 * Con pestañas, cada bloque es un destino y el orden es el de lectura de una invitación
 * (`domain/invitation/blocks/block-order.ts`): portada, historia, detalles… hasta el pie.
 *
 * Es además la forma que aguanta el crecimiento: las variantes de un bloque van a pasar de dos
 * a seis, y en una lista apilada eso empuja el resto de bloques cada vez más abajo, mientras
 * que aquí solo hace más alto el panel que se está mirando.
 *
 * `registry_id` es una columna GENERADA en la base de datos a partir del bloque y la
 * variante, así que es imposible que el identificador se desincronice de lo que nombra. Por
 * eso se muestra tal cual y en monoespaciada: es la cadena exacta que hay que registrar en el
 * mapa del frontend.
 *
 * ## Catálogo y código no van al mismo paso
 *
 * Una variante puede estar dada de alta aquí y no existir todavía como componente —así se
 * sembró el registro, con las veinte variantes previstas—, y esa diferencia importa: asignar a
 * un evento una variante sin componente deja su bloque sin pintar. La pantalla la enseña en
 * lugar de esconderla: las que ya se pueden ver llevan botón de ejemplo, y las que no,
 * ninguno.
 */
export function RegistryScreen({
  blocks,
  plans,
  themes,
}: {
  readonly blocks: readonly BlockSummary[];
  readonly plans: readonly PlanSummary[];
  /** Los temas del catálogo, para poder cruzar variante y tema en la previsualización. */
  readonly themes: readonly PreviewTheme[];
}) {
  const variantCount = blocks.reduce((total, block) => total + block.variants.length, 0);

  /*
   * Todas las previsualizables, no solo la de la tarjeta que se pulse. La ventana permite
   * saltar de una variante a otra sin cerrarse, que es como se comparan de verdad:
   * `hero.classic` y `hero.split` con el mismo contenido y el mismo tema, alternando.
   */
  const previewVariants = previewableVariants(blocks);
  const registered = new Set(previewVariants.map((variant) => variant.registryId));

  /*
   * En orden de lectura de la invitación, no en el alfabético con el que llegan. Se copia
   * antes de ordenar porque `sort` muta, y `blocks` es una propiedad: ordenarla en el sitio
   * reordenaría el array que el servidor pasó, que es justo el tipo de efecto que aparece
   * como un fallo intermitente cuando otro componente lee la misma referencia.
   */
  const orderedBlocks = [...blocks].sort((a, b) => compareBlockKeys(a.key, b.key));

  /*
   * Los rangos se traducen a nombres de plan. `min_plan_rank` es un número que solo significa
   * algo comparado con `plans.rank`, y enseñar «rango 2» obliga a ir a otra pantalla a
   * averiguar cuál es el plan 2. Se busca el plan MÁS BAJO que alcanza ese rango, que es
   * exactamente lo que la regla de negocio quiere decir: «a partir de este plan».
   */
  const planForRank = (rank: number): string | null => {
    const eligible = [...plans].sort((a, b) => a.rank - b.rank).find((plan) => plan.rank >= rank);

    return eligible?.name ?? null;
  };

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
          className="dash-tabs"
          /*
           * No controlada: la pestaña abierta no es un dato que nadie más necesite, y
           * gobernarla con estado propio solo añadiría un `useState` que hace exactamente lo
           * que antd ya hace. La primera es la portada, por el orden de lectura.
           */
          defaultActiveKey={orderedBlocks[0]?.key}
          items={orderedBlocks.map((block) => {
            const Icon = blockIcon(block.key);

            return {
              key: block.key,
              label: (
                <span className="dash-tab">
                  <Icon size={15} strokeWidth={1.8} />
                  {block.name}
                </span>
              ),
              children: (
                <SectionCard>
                  {/* La descripción y el plan que exige el bloque van juntos y arriba: son lo
                      que hay que saber ANTES de comparar variantes, no un pie de página. */}
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

                  {block.variants.length === 0 ? (
                    <p className="dash-cell__secondary" style={{ margin: 0 }}>
                      Este bloque todavía no tiene ninguna variante registrada, así que no se
                      puede usar en una plantilla.
                    </p>
                  ) : (
                    <ul className="dash-variants">
                      {block.variants.map((variant) => {
                        const planName = planForRank(variant.minPlanRank);

                        return (
                          <li className="dash-variant" key={variant.id}>
                            <div className="dash-variant__head">
                              <CodeCell>{variant.registryId}</CodeCell>
                              <StatusPill appearance={activeStatus(variant.isActive)} />
                            </div>
                            <p className="dash-variant__name">{variant.name}</p>
                            {variant.description && (
                              <p className="dash-variant__description">{variant.description}</p>
                            )}
                            <p className="dash-variant__plan">
                              {variant.minPlanRank === 0 || planName === null
                                ? 'Desde el plan más básico'
                                : `Desde ${planName}`}
                            </p>

                            {registered.has(variant.registryId) && (
                              <div className="dash-variant__actions">
                                <BlockPreviewButton
                                  variants={previewVariants}
                                  themes={themes}
                                  initialRegistryId={variant.registryId}
                                  block
                                />
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </SectionCard>
              ),
            };
          })}
        />
      )}
    </>
  );
}
