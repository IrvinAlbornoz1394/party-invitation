'use client';

import { useActionState } from 'react';
import { Alert, Button, Input, Modal } from 'antd';
import { IDLE_ACTION_STATE, type ActionState } from '@/app/action-state';
import { saveGuestGroupAction } from '@/app/panel/(event)/eventos/[id]/invitados/actions';
import { MAX_GROUP_SEATS, type GuestGroup } from '@/domain/guests/guest-group';

/**
 * Dar de alta o editar una familia.
 *
 * Lo mínimo que hace falta para repartir su enlace: cómo se llama y cuántos lugares tiene. El
 * WhatsApp es para mandárselo en un toque desde la lista, y las notas son del organizador —la
 * familia nunca las ve—.
 */
export function GuestGroupDialog({
  open,
  eventId,
  group,
  onClose,
  onResult,
}: {
  readonly open: boolean;
  readonly eventId: string;
  /** `null` da de alta una familia nueva. */
  readonly group: GuestGroup | null;
  readonly onClose: () => void;
  readonly onResult: (state: ActionState) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (previous: ActionState, formData: FormData) => {
      const result = await saveGuestGroupAction(previous, formData);

      // Se cierra solo cuando sale bien; si falla, se queda abierto con lo escrito.
      if (result.status === 'success') {
        onResult(result);
        onClose();
      }

      return result;
    },
    IDLE_ACTION_STATE,
  );

  return (
    <Modal
      title={group ? `Editar «${group.name}»` : 'Agregar invitación'}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <p className="dash-form__intro">
        Cada invitación tiene su propio enlace. Desde él, la familia confirma cuántos asistirán —hasta
        los lugares que le apartes— o avisa que no podrá ir.
      </p>

      <form action={formAction} className="dash-form">
        <div role="alert" aria-live="assertive">
          {state.status === 'error' && state.message && (
            <Alert type="error" showIcon message={state.message} className="dash-form__alert" />
          )}
        </div>

        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="groupId" value={group?.id ?? ''} />

        <label className="dash-form__label" htmlFor="guest-name">
          Nombre
        </label>
        <Input
          id="guest-name"
          name="name"
          size="large"
          placeholder="Familia Robles Cámara"
          defaultValue={group?.name}
          maxLength={120}
          autoComplete="off"
          required
          aria-describedby="guest-name-help"
        />
        <p className="dash-form__help" id="guest-name-help">
          Así la saluda la invitación: «Invitación para Familia Robles Cámara».
        </p>

        <label className="dash-form__label" htmlFor="guest-seats">
          Lugares apartados
        </label>
        <Input
          id="guest-seats"
          name="seats"
          type="number"
          size="large"
          min={1}
          max={MAX_GROUP_SEATS}
          defaultValue={group?.seats ?? 2}
          required
          aria-describedby="guest-seats-help"
          style={{ maxWidth: 160 }}
        />
        <p className="dash-form__help" id="guest-seats-help">
          Al confirmar podrán elegir de 1 hasta este número.
        </p>

        <label className="dash-form__label" htmlFor="guest-phone">
          WhatsApp <span className="dash-form__hint">(opcional)</span>
        </label>
        <Input
          id="guest-phone"
          name="phone"
          size="large"
          inputMode="tel"
          placeholder="999 123 4567"
          defaultValue={group?.phone ?? ''}
          autoComplete="off"
          aria-describedby="guest-phone-help"
        />
        <p className="dash-form__help" id="guest-phone-help">
          Para mandarle su enlace desde la lista con un toque.
        </p>

        <label className="dash-form__label" htmlFor="guest-notes">
          Notas <span className="dash-form__hint">(opcional)</span>
        </label>
        <Input.TextArea
          id="guest-notes"
          name="notes"
          rows={2}
          maxLength={500}
          placeholder="Amigos del novio, mesa cerca de la pista…"
          defaultValue={group?.notes ?? ''}
          aria-describedby="guest-notes-help"
        />
        <p className="dash-form__help" id="guest-notes-help">
          Solo las ves tú. La familia no.
        </p>

        <Button
          htmlType="submit"
          type="primary"
          size="large"
          block
          loading={isPending}
          className="dash-form__submit"
        >
          {group ? 'Guardar cambios' : 'Agregar'}
        </Button>
      </form>
    </Modal>
  );
}
