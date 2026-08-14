import clsx from 'clsx';
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
 * ## Ahora son láminas y no columnas
 *
 * Cada plan va en su propia lámina de papel de color, y la superior en el color de la marca. Es
 * el formato de un folleto de servicios y hace dos cosas que dos columnas sobre papel blanco no
 * hacían: separa los planes de un vistazo —antes había que leer para saber dónde terminaba uno—
 * y deja que el superior **destaque por su color** en vez de por una etiqueta de «recomendado»,
 * que es el recurso que todo el mundo reconoce como publicidad.
 *
 * ## El precio no aparece
 *
 * Porque todavía no está fijado en el catálogo. Enseñar «$0» o inventarse una cifra en la página
 * de venta es peor que no decir nada: lo primero engaña y lo segundo abre una conversación, que
 * es exactamente lo que hace falta mientras el administrador arma cada evento a mano. La lámina
 * reserva el sitio donde irá —el hueco existe y está compuesto—, así que ponerlo el día que se
 * decida no obliga a rehacer la sección.
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
    <section id="planes" className="relative isolate overflow-hidden bg-ivory">
      {/* La misma acuarela difusa de la portada, para que la sección de precios no sea la única
          página en blanco de la pieza. */}
      <div
        aria-hidden="true"
        className="absolute -top-32 -right-40 -z-10 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,var(--color-blush),transparent_70%)] opacity-70"
      />

      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:px-10 sm:py-28">
        <header className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <p className="m-0 flex items-center gap-4 text-[11px] tracking-[0.3em] text-accent uppercase">
            <span aria-hidden="true" className="h-px w-8 bg-accent/45" />
            Planes
            <span aria-hidden="true" className="h-px w-8 bg-accent/45" />
          </p>
          <h2 className="m-0 font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.08] font-light text-plum">
            Dos formas de empezar
          </h2>
          <p className="m-0 text-[16px] leading-relaxed text-ink/70">
            La invitación completa está en los dos. Lo que cambia es cuánto trabajo de
            organización te quita.
          </p>
        </header>

        {base && (
          <div className="mt-16 grid items-start gap-6 md:grid-cols-2 md:gap-8">
            <PlanCard plan={base} />
            {upper.map((plan) => (
              <PlanCard key={plan.key} plan={plan} previous={base} highlighted />
            ))}
          </div>
        )}

        {eventTypes.length > 0 && (
          <div className="mt-20 text-center">
            <p className="m-0 text-[11px] tracking-[0.3em] text-accent uppercase">
              Para cualquier celebración
            </p>
            {/*
              Los tipos van como una tira de texto separada por puntos y no como etiquetas en
              cajas: son nueve, y nueve cajas grises son una nube de etiquetas — el recurso que
              más rápido convierte una página cuidada en un panel de administración.
            */}
            <p className="mx-auto mt-7 mb-0 max-w-4xl font-display text-[clamp(1.25rem,3vw,1.9rem)] leading-relaxed font-light text-plum">
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

/**
 * La lámina de un plan.
 *
 * Los dos tonos salen de la misma pareja que usa la invitación entera: papel de color con tinta
 * ciruela, o ciruela con tinta clara. Nada está escrito a mano dos veces — la lámina destacada
 * pinta todo con transparencias de su propio color de tinta (`border-current/25`,
 * `text-current/75`), así que cambiar el color de marca no deja ni un valor descolgado.
 */
function PlanCard({
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
    <article
      className={clsx(
        'flex h-full flex-col px-8 py-10 sm:px-10 sm:py-12',
        highlighted ? 'bg-plum text-white' : 'bg-blush text-ink',
      )}
    >
      <h3
        className={clsx(
          'm-0 font-display text-[clamp(1.6rem,3.5vw,2.25rem)] leading-tight font-light',
          highlighted ? 'text-white' : 'text-plum',
        )}
      >
        {plan.name}
      </h3>

      {plan.description && (
        <p className={clsx('mt-3 mb-0 text-[15px] leading-relaxed', highlighted ? 'text-white/80' : 'text-ink/70')}>
          {plan.description}
        </p>
      )}

      {/* El hueco del precio, compuesto y sin cifra: ver el comentario de la sección. */}
      <p
        className={clsx(
          'mt-8 mb-0 font-display text-[clamp(1.5rem,3vw,2rem)] leading-none font-light',
          highlighted ? 'text-white' : 'text-plum',
        )}
      >
        A medida
        <span
          className={clsx(
            'mt-3 block font-body text-[12px] tracking-[0.16em] uppercase',
            highlighted ? 'text-white/65' : 'text-ink/50',
          )}
        >
          Según tu celebración
        </span>
      </p>

      <p
        className={clsx(
          'mt-10 mb-0 text-[11.5px] tracking-[0.2em] uppercase',
          highlighted ? 'text-white/65' : 'text-ink/50',
        )}
      >
        {previous ? 'Todo lo anterior, más:' : 'Incluye'}
      </p>

      <ul
        className={clsx(
          'm-0 mt-5 grid list-none gap-3 border-t p-0 pt-6',
          highlighted ? 'border-white/25' : 'border-plum/15',
        )}
      >
        {features.map((feature) => (
          <li
            key={feature}
            className={clsx(
              'flex items-baseline gap-3 text-[15px] leading-relaxed',
              highlighted ? 'text-white/85' : 'text-ink/80',
            )}
          >
            <span aria-hidden="true" className={highlighted ? 'text-white/50' : 'text-accent/70'}>
              ◆
            </span>
            {feature}
          </li>
        ))}
      </ul>

      {/* `mt-auto` y no un margen fijo: las dos láminas se estiran a la misma altura en la
          retícula, y el botón tiene que quedar abajo en las dos aunque una tenga cinco líneas
          más que la otra. */}
      <div className="mt-auto pt-10">
        <Link
          href="/panel"
          className={clsx(
            'inline-flex min-h-12 items-center justify-center px-9 text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
            highlighted
              ? 'bg-white text-plum hover:bg-blush focus-visible:ring-white focus-visible:ring-offset-plum'
              : 'bg-plum text-white hover:bg-plum-dark focus-visible:ring-accent focus-visible:ring-offset-blush',
          )}
        >
          Consultar
        </Link>
      </div>
    </article>
  );
}
