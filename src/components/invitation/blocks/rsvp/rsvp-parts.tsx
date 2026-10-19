'use client';

import type { ComponentType } from 'react';
import clsx from 'clsx';
import { whatsappUrl, type RsvpContent } from '@/domain/invitation/blocks/rsvp';
import { ActionLink } from '../../shared/ActionLink';
import { TextLink } from '../../shared/TextLink';
import type { Tone } from '../../shared/tone';
import { RsvpManagedReply } from './RsvpManagedReply';

/**
 * Las piezas de la confirmación, compartidas por sus tres componentes.
 *
 * Aquí vive lo único que de verdad hace este bloque —el botón— con sus dos caminos. Los tres componentes se ocupan solo de dónde colocarlo, y por eso ninguno tiene que
 * saber si el evento confirma por WhatsApp o contra la plataforma.
 */

export interface RsvpVariantProps {
  readonly content: RsvpContent;
}

/** El tipo con el que el registro guarda una confirmación, sea cual sea su forma. */
export type RsvpVariant = ComponentType<RsvpVariantProps>;

/**
 * El botón de confirmar, con sus dos caminos.
 *
 * Con destino `whatsapp` es un enlace: abre la conversación con el mensaje ya escrito, y el de
 * «no podré asistir» abre la misma con el suyo. Aquí se acaba el trabajo del bloque.
 *
 * Con destino `managed` la respuesta se registra en la plataforma, y de eso se ocupa
 * `RsvpManagedReply`: cuántos van, o por qué no, y los estados de envío. Ahí no se pinta el
 * enlace de declinar del contenido —sería un segundo camino que no deja nada en el panel—.
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
  const centered = align === 'center';

  return (
    <div
      className={clsx('flex flex-col gap-4', centered ? 'items-center' : 'items-start', className)}
    >
      {content.destination.kind === 'whatsapp' ? (
        <>
          <ActionLink
            label={content.confirmLabel}
            href={whatsappUrl(content.destination.phone, content.destination.message)}
            tone={tone}
          />
          {content.declineAction && (
            <TextLink
              action={content.declineAction}
              tone={tone === 'onImage' ? 'inverse' : 'default'}
            />
          )}
        </>
      ) : (
        <RsvpManagedReply confirmLabel={content.confirmLabel} tone={tone} centered={centered} />
      )}
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
