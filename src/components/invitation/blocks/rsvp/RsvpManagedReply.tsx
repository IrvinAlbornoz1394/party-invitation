'use client';

import { useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { Check, HeartHandshake, LoaderCircle, Minus, Plus, TriangleAlert } from 'lucide-react';
import { RSVP_MESSAGE_MAX } from '@/domain/guests/rsvp-reply';
import { actionClasses } from '../../shared/action-styles';
import type { Tone } from '../../shared/tone';
import type { RsvpSubmission } from './rsvp-gateway';
import { useRsvpGateway } from './useRsvpGateway';
import { useRsvpGuest } from './useRsvpGuest';

/**
 * La confirmación que se registra en la plataforma: el camino `managed`.
 *
 * Con la familia del enlace delante (`useRsvpGuest`), el bloque la saluda, le dice cuántos
 * lugares tiene y, al confirmar, le pregunta **cuántos van** —de uno a su cupo—. Al no poder ir,
 * le deja escribir por qué, sin obligarla: «no podré» ya es una respuesta completa.
 *
 * Sin familia —demos y vista previa del panel— pregunta lo mínimo: confirmar o no.
 *
 * ## Por qué la respuesta guardada se enseña en lugar de volver a preguntar
 *
 * Quien abre el enlace por segunda vez casi siempre viene a comprobar que su respuesta llegó. Un
 * botón de «Confirmar» otra vez le haría dudar —«¿no se guardó?»— y le invitaría a mandarla dos
 * veces. Se le enseña lo que respondió y se le deja cambiarlo, que también es legítimo.
 */

type View = 'ask' | 'count' | 'decline' | 'confirmed' | 'declined';

export function RsvpManagedReply({
  confirmLabel,
  tone,
  centered,
}: {
  readonly confirmLabel: string;
  readonly tone: Tone;
  readonly centered: boolean;
}) {
  const gateway = useRsvpGateway();
  const guest = useRsvpGuest();
  const seats = guest?.seats ?? 1;

  const [view, setView] = useState<View>(
    guest?.reply ? (guest.reply.status === 'confirmed' ? 'confirmed' : 'declined') : 'ask',
  );
  const [attendees, setAttendees] = useState(
    guest?.reply?.status === 'confirmed' ? Math.min(guest.reply.attendees, seats) : seats,
  );
  const [message, setMessage] = useState(guest?.reply?.message ?? '');
  const [isSending, setSending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const onImage = tone === 'onImage';
  const plural = seats > 1;

  const send = async (submission: RsvpSubmission) => {
    setSending(true);
    setProblem(null);

    const result = await gateway(submission);

    setSending(false);

    if (result.status === 'ok') {
      setView(submission.attending ? 'confirmed' : 'declined');
    } else if (result.status === 'unavailable') {
      setProblem(
        'La confirmación en línea no está disponible ahora mismo. Escríbenos y con gusto te apartamos lugar.',
      );
    } else {
      setProblem(result.message);
    }
  };

  const confirm = () => {
    // Con un solo lugar no hay nada que preguntar: confirmar es confirmar ese lugar.
    if (guest && plural && view !== 'count') {
      setView('count');
      return;
    }

    void send({ attending: true, attendees: guest ? attendees : 1 });
  };

  const decline = () => void send({ attending: false, message: message.trim() || null });

  const soft = onImage ? 'text-inv-on-primary opacity-90' : 'text-inv-ink-soft';
  const strong = onImage ? 'text-inv-on-primary' : 'text-inv-primary';

  return (
    <div className={clsx('flex w-full max-w-sm flex-col gap-4', centered ? 'items-center text-center' : 'items-start')}>
      {guest && (view === 'ask' || view === 'count') && (
        <p className={clsx('m-0 text-[14.5px] leading-relaxed', soft)}>
          Invitación para <strong className={clsx('font-semibold', strong)}>{guest.name}</strong>
          <br />
          {plural ? `Apartamos ${seats} lugares para ustedes.` : 'Apartamos un lugar para ti.'}
        </p>
      )}

      {view === 'ask' && (
        <>
          <PrimaryButton tone={tone} sending={isSending} onClick={confirm}>
            {confirmLabel}
          </PrimaryButton>
          <QuietButton tone={tone} disabled={isSending} onClick={() => setView('decline')}>
            No podré asistir
          </QuietButton>
        </>
      )}

      {view === 'count' && (
        <>
          <AttendeeStepper
            value={attendees}
            max={seats}
            onChange={setAttendees}
            tone={tone}
            disabled={isSending}
          />
          <PrimaryButton tone={tone} sending={isSending} onClick={confirm}>
            {attendees === 1 ? 'Confirmar 1 lugar' : `Confirmar ${attendees} lugares`}
          </PrimaryButton>
          <QuietButton tone={tone} disabled={isSending} onClick={() => setView('ask')}>
            Volver
          </QuietButton>
        </>
      )}

      {view === 'decline' && (
        <>
          <p className={clsx('m-0 text-[14.5px] leading-relaxed', soft)}>
            {guest && plural
              ? 'Lamentamos mucho que no puedan acompañarnos. Gracias por avisarnos.'
              : 'Lamentamos mucho que no puedas acompañarnos. Gracias por avisarnos.'}
          </p>
          <label className={clsx('flex w-full flex-col gap-2 text-left text-[13px]', soft)}>
            <span>
              ¿Quieres dejar unas palabras? <span className="opacity-75">(opcional)</span>
            </span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={RSVP_MESSAGE_MAX}
              rows={3}
              disabled={isSending}
              placeholder="Nos encantaría estar, pero ese día…"
              className={clsx(
                'w-full resize-y rounded-inv-md border bg-transparent px-3.5 py-2.5 font-inv-body text-[14.5px] leading-relaxed',
                'focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none',
                onImage
                  ? 'border-current/40 text-inv-on-primary placeholder:text-inv-on-primary/60'
                  : 'border-inv-line text-inv-ink placeholder:text-inv-ink-soft/70',
              )}
            />
          </label>
          <PrimaryButton tone={tone} sending={isSending} onClick={decline}>
            Enviar respuesta
          </PrimaryButton>
          <QuietButton tone={tone} disabled={isSending} onClick={() => setView('ask')}>
            Volver
          </QuietButton>
        </>
      )}

      {(view === 'confirmed' || view === 'declined') && (
        <>
          <p className={clsx('m-0 inline-flex items-center gap-2.5 text-left text-[15px]', strong)}>
            <span
              aria-hidden="true"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-current/10"
            >
              {view === 'confirmed' ? (
                <Check size={18} strokeWidth={2.2} />
              ) : (
                <HeartHandshake size={18} strokeWidth={1.8} />
              )}
            </span>
            {view === 'confirmed' ? confirmedText(guest !== null, attendees) : declinedText(guest !== null && plural)}
          </p>
          {guest && (
            <QuietButton tone={tone} onClick={() => setView('ask')}>
              Cambiar respuesta
            </QuietButton>
          )}
        </>
      )}

      {problem && (
        <p className={clsx('m-0 inline-flex items-start gap-2 text-left text-[13.5px] leading-relaxed', soft)}>
          <TriangleAlert size={16} strokeWidth={1.8} aria-hidden="true" className="mt-0.5 shrink-0" />
          {problem}
        </p>
      )}

      {/* El acuse para lector de pantalla. Ver la nota de `RsvpAction`. */}
      <span className="sr-only" role="status" aria-live="polite">
        {view === 'confirmed'
          ? confirmedText(guest !== null, attendees)
          : view === 'declined'
            ? declinedText(guest !== null && plural)
            : ''}
      </span>
    </div>
  );
}

function confirmedText(withGuest: boolean, attendees: number): string {
  if (!withGuest) return '¡Listo! Tu asistencia quedó confirmada.';

  return attendees === 1
    ? '¡Gracias! Tu lugar quedó confirmado.'
    : `¡Gracias! Quedaron confirmados ${attendees} lugares.`;
}

function declinedText(plural: boolean): string {
  return plural
    ? 'Gracias por avisarnos. Los vamos a extrañar.'
    : 'Gracias por avisarnos. Te vamos a extrañar.';
}

function PrimaryButton({
  tone,
  sending,
  onClick,
  children,
}: {
  readonly tone: Tone;
  readonly sending: boolean;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      /* Deshabilitado mientras envía: sin esto, quien no ve respuesta inmediata pulsa tres veces
         y responde tres veces. */
      disabled={sending}
      className={actionClasses(tone, sending ? 'cursor-wait opacity-70' : undefined)}
    >
      {sending && (
        <LoaderCircle size={16} strokeWidth={2} aria-hidden="true" className="animate-spin" />
      )}
      {sending ? 'Enviando…' : children}
    </button>
  );
}

/** La acción secundaria: con la misma voz que un enlace de texto, para que no compita. */
function QuietButton({
  tone,
  disabled = false,
  onClick,
  children,
}: {
  readonly tone: Tone;
  readonly disabled?: boolean;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'cursor-pointer border-0 bg-transparent p-0 font-inv-body text-[13px] tracking-[0.04em]',
        'underline decoration-current/30 underline-offset-4 transition-opacity hover:opacity-70',
        'focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none disabled:opacity-50',
        tone === 'onImage' ? 'text-inv-on-primary' : 'text-inv-accent',
      )}
    >
      {children}
    </button>
  );
}

