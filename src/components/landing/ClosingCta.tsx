import { ChevronDown } from 'lucide-react';

/**
 * El cierre: una frase con un hueco, y el hueco es el formulario.
 *
 * «Quiero mi invitación con ___» — y en el hueco, las plantillas. La última palabra es el botón.
 * Es un formulario `GET` corriente hacia `/cotizar`, que ya sabe leer `?plantilla=`, así que la
 * solicitud llega diciendo qué estaba mirando esta persona y funciona sin una línea de script.
 */
export function ClosingCta({
  templates,
}: {
  readonly templates: readonly { readonly key: string; readonly name: string }[];
}) {
  return (
    <section aria-labelledby="cierre-titulo" className="px-5 py-12 sm:py-28 sm:px-8 lg:py-44">
      <form action="/cotizar" method="get" data-reveal>
        {/*
          El título y el hueco tienen el mismo cuerpo y se leen como una sola frase, pero el título
          es solo la parte escrita: el selector y el botón son controles y no van dentro del h2.
        */}
        <div className="l-display text-[clamp(2.5rem,10vw,3.5rem)] leading-[1.15] lg:text-[clamp(3rem,6vw,6rem)]">
          <h2 id="cierre-titulo" className="l-display m-0 text-[length:inherit] leading-[inherit]">
            Quiero mi invitación con
          </h2>
          <div className="flex flex-wrap items-center gap-[0.2em]">
            <span className="relative inline-flex h-[1.15em]">
              <label htmlFor="cierre-plantilla" className="sr-only">
                Plantilla
              </label>
              <select
                id="cierre-plantilla"
                name="plantilla"
                defaultValue={templates[0]?.key}
                className="h-full w-[6.4em] cursor-pointer appearance-none rounded-[4px] bg-(--l-surface) pr-[1.1em] pl-[0.3em] font-[inherit] leading-none font-light tracking-[inherit] text-(--l-ink) transition-colors hover:bg-(--l-surface-2) [font-size:inherit]"
              >
                {templates.map((template) => (
                  <option key={template.key} value={template.key}>
                    {template.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                strokeWidth={1.25}
                className="pointer-events-none absolute top-1/2 right-[0.2em] size-[0.6em] -translate-y-1/2 text-(--l-muted)"
              />
            </span>
            <button
              type="submit"
              className="inline-flex h-[1.15em] items-center rounded-[4px] bg-(--l-accent) px-[0.3em] font-[inherit] leading-none font-light tracking-[inherit] text-(--l-accent-ink) transition-[background-color,transform] hover:bg-(--l-accent-hover) active:scale-[0.98] [font-size:inherit]"
            >
              Cotizar
            </button>
          </div>
        </div>
        <p className="mt-8 mb-0 max-w-[52ch] text-(--l-muted)">
          Te llevamos al formulario con esa plantilla elegida. Ahí nos cuentas la fecha y cuántos
          invitados esperas, y te respondemos con tu cotización.
        </p>
      </form>
    </section>
  );
}
