import clsx from 'clsx';
import Link from 'next/link';
import type { PublicPlan } from '@/application/catalog/browse-showcase';

/**
 * Los planes, leídos del catálogo real.
 *
 * No están escritos a mano en esta página: vienen de la misma base de datos que configura los
 * eventos. Es lo que evita el problema de toda página de precios —que prometa algo que el
 * producto dejó de hacer hace tres meses—, y significa que añadir una funcionalidad a un plan la
 * publica aquí sin que nadie tenga que acordarse.
 *
 * ## Ya no cierra con la tira de tipos de evento
 *
 * Debajo de las láminas iba «Para cualquier celebración» y los nueve tipos del catálogo. Se
 * quitó al estrechar el producto a bodas y XV: la tira salía del catálogo, así que era cierta y
 * al mismo tiempo prometía siete cosas que hoy no se venden. Es justo el fallo contra el que
 * esta sección se diseñó —una página de precios que promete lo que el producto ya no hace—,
 * solo que en la dirección contraria a la esperada: no se quedó vieja el texto, se estrechó el
 * producto. Si el catálogo vuelve a ser la oferta real, el sitio para reponerla es este.
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
 * ## Por qué cada plan se enseña por su diferencia
 *
 * Repetir la lista entera de un plan al lado de la del anterior obliga a comparar dos listas
 * largas casi iguales. Cada lámina enseña lo que **añade** sobre la de su izquierda, que es la
 * única pregunta real: «¿qué me llevo si pago más?».
 *
 * ## La sección no sabe cuántos planes hay
 *
 * Nació con dos y hoy son tres. Nada de esto está escrito a mano: las láminas salen de recorrer
 * el catálogo, cada una recibe la anterior para calcular su diferencia, y la destacada es la
 * última. Añadir o quitar un plan en el seed no obliga a tocar este archivo.
 */
export function PlansSection({ plans }: { readonly plans: readonly PublicPlan[] }) {
  /* Llegan ordenados por `rank` desde el caso de uso, así que la posición en el array ES la
     jerarquía: la lámina de la izquierda es el plan de entrada y la de la derecha el mayor. */
  const lastIndex = plans.length - 1;

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
          <h2 className="m-0 font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.08] font-medium tracking-[-0.03em] text-ink">
            Tres formas de empezar
          </h2>
          <p className="m-0 text-[16px] leading-relaxed text-ink/75">
            Los tres reparten una invitación diseñada de verdad. Lo que cambia es cuánto puedes
            ajustarla y cuánto trabajo de organización te quita.
          </p>
        </header>

        {plans.length > 0 && (
          <div
            className={clsx(
              'mt-16 grid items-start gap-6 md:gap-8',
              /* Dos láminas se reparten el ancho; tres o más caben en la retícula de tres y las
                 siguientes bajan de fila sin dejar un hueco descolgado. */
              plans.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3',
            )}
          >
            {plans.map((plan, index) => (
              <PlanCard
                key={plan.key}
                plan={plan}
                /* La diferencia se calcula contra el plan inmediatamente inferior, no contra el
                   de entrada: si no, Premium enseñaría también todo lo que ya trae Plus. */
                previous={plans[index - 1]}
                highlighted={index === lastIndex}
              />
            ))}
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
          'm-0 font-display text-[clamp(1.6rem,3.5vw,2.25rem)] leading-tight font-medium tracking-[-0.02em]',
          highlighted ? 'text-white' : 'text-ink',
        )}
      >
        {plan.name}
      </h3>

      {plan.description && (
        <p className={clsx('mt-3 mb-0 text-[15px] leading-relaxed', highlighted ? 'text-white/80' : 'text-ink/75')}>
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
            highlighted ? 'text-white/65' : 'text-ink/75',
          )}
        >
          Según tu celebración
        </span>
      </p>

      <p
        className={clsx(
          'mt-10 mb-0 text-[11.5px] tracking-[0.2em] uppercase',
          highlighted ? 'text-white/65' : 'text-ink/75',
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
        {/*
          El plan viaja en la URL. Es lo que hace que la solicitud llegue diciendo qué estaba
          mirando esta persona, en vez de obligar a preguntárselo en la primera respuesta.
        */}
        <Link
          href={`/cotizar?plan=${plan.key}`}
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