/**
 * Cuántos van, de uno al cupo.
 *
 * Un contador con dos botones y no un campo numérico: en el móvil, un `<input type="number">`
 * abre el teclado entero para cambiar un 4 por un 3, y deja escribir 40.
 */
function AttendeeStepper({
  value,
  max,
  onChange,
  tone,
  disabled,
}: {
  readonly value: number;
  readonly max: number;
  readonly onChange: (value: number) => void;
  readonly tone: Tone;
  readonly disabled: boolean;
}) {
  const onImage = tone === 'onImage';
  const stepClasses = clsx(
    'grid size-10 cursor-pointer place-items-center rounded-full border bg-transparent transition-opacity',
    'focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-35',
    onImage ? 'border-current/45 text-inv-on-primary' : 'border-inv-line text-inv-primary',
  );

  return (
    <div className="flex flex-col items-center gap-2">
      <span className={clsx('text-[13px]', onImage ? 'text-inv-on-primary opacity-90' : 'text-inv-ink-soft')}>
        ¿Cuántos asistirán?
      </span>
      <div className="flex items-center gap-5" role="group" aria-label="Número de asistentes">
        <button
          type="button"
          className={stepClasses}
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={disabled || value <= 1}
          aria-label="Uno menos"
        >
          <Minus size={16} strokeWidth={2} aria-hidden="true" />
        </button>
        <span
          className={clsx('min-w-[3ch] text-center font-inv-display text-[34px] leading-none', onImage ? 'text-inv-on-primary' : 'text-inv-primary')}
          aria-live="polite"
        >
          {value}
        </span>
        <button
          type="button"
          className={stepClasses}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={disabled || value >= max}
          aria-label="Uno más"
        >
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
      <span className={clsx('text-[12px] tracking-[0.12em] uppercase', onImage ? 'text-inv-on-primary opacity-75' : 'text-inv-ink-soft')}>
        de {max} {max === 1 ? 'lugar' : 'lugares'}
      </span>
    </div>
  );
}
