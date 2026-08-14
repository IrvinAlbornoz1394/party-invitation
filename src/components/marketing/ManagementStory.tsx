/**
 * Lo que pasa después de enviar la invitación.
 *
 * Es el argumento del producto —«no vendemos invitaciones, vendemos una herramienta para
 * organizar tu evento»— y por eso va **después** de las plantillas y no antes: primero se gana la
 * atención por los ojos, y solo entonces alguien está dispuesto a leer por qué esto no es otra
 * página bonita.
 *
 * ## Por qué no son tarjetas
 *
 * Cuatro tarjetas con icono y título es el patrón por defecto de cualquier página de producto, y
 * dice «esto lo montó alguien con una plantilla». Aquí son cuatro entradas numeradas separadas
 * por filetes: se leen en orden, ocupan menos y se parecen a un índice —que es exactamente lo que
 * son—. El número hace el trabajo que haría un icono, sin inventarse una metáfora por cada idea.
 *
 * Cada entrada nombra **el trabajo que te quita**, no la funcionalidad. «Panel de confirmaciones»
 * no le dice nada a quien organiza una boda; «dejas de perseguir a nadie por WhatsApp», sí.
 */

const MOMENTS = [
  {
    title: 'Las confirmaciones llegan y se cuentan solas',
    detail:
      'Cada quien confirma desde su invitación. Tú abres el panel y ves el número, no una conversación de doscientos mensajes.',
  },
  {
    title: 'Los invitados, por familia',
    detail:
      'Con su cupo de adultos y niños. Sabes quién confirmó, quién falta y quién ya dijo que no puede, sin llevar la cuenta en una libreta.',
  },
  {
    title: 'Las mesas, resueltas',
    detail:
      'Creas las mesas, asignas a cada familia y sacas la vista para imprimir. Se acabó la hoja de cálculo con nombres arrastrados.',
  },
  {
    title: 'Los recordatorios se mandan solos',
    detail:
      'Siete días antes, tres, uno y el mismo día. Tú los configuras una vez; a partir de ahí, salen sin que te acuerdes.',
  },
] as const;

export function ManagementStory() {
  return (
    <section className="border-t border-line">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:px-10 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
          {/*
            El encabezado se ancla en escritorio: la lista es larga, y sin anclarlo el argumento
            —«esto es lo que de verdad compras»— desaparece antes de que se lea el tercer punto.
          */}
          <header className="flex flex-col gap-5 lg:sticky lg:top-12 lg:self-start">
            <p className="m-0 flex items-center gap-3 text-[11px] tracking-[0.3em] text-accent uppercase">
              <span aria-hidden="true" className="h-px w-8 bg-accent/50" />
              Después de enviarla
            </p>
            <h2 className="m-0 font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.08] font-light text-plum">
              Lo difícil no era la invitación.
            </h2>
            <p className="m-0 max-w-md text-[16px] leading-relaxed text-ink/70">
              Era saber cuántos van a llegar. Eso es lo que esta herramienta te quita de encima.
            </p>
          </header>

          <ol className="m-0 grid list-none gap-0 border-t border-line p-0">
            {MOMENTS.map((moment, index) => (
              <li
                key={moment.title}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 border-b border-line py-8 sm:gap-x-8 sm:py-10"
              >
                <span
                  aria-hidden="true"
                  className="font-display text-[1.35rem] leading-none text-accent tabular-nums"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>

                <div>
                  <h3 className="m-0 font-display text-[clamp(1.35rem,2.6vw,1.75rem)] leading-snug font-light text-plum">
                    {moment.title}
                  </h3>
                  <p className="mt-3 mb-0 max-w-lg text-[15px] leading-relaxed text-ink/70">
                    {moment.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
