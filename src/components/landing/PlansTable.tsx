import Link from 'next/link';
import clsx from 'clsx';
import type { PublicPlan } from '@/application/catalog/browse-showcase';

/** El nombre con el que el catálogo publica la confirmación en línea. */
const ONLINE_RSVP = 'Confirmación de asistencia en línea';

interface Row {
  readonly label: string;
  readonly note?: string;
  readonly cells: readonly string[];
}

/**
 * Los planes como una tabla grande, leída del catálogo real.
 *
 * Nada de lo que dice está escrito a mano. Las filas salen de las funcionalidades de cada plan:
 *
 *   - Lo que tienen **todos** se junta en una sola fila, «Lo esencial», con la lista debajo. Repetir
 *     ocho veces «Incluido» en tres columnas no le dice nada a nadie.
 *   - Lo que **cambia** de un plan a otro va en filas propias, que son las que de verdad se comparan.
 *   - La primera fila responde a la pregunta que más pesa —cómo confirman los invitados— y también
 *     se deduce del catálogo: si el plan trae la confirmación en línea, es en su enlace; si no, por
 *     WhatsApp.
 *
 * Las celdas contestan con palabras y no con marcas de verificación. El plan mayor va entero sobre
 * el color de acento, de la cabecera al botón: destaca por su columna, no por una etiqueta de
 * «recomendado».
 *
 * El precio sigue siendo «A medida», como en la versión anterior: el catálogo no lo tiene fijado.
 */
