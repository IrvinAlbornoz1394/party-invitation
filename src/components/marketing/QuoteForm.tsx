'use client';

import Image from 'next/image';
import { useActionState, useEffect, useState } from 'react';

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
 * Y desde la portada llega lo que la persona escribió en la invitación de prueba —qué celebra,
 * quiénes y cuándo—, guardado en su navegador (`mievento.home.couple`, ver
 * `components/home/HomeCouple.tsx`). Se lee al montar y rellena esos tres campos: ya lo dijo una
 * vez, pedírselo de nuevo es justo el tipo de fricción que cuesta solicitudes. Sigue siendo
 * editable, y si el navegador no guarda nada el formulario sale vacío como siempre.
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
  const fromHome = useHomeCouple(eventTypes);

  if (state.status === 'sent') {
    return (
      <div className="rounded-[18px] bg-(--h-white) px-6 py-12 text-center shadow-[0_0_0_1px_var(--h-line),0_30px_60px_-40px_rgba(74,26,44,0.45)] sm:px-10">
        <Image src="/brand/isologo.png" alt="" aria-hidden="true" width={851} height={693} sizes="64px" className="mx-auto h-auto w-16" />
        <p className="h-script mt-4 mb-0 text-[2.6rem] leading-none text-(--h-wine)">Gracias</p>
        <p className="mx-auto mt-4 mb-0 max-w-md text-[15.5px] leading-relaxed text-(--h-muted)">
          {state.message}
        </p>
        <a href="/#plantillas" className="h-button h-button--ghost mt-8 text-(--h-wine)">
          Seguir viendo plantillas
        </a>
      </div>
    );
  }

  const kind = fromHome?.kind ?? null;

  return (
    /* `key` remonta los campos cuando llegan los datos de la portada: así pueden seguir sin
       controlar (`defaultValue`) y el HTML del servidor —vacío— coincide con el primer render. */
    <form key={fromHome ? 'portada' : 'vacio'} action={formAction} className="grid gap-5">
      {/* Lo que la persona estaba mirando cuando pulsó. Ver el comentario del componente. */}
      {planKey && <input type="hidden" name="planKey" value={planKey} />}
      {templateKey && <input type="hidden" name="templateKey" value={templateKey} />}

      <label className="absolute left-[-9999px] h-px w-px overflow-hidden" aria-hidden="true">
        No llenes esto
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>

      {fromHome?.names && (
        <p className="m-0 flex items-center gap-3 rounded-[14px] bg-(--h-paper-2) px-4 py-3 text-[14px] leading-snug text-(--h-muted)">
          <span aria-hidden="true" className="size-2 shrink-0 rotate-45 bg-(--h-rose)" />
          <span>
            Tomamos los datos que escribiste en la portada:{' '}
            <span className="h-script text-[1.35rem] text-(--h-wine)">{fromHome.names}</span>
          </span>
        </p>
      )}

      {state.status === 'error' && (
        <p
          role="alert"
          className="m-0 rounded-[14px] bg-(--h-wine)/8 px-4 py-3 text-[14px] text-(--h-wine) shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--h-wine)_25%,transparent)]"
        >
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
        <label className="grid content-start gap-2">
          <span className={LABEL}>Qué celebras</span>
          <select name="eventTypeKey" className={CONTROL} defaultValue={fromHome?.eventTypeKey ?? ''}>
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
          defaultValue={fromHome?.date}
          hint="Si aún no la tienes, déjala vacía."
        />
      </div>

      {/*
        No hay columna para esto en la tabla: la acción lo antepone al mensaje como
        «Festejados: …». Ver `app/cotizar/actions.ts`.
      */}
      <Field
        name="celebrantNames"
        label={kind === 'xv' ? 'Nombre de la quinceañera' : kind === 'boda' ? 'Nombres de los novios' : 'Nombres de los festejados'}
        optional
        maxLength={80}
        defaultValue={fromHome?.names}
      />

      <label className="grid content-start gap-2">
        <span className={LABEL}>Cuántos invitados, más o menos</span>
        {/*
          Rangos y no un número: nadie sabe cuántos invitados va a tener con precisión seis meses
          antes, y pedir una cifra exacta hace que la gente se lo piense o se lo invente. El rango
          es además lo que de verdad decide el plan.
        */}
        <select name="guestRange" className={CONTROL} defaultValue="">
          <option value="">Todavía no lo sé</option>
          <option value="hasta-50">Hasta 50</option>
          <option value="50-100">Entre 50 y 100</option>
          <option value="100-200">Entre 100 y 200</option>
          <option value="mas-200">Más de 200</option>
        </select>
      </label>

      <label className="grid content-start gap-2">
        <span className={LABEL}>
          Cuéntanos <span className="tracking-normal normal-case opacity-70">(opcional)</span>
        </span>
        <textarea name="message" rows={4} className={`${CONTROL} min-h-28 py-3 leading-relaxed`} />
      </label>

      <button type="submit" disabled={isPending} className="h-button h-button--wine mt-2 w-full disabled:opacity-60 sm:w-auto sm:justify-self-start sm:px-10">
        {isPending ? 'Enviando…' : 'Enviar solicitud'}
      </button>

      <p className="m-0 text-[13px] leading-relaxed text-(--h-muted)">
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

/* 16px en el teléfono: con menos, Safari de iOS acerca la página al enfocar el campo. */
const CONTROL =
  'min-h-12 w-full rounded-[12px] border border-(--h-line) bg-(--h-white) px-4 text-[16px] text-(--h-ink) transition-[border-color,box-shadow] duration-200 focus-visible:border-(--h-wine) focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--h-wine)_14%,transparent)] focus-visible:outline-none';
const LABEL = 'text-[11.5px] tracking-[0.16em] text-(--h-muted) uppercase';

interface HomeCouple {
  readonly kind: 'boda' | 'xv';
  readonly names: string;
  readonly date: string;
  readonly eventTypeKey: string | null;
}

/** De la portada al catálogo: la portada habla de «boda» y «xv», el catálogo de sus claves. */
const KIND_TO_EVENT_TYPE = { boda: 'wedding', xv: 'quince' } as const;

/**
 * Lo que la persona escribió en la portada, si lo hay. `null` en el servidor y en el primer
 * render, para que los dos coincidan; llega en un efecto.
 */
function useHomeCouple(eventTypes: readonly { readonly key: string }[]): HomeCouple | null {
  const [value, setValue] = useState<HomeCouple | null>(null);

  useEffect(() => {
    let saved: Partial<{ kind: unknown; names: unknown; date: unknown }>;
    try {
      saved = JSON.parse(window.localStorage.getItem('mievento.home.couple') ?? 'null') ?? {};
    } catch {
      return;
    }
    if (saved.kind !== 'boda' && saved.kind !== 'xv') return;

    const names = typeof saved.names === 'string' ? saved.names.trim().slice(0, 80) : '';
    /* La fecha de la portada existe siempre —si no escribió la suya, es una de ejemplo—, así que
       solo se toma cuando escribió también sus nombres: es la señal de que esos datos son suyos. */
    const date = names && typeof saved.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(saved.date) ? saved.date : '';
    const key = KIND_TO_EVENT_TYPE[saved.kind];

    setValue({
      kind: saved.kind,
      names,
      date,
      /* Solo si el catálogo de hoy tiene esa clave: un `<select>` con un valor que no está en sus
         opciones se queda en blanco sin avisar. */
      eventTypeKey: eventTypes.some((type) => type.key === key) ? key : null,
    });
  }, [eventTypes]);

  return value;
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
  defaultValue,
  maxLength,
}: {
  readonly name: string;
  readonly label: string;
  readonly type?: string;
  readonly required?: boolean;
  readonly optional?: boolean;
  readonly hint?: string;
  readonly autoComplete?: string;
  readonly defaultValue?: string;
  readonly maxLength?: number;
}) {
  return (
    <label className="grid content-start gap-2">
      <span className={LABEL}>
        {label}
        {optional && <span className="tracking-normal normal-case opacity-70"> (opcional)</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        maxLength={maxLength}
        className={CONTROL}
      />
      {hint && <span className="text-[12.5px] text-(--h-muted)">{hint}</span>}
    </label>
  );
}
