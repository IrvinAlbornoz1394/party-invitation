'use client';

import { useState, type ComponentType } from 'react';
import clsx from 'clsx';
import { Check, LoaderCircle, TriangleAlert } from 'lucide-react';
import { whatsappUrl, type RsvpContent } from '@/domain/invitation/blocks/rsvp';
import { ActionLink } from '../../shared/ActionLink';
import { actionClasses } from '../../shared/action-styles';
import { TextLink } from '../../shared/TextLink';
import type { Tone } from '../../shared/tone';
import { useRsvpGateway } from './useRsvpGateway';

/**
 * Las piezas de la confirmación, compartidas por sus tres componentes.
 *
 * Aquí vive lo único que de verdad hace este bloque —el botón— con sus dos caminos y sus cuatro
 * estados. Los tres componentes se ocupan solo de dónde colocarlo, y por eso ninguno tiene que
 * saber si el evento confirma por WhatsApp o contra la plataforma.
 */

export interface RsvpVariantProps {
  readonly content: RsvpContent;
}

/** El tipo con el que el registro guarda una confirmación, sea cual sea su forma. */
export type RsvpVariant = ComponentType<RsvpVariantProps>;

type ManagedState = 'idle' | 'sending' | 'done' | 'unavailable' | 'error';

/**
 * El botón de confirmar, con sus dos caminos.
 *
 * Con destino `whatsapp` es un enlace: abre la conversación con el mensaje ya escrito y aquí se
 * acabó el trabajo del bloque. Con destino `managed` es un botón que llama a la pasarela y
 * cambia de estado según lo que responda.
 *
 * ## Los estados, y por qué son cuatro y no dos
 *
 * `idle` y `done` son los evidentes. Los otros dos existen porque son los que se olvidan y los
 * que más se notan:
 *
 *   · **`sending`** deshabilita el botón. Sin eso, quien no ve respuesta inmediata pulsa tres
 *     veces y confirma tres veces — el clásico de todo formulario en un móvil con mala señal.
 *   · **`unavailable` / `error`** dicen la verdad y **dejan el camino abierto**: el enlace de
 *     «no podré asistir» y la nota siguen ahí, y el mensaje sugiere avisar por otro medio. Un
 *     bloque que se queda mudo cuando falla convierte a un invitado que quiso responder en uno
 *     que figura como pendiente.
 *
 * El acuse va en una región `aria-live`: el cambio de icono y de texto lo comunica visualmente,
 * y sin esto quien no ve la pantalla no recibe ninguna señal de que su confirmación llegó.
 */
export function RsvpAction({
  content,
  tone = 'onSurface',
  align = 'center',
  className,
}: {
  readonly content: RsvpContent;
  readonly tone?: Tone;
  readonly align?: 'left' | 'center';
  readonly className?: string;
}) {
  const gateway = useRsvpGateway();
  const [state, setState] = useState<ManagedState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const centered = align === 'center';

  const confirm = async () => {
    setState('sending');
    setErrorMessage(null);

    const result = await gateway({ attending: true });

    if (result.status === 'ok') setState('done');
    else if (result.status === 'unavailable') setState('unavailable');
    else {
      setErrorMessage(result.message);
      setState('error');
    }
  };

  return (
    <div
      className={clsx('flex flex-col gap-4', centered ? 'items-center' : 'items-start', className)}
    >
      {content.destination.kind === 'whatsapp' ? (
        <ActionLink
          label={content.confirmLabel}
          href={whatsappUrl(content.destination.phone, content.destination.message)}
          tone={tone}
        />
      ) : state === 'done' ? (
        <p
          className={clsx(
            'm-0 inline-flex items-center gap-2.5 text-[15px]',
            tone === 'onImage' ? 'text-inv-on-primary' : 'text-inv-primary',
          )}
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-full bg-current/10"
          >
            <Check size={18} strokeWidth={2.2} />
          </span>
          ¡Listo! Tu asistencia quedó confirmada.
        </p>
      ) : (
        <button
          type="button"
          onClick={confirm}
          disabled={state === 'sending'}
          className={actionClasses(tone, state === 'sending' ? 'cursor-wait opacity-70' : undefined)}
        >
          {state === 'sending' && (
            <LoaderCircle size={16} strokeWidth={2} aria-hidden="true" className="animate-spin" />
          )}
          {state === 'sending' ? 'Confirmando…' : content.confirmLabel}
        </button>
      )}

      {(state === 'unavailable' || state === 'error') && (
        <p
          className={clsx(
            'm-0 inline-flex max-w-sm items-start gap-2 text-[13.5px] leading-relaxed',
            centered && 'text-center',
            tone === 'onImage' ? 'text-inv-on-primary opacity-90' : 'text-inv-ink-soft',
          )}
        >
          <TriangleAlert size={16} strokeWidth={1.8} aria-hidden="true" className="mt-0.5 shrink-0" />
          {state === 'unavailable'
            ? 'La confirmación en línea no está disponible ahora mismo. Escríbenos y con gusto te apartamos lugar.'
            : (errorMessage ?? 'No pudimos guardar tu confirmación. Vuelve a intentarlo en un momento.')}
        </p>
      )}

      {content.declineAction && (
        <TextLink
          action={content.declineAction}
          tone={tone === 'onImage' ? 'inverse' : 'default'}
        />
      )}

      {/* El acuse para lector de pantalla. `polite` y no `assertive`: interrumpir la lectura de
          la página para anunciar algo que ya se ve es peor que esperar a la siguiente pausa. */}
      <span className="sr-only" role="status" aria-live="polite">
        {state === 'done' ? 'Tu asistencia quedó confirmada.' : ''}
      </span>
    </div>
  );
}

/**
 * La fecha límite, destacada.
 *
 * Va en su propia pieza y no como una línea más del texto porque es el dato que hace que alguien
 * responda hoy en vez de «luego». En una invitación que se lee en treinta segundos, «antes del 1
 * de junio» perdido dentro de un párrafo es una fecha que nadie recuerda.
 */
export function RsvpDeadline({
  deadlineLabel,
  tone = 'onSurface',
  className,
}: {
  readonly deadlineLabel: string;
  readonly tone?: Tone;
  readonly className?: string;
}) {
  return (
    <p
      className={clsx(
        'm-0 inline-flex items-center gap-2.5 rounded-inv-md border px-4 py-2 text-[12.5px] tracking-[0.16em] uppercase',
        tone === 'onImage'
          ? 'border-current/35 text-inv-on-primary'
          : 'border-inv-line text-inv-ink-soft',
        className,
      )}
    >
      {deadlineLabel}
    </p>
  );
}
