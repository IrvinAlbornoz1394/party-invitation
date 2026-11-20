'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { Alert, Button, Input, Modal } from 'antd';
import type { ActionState } from '@/app/action-state';
import { deleteEventAction } from '@/app/admin/(authenticated)/eventos/actions';
import type { ClientSummary } from '@/domain/clients/client-repository';
import type { EventSummary } from '@/domain/events/event-repository';

/**
 * Confirmar una eliminación: la de un cliente o la de un evento.
 *
 * Eliminar es lógico —nada se borra de la base— pero desde la pantalla no se puede deshacer, y
 * tumba invitaciones que alguien puede estar a punto de abrir. Por eso el diálogo dice qué deja
 * de funcionar y, cuando el daño es grande, pide escribir `confirmText` antes de activar el botón.
 *
 * Si la acción falla el diálogo se queda abierto con el error; si sale bien, avisa con `onResult`
 * y se cierra.
 */
export function DeleteDialog({
  open,
  title,
  children,
  confirmText,
  confirmLabel,
  onConfirm,
  onClose,
  onResult,
}: {
  readonly open: boolean;
  readonly title: string;
  /** Qué se pierde. */
  readonly children: ReactNode;
  /** Si viene, hay que escribirlo tal cual para poder eliminar. */
  readonly confirmText?: string;
  readonly confirmLabel: string;
  readonly onConfirm: () => Promise<ActionState>;
  readonly onClose: () => void;
  readonly onResult: (state: ActionState) => void;
}) {
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const armed = confirmText === undefined || typed.trim() === confirmText.trim();

  const close = () => {
    if (isPending) return;
    setTyped('');
    setError(null);
    onClose();
  };

  const confirm = () => {
    startTransition(async () => {
      const result = await onConfirm();

      if (result.status === 'success') {
        setTyped('');
        setError(null);
        onResult(result);
        onClose();
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <Modal title={title} open={open} onCancel={close} footer={null} destroyOnHidden>
      <div className="dash-form">
        <div role="alert" aria-live="assertive">
          {error && <Alert type="error" showIcon message={error} className="dash-form__alert" />}
        </div>

        <div className="dash-form__help">{children}</div>

        {confirmText !== undefined && (
          <>
            <label className="dash-form__label" htmlFor="delete-confirm">
              Escribe <strong>{confirmText}</strong> para confirmar
            </label>
            <Input
              id="delete-confirm"
              size="large"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              onPressEnter={() => armed && !isPending && confirm()}
            />
          </>
        )}

        <Button
          type="primary"
          danger
          size="large"
          block
          disabled={!armed}
          loading={isPending}
          onClick={confirm}
          className="dash-form__submit"
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/** Eliminar un evento, desde la lista de eventos o la ficha de su cliente. */
export function DeleteEventDialog({
  event,
  onClose,
  onResult,
}: {
  /** El evento a eliminar; `null` con el diálogo cerrado. */
  readonly event: EventSummary | null;
  readonly onClose: () => void;
  readonly onResult: (state: ActionState) => void;
}) {
  return (
    <DeleteDialog
      key={event?.id}
      open={event !== null}
      title="Eliminar evento"
      confirmLabel="Eliminar evento"
      confirmText={event?.status === 'published' ? event.slug : undefined}
      onConfirm={() =>
        event
          ? deleteEventAction(event.id, event.clientId)
          : Promise.resolve({ status: 'error', message: null })
      }
      onClose={onClose}
      onResult={onResult}
    >
      <p>
        Vas a eliminar <strong>{event?.title}</strong>. Desaparece de las listas, su invitación deja
        de abrirse y el enlace del cliente deja de funcionar.
      </p>
      {event?.status === 'published' && (
        <p>
          <strong>Esta invitación está publicada:</strong> quien tenga el enlace ya no podrá verla.
        </p>
      )}
    </DeleteDialog>
  );
}

/** Lo que se pierde al eliminar un cliente. Lo comparten la ficha y la lista de clientes. */
export function DeleteClientWarning({ client }: { readonly client: ClientSummary }) {
  return (
    <>
      <p>
        Vas a eliminar a <strong>{client.name}</strong>
        {client.eventCount === 1 && ' y su evento'}
        {client.eventCount > 1 && ` y sus ${client.eventCount} eventos`}
        . Sus invitaciones dejan de abrirse y su responsable pierde el acceso.
      </p>
      {client.contactEmail && (
        <p>
          El correo <strong>{client.contactEmail}</strong> queda libre para dar de alta un cliente
          nuevo.
        </p>
      )}
    </>
  );
}