export function PlansTable({ plans }: { readonly plans: readonly PublicPlan[] }) {
  const ordered: string[] = [];
  for (const plan of plans) {
    for (const feature of plan.features) if (!ordered.includes(feature)) ordered.push(feature);
  }
  const common = ordered.filter((feature) => plans.every((plan) => plan.features.includes(feature)));
  const differing = ordered.filter((feature) => !common.includes(feature) && feature !== ONLINE_RSVP);

  const rows: Row[] = [
    {
      label: 'Cómo confirman tus invitados',
      cells: plans.map((plan) =>
        plan.features.includes(ONLINE_RSVP) ? 'En su enlace, y lo ves en tu panel' : 'Por WhatsApp',
      ),
    },
    ...(common.length > 0
      ? [{ label: 'Lo esencial', note: common.join(', '), cells: plans.map(() => 'Incluido') }]
      : []),
    ...differing.map((feature) => ({
      label: feature,
      cells: plans.map((plan) => (plan.features.includes(feature) ? 'Incluido' : 'No incluido')),
    })),
  ];

  const featured = plans.length - 1;

  return (
    <section id="planes" aria-labelledby="planes-titulo" className="px-5 py-12 sm:py-28 sm:px-8 lg:py-40">
      {plans.length === 0 ? (
        <div className="max-w-[40rem]">
          <h2 id="planes-titulo" className="l-display m-0 text-(length:--step-head)">
            Elige tu plan
          </h2>
          <p className="mt-5 mb-0">
            Cuéntanos de tu evento y te mandamos los planes con su precio.
          </p>
          <Link href="/cotizar" className="l-button l-button--accent mt-8">
            Cotizar mi evento
          </Link>
        </div>
      ) : (
        <>
          {/* Escritorio: la tabla */}
          <div data-reveal className="hidden lg:block">
            <table className="w-full table-fixed border-collapse text-left">
              <caption className="sr-only">Comparación de planes</caption>
              <colgroup>
                <col className="w-1/3" />
                {plans.map((plan) => (
                  <col key={plan.key} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th scope="col" className="px-5 pt-6 pb-8 align-top">
                    <h2 id="planes-titulo" className="l-display m-0 text-(length:--step-head) font-light">
                      Elige tu plan
                    </h2>
                  </th>
                  {plans.map((plan, index) => (
                    <th
                      key={plan.key}
                      scope="col"
                      className={clsx(
                        'rounded-t-[4px] px-6 pt-6 pb-8 align-top font-normal',
                        index === featured && 'bg-(--l-accent) text-(--l-accent-ink)',
                      )}
                    >
                      <span className="l-display block text-[clamp(1.75rem,2.6vw,2.75rem)] font-normal">
                        {plan.name.replace(/^Plan\s+/i, '')}
                      </span>
                      <span className="l-display block text-[clamp(1.75rem,2.6vw,2.75rem)]">
                        A medida
                      </span>
                      <span
                        className={clsx(
                          'mt-2 block text-(length:--step-body)',
                          index === featured ? 'text-white/85' : 'text-(--l-muted)',
                        )}
                      >
                        {plan.description ?? 'Según tu celebración'}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={row.label} className={clsx(rowIndex % 2 === 0 && 'bg-(--l-surface)')}>
                    <th scope="row" className="px-5 py-5 align-top text-(length:--step-lead) leading-snug font-normal">
                      {row.label}
                      {row.note && (
                        <span className="mt-2 block text-(length:--step-small) leading-normal text-(--l-muted)">
                          {row.note}
                        </span>
                      )}
                    </th>
                    {row.cells.map((cell, index) => (
                      <td
                        key={plans[index]?.key}
                        className={clsx(
                          'px-6 py-5 align-top text-(length:--step-lead) leading-snug',
                          index === featured
                            ? 'bg-(--l-accent) text-(--l-accent-ink)'
                            : cell === 'No incluido'
                              ? 'text-(--l-muted)'
                              : 'text-(--l-ink)',
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td />
                  {plans.map((plan, index) => (
                    <td
                      key={plan.key}
                      className={clsx(
                        'rounded-b-[4px] px-6 pt-6 pb-7',
                        index === featured && 'bg-(--l-accent)',
                      )}
                    >
                      <Link
                        href={`/cotizar?plan=${plan.key}`}
                        className={clsx(
                          'l-button w-full',
                          index === featured ? 'l-button--light' : 'l-button--accent',
                        )}
                      >
                        Consultar {plan.name.replace(/^Plan\s+/i, '')}
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Teléfono y tableta: un bloque por plan */}
          <div className="lg:hidden">
            <h2 className="l-display m-0 text-(length:--step-head)">
              Elige tu plan
            </h2>
            <div className="mt-10 grid gap-10">
              {plans.map((plan, index) => (
                <article
                  key={plan.key}
                  className={clsx(
                    'rounded-[4px] p-6',
                    index === featured ? 'bg-(--l-accent) text-(--l-accent-ink)' : 'bg-(--l-surface)',
                  )}
                >
                  <h3 className="l-display m-0 text-[clamp(2.25rem,9vw,3rem)] font-normal">
                    {plan.name.replace(/^Plan\s+/i, '')}
                  </h3>
                  <p className="l-display mt-1 mb-0 text-[clamp(1.5rem,6vw,2rem)]">A medida</p>
                  <Link
                    href={`/cotizar?plan=${plan.key}`}
                    className={clsx('l-button mt-6 w-full', index === featured ? 'l-button--light' : 'l-button--accent')}
                  >
                    Consultar {plan.name.replace(/^Plan\s+/i, '')}
                  </Link>

                  {/* En el teléfono cada bloque enseña solo lo que AÑADE sobre el anterior: tres
                      listas largas casi iguales, una debajo de otra, no se comparan, se scrollean. */}
                  <p className={clsx('mt-7 mb-0 text-[17px]', index === featured ? 'text-white/80' : 'text-(--l-muted)')}>
                    Cómo confirman tus invitados
                  </p>
                  <p className="mt-0.5 mb-0 text-[17px]">{rows[0]?.cells[index]}</p>

                  <p className={clsx('mt-5 mb-0 text-[17px]', index === featured ? 'text-white/80' : 'text-(--l-muted)')}>
                    {index === 0 ? 'Incluye' : `Todo lo de ${plans[index - 1]?.name.replace(/^Plan\s+/i, '')}, más`}
                  </p>
                  <ul className="m-0 mt-1 grid list-none gap-1 p-0 text-[17px]">
                    {plan.features
                      .filter((feature) => feature !== ONLINE_RSVP && !(plans[index - 1]?.features ?? []).includes(feature))
                      .map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
