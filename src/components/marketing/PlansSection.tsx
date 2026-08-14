import Link from 'next/link';
import type { PublicPlan } from '@/application/catalog/browse-showcase';
import type { EventTypeSummary } from '@/domain/catalog/catalog-repository';

/**
 * Los planes y los tipos de evento, leídos del catálogo real.
 *
 * No están escritos a mano en esta página: vienen de la misma base de datos que configura los
 * eventos. Es lo que evita el problema de toda página de precios —que prometa algo que el
 * producto dejó de hacer hace tres meses—, y significa que añadir una funcionalidad a un plan la
 * publica aquí sin que nadie tenga que acordarse.
 *
 * ## El precio no aparece
 *
 * Porque todavía no está fijado en el catálogo. Enseñar «$0» o inventarse una cifra en la página
 * de venta es peor que no decir nada: lo primero engaña y lo segundo abre una conversación, que
 * es exactamente lo que hace falta mientras el administrador arma cada evento a mano.
 *
 * ## Por qué el plan superior se enseña por su diferencia
 *
 * Repetir las dieciocho funcionalidades del Premium al lado de las trece del Esencial obliga a
 * comparar dos listas largas casi iguales. Se enseña lo que **añade**, que es la única pregunta
 * real: «¿qué me llevo si pago más?».
 */
export function PlansSection({
  plans,
  eventTypes,
}: {
  readonly plans: readonly PublicPlan[];
  readonly eventTypes: readonly EventTypeSummary[];
}) {
  const [base, ...upper] = plans;

  return (
    <section id="planes" className="border-t border-line bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:px-10 sm:py-28">
        <header className="flex max-w-2xl flex-col gap-5">
          <p className="m-0 flex items-center gap-3 text-[11px] tracking-[0.3em] text-accent uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-accent/50" />
            Planes
          </p>
          <h2 className="m-0 font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.08] font-light text-plum">
            Dos formas de empezar.
          </h2>
          <p className="m-0 text-[16px] leading-relaxed text-ink/70">
            La invitación completa está en los dos. Lo que cambia es cuánto trabajo de
            organización te quita.
          </p>
        </header>

        {base && (
          <div className="mt-14 grid gap-10 md:grid-cols-2 md:gap-16">
            <PlanColumn plan={base} />
            {upper.map((plan) => (
              <PlanColumn key={plan.key} plan={plan} previous={base} highlighted />
            ))}
          </div>
        )}

        {eventTypes.length > 0 && (
          <div className="mt-20 border-t border-line pt-12">
            <p className="m-0 text-[11px] tracking-[0.3em] text-accent uppercase">
              Para cualquier celebración
            </p>
            {/*
              Los tipos van como una tira de texto separada por puntos y no como etiquetas en
              cajas: son nueve, y nueve cajas grises son una nube de etiquetas — el recurso que
              más rápido convierte una página cuidada en un panel de administración.
            */}
            <p className="mt-6 mb-0 max-w-4xl font-display text-[clamp(1.25rem,3vw,1.9rem)] leading-relaxed font-light text-plum">
              {eventTypes.map((type, index) => (
                <span key={type.key}>
                  {index > 0 && (
                    <span aria-hidden="true" className="mx-3 text-accent/50">
                      ·
                    </span>
                  )}
                  {type.name}
                </span>
              ))}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function PlanColumn({
  plan,
  previous,
  highlighted = false,
}: {
  readonly plan: PublicPlan;
  /** El plan inmediatamente inferior, para enseñar solo la diferencia. */
  readonly previous?: PublicPlan;
  readonly highlighted?: boolean;
}) {
  const included = new Set(previous?.features ?? []);
  const features = previous ? plan.features.filter((name) => !included.has(name)) : plan.features;

  return (
    <article className="flex flex-col">
      <h3 className="m-0 font-display text-[clamp(1.6rem,3.5vw,2.25rem)] leading-tight font-light text-plum">
        {plan.name}
      </h3>

      {plan.description && (
        <p className="mt-3 mb-0 text-[15px] leading-relaxed text-ink/70">{plan.description}</p>
      )}

      <p className="mt-6 mb-0 text-[11.5px] tracking-[0.2em] text-ink/50 uppercase">
        {previous ? `Todo lo anterior, más:` : 'Incluye'}
      </p>

      <ul className="m-0 mt-5 grid list-none gap-3 border-t border-line p-0 pt-5">
        {features.map((feature) => (
          <li key={feature} className="flex items-baseline gap-3 text-[15px] text-ink/80">
            <span
              aria-hidden="true"
              className={highlighted ? 'text-accent' : 'text-line'}
            >
              ◆
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-8 pt-2">
        <Link
          href="/panel"
          className={
            highlighted
              ? 'inline-flex min-h-12 items-center justify-center bg-plum px-8 text-[12px] font-semibold tracking-[0.14em] text-white uppercase transition-colors hover:bg-plum-dark focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none'
              : 'inline-flex min-h-12 items-center justify-center border border-plum px-8 text-[12px] font-semibold tracking-[0.14em] text-plum uppercase transition-colors hover:bg-plum hover:text-white focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none'
          }
        >
          Consultar
        </Link>
      </div>
    </article>
  );
}
