'use client';

import { useActionState } from 'react';

/**
 * El formulario público de contacto.
 *
 * ## Dos campos obligatorios y once opcionales
 *
 * Un formulario de una web pública compite con cerrar la pestaña, así que cada campo obligatorio
 * de más cuesta solicitudes. Solo se exigen el nombre y el teléfono: lo demás ayuda a preparar la
 * propuesta y ninguno vale una solicitud perdida.
 *
 * El obligatorio es el **teléfono** y no el correo porque en este mercado la conversación ocurre
 * por WhatsApp. El correo se pide igual, para el acuse.
 *
 * ## Lo que llega sin que nadie lo escriba
 *
 * `templateKey` y `planKey` viajan ocultos desde la lámina o la plantilla que la persona estaba
 * mirando. Es lo que convierte una solicitud en una propuesta: llega diciendo «quiere `botanical`
 * en Plus para 120 invitados en marzo» y la primera respuesta ya no es un cuestionario. Sin eso,
 * este formulario no ahorraría ni una conversación.
 *
 * ## El campo trampa
 *
 * `website` está oculto para las personas y visible para un robot que rellena todo lo que
 * encuentra. Va oculto con posición absoluta y no con `display:none` ni `type="hidden"`: los
 * robots que valen algo ignoran esos dos. Si llega con algo, el servidor descarta la solicitud
 * **respondiendo que todo salió bien** — decirle a un robot que lo detectaste es enseñarle a
 * esquivarlo.
 *
 * `tabIndex={-1}` y `autoComplete="off"` para que ni el teclado ni el gestor de contraseñas de una
 * persona real lo alcancen por accidente.
 */
export function QuoteForm({
  eventTypes,
  planKey,
  templateKey,
  action,
  initialState,
}: {
  readonly eventTypes: readonly { readonly key: string; readonly name: string }[];
  readonly planKey: string | null;
  readonly templateKey: string | null;
  readonly action: (state: QuoteState, formData: FormData) => Promise<QuoteState>;
  readonly initialState: QuoteState;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  if (state.status === 'sent') {
    return (
      <div className="border border-plum/15 bg-blush px-8 py-12 text-center">
        <p className="m-0 font-display text-[clamp(1.5rem,4vw,2rem)] leading-tight text-plum">
          Gracias
        </p>
        <p className="mx-auto mt-4 mb-0 max-w-md text-[15px] leading-relaxed text-ink/75">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-5">
      {/* Lo que la persona estaba mirando cuando pulsó. Ver el comentario del componente. */}
      {planKey && <input type="hidden" name="planKey" value={planKey} />}
      {templateKey && <input type="hidden" name="templateKey" value={templateKey} />}

      <label className="absolute left-[-9999px] h-px w-px overflow-hidden" aria-hidden="true">
        No llenes esto
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>

      {state.status === 'error' && (
        <p role="alert" className="m-0 border border-plum/25 bg-blush px-4 py-3 text-[14px] text-plum">
          {state.message}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="contactName" label="Tu nombre" required autoComplete="name" />
        <Field
          name="contactPhone"
          label="WhatsApp"
          required
          type="tel"
          autoComplete="tel"
          hint="A donde te escribimos."
        />
      </div>

      <Field name="contactEmail" label="Correo" type="email" autoComplete="email" optional />

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-[12px] tracking-[0.14em] text-ink/70 uppercase">
            Qué celebras
          </span>
          <select
            name="eventTypeKey"
            className="min-h-12 border border-plum/20 bg-white px-4 text-[15px] text-ink focus-visible:border-plum focus-visible:outline-none"
            defaultValue=""
          >
            <option value="">Aún no lo sé</option>
            {eventTypes.map((type) => (
              <option key={type.key} value={type.key}>
                {type.name}
              </option>
            ))}
          </select>
        </label>

        <Field
          name="eventDate"
          label="Fecha"
          type="date"
          optional
          hint="Si aún no la tienes, déjala vacía."
        />
      </div>

      <label className="grid gap-2">
        <span className="text-[12px] tracking-[0.14em] text-ink/70 uppercase">
          Cuántos invitados, más o menos
        </span>
        {/*
          Rangos y no un número: nadie sabe cuántos invitados va a tener con precisión seis meses
          antes, y pedir una cifra exacta hace que la gente se lo piense o se lo invente. El rango
          es además lo que de verdad decide el plan.
        */}
        <select
          name="guestRange"
          className="min-h-12 border border-plum/20 bg-white px-4 text-[15px] text-ink focus-visible:border-plum focus-visible:outline-none"
          defaultValue=""
        >
          <option value="">Todavía no lo sé</option>
          <option value="hasta-50">Hasta 50</option>
          <option value="50-100">Entre 50 y 100</option>
          <option value="100-200">Entre 100 y 200</option>
          <option value="mas-200">Más de 200</option>
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-[12px] tracking-[0.14em] text-ink/70 uppercase">
          Cuéntanos <span className="normal-case opacity-70">(opcional)</span>
        </span>
        <textarea
          name="message"
          rows={4}
          className="border border-plum/20 bg-white px-4 py-3 text-[15px] leading-relaxed text-ink focus-visible:border-plum focus-visible:outline-none"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 inline-flex min-h-12 items-center justify-center bg-plum px-9 text-[12px] font-semibold tracking-[0.14em] text-white uppercase transition-colors hover:bg-plum-dark focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
      >
        {isPending ? 'Enviando…' : 'Enviar solicitud'}
      </button>

      <p className="m-0 text-[13px] leading-relaxed text-ink/60">
        Te escribimos por WhatsApp en menos de 24 horas. No compartimos tus datos con nadie.
      </p>
    </form>
  );
}

/** El estado que devuelve la acción. Se declara aquí para no importar del servidor. */
interface QuoteState {
  readonly status: 'idle' | 'sent' | 'error';
  readonly message: string;
}

/**
 * Un campo de texto.
 *
 * Sin controlar por React: el formulario se envía como `FormData` nativo a una Server Action, así
 * que el navegador ya lleva la cuenta de lo escrito y un `useState` por campo solo añadiría
 * estados que pueden desincronizarse.
 *
 * El `required` va también en el HTML y no solo en el servidor. No es la validación de verdad
 * —esa está en el dominio— pero evita el viaje de ida y vuelta para decir algo que el navegador
 * puede decir al instante.
 */
function Field({
  name,
  label,
  type = 'text',
  required = false,
  optional = false,
  hint,
  autoComplete,
}: {
  readonly name: string;
  readonly label: string;
  readonly type?: string;
  readonly required?: boolean;
  readonly optional?: boolean;
  readonly hint?: string;
  readonly autoComplete?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[12px] tracking-[0.14em] text-ink/70 uppercase">
        {label}
        {optional && <span className="normal-case opacity-70"> (opcional)</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        autoComplete={autoComplete}
        className="min-h-12 border border-plum/20 bg-white px-4 text-[15px] text-ink focus-visible:border-plum focus-visible:outline-none"
      />
      {hint && <span className="text-[12.5px] text-ink/60">{hint}</span>}
    </label>
  );
}
