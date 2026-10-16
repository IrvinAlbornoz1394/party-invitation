'use client';

import { useActionState } from 'react';
import { Alert, Button, Input, Modal } from 'antd';
import { IDLE_ACTION_STATE, type ActionState } from '@/app/action-state';
import { updateClientAction } from '@/app/admin/(authenticated)/clientes/actions';
import type { ClientSummary } from '@/domain/clients/client-repository';

/**
 * Corregir los datos de un cliente: nombre, correo y WhatsApp.
 *
 * El identificador se enseña y no se edita: es lo que se dicta en soporte, y cambiarlo solo
 * rompería esa memoria.
 *
 * Los campos son no controlados con su valor inicial. Al guardar, la página se revalida y el
 * diálogo se desmonta al cerrarse (`destroyOnHidden`), así que la siguiente vez que se abre ya
 * parte de los datos nuevos sin sincronizar nada a mano.
 */
export function EditClientDialog({
  client,
  open,
  onClose,
  onResult,
}: {
  readonly client: ClientSummary;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onResult: (state: ActionState) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (previous: ActionState, formData: FormData) => {
      const result = await updateClientAction(previous, formData);

      /* Igual que el alta: si falla, el diálogo se queda abierto con lo escrito. */
      if (result.status === 'success') {
        onResult(result);
        onClose();
      }

      return result;
    },
    IDLE_ACTION_STATE,
  );

  return (
    <Modal title="Editar cliente" open={open} onCancel={onClose} footer={null} destroyOnHidden>
      <form action={formAction} className="dash-form">
        <input type="hidden" name="clientId" value={client.id} />

        {/* Siempre en el árbol: ver `NewClientDialog` para por qué `aria-live` lo necesita. */}
        <div role="alert" aria-live="assertive">
          {state.status === 'error' && state.message && (
            <Alert type="error" showIcon message={state.message} className="dash-form__alert" />
          )}
        </div>

        <label className="dash-form__label" htmlFor="edit-client-name">
          Nombre del cliente
        </label>
        <Input
          id="edit-client-name"
          name="name"
          size="large"
          defaultValue={client.name}
          autoComplete="off"
          required
        />

        <label className="dash-form__label" htmlFor="edit-client-slug">
          Identificador <span className="dash-form__hint">(no se cambia)</span>
        </label>
        <Input id="edit-client-slug" size="large" value={client.slug} disabled />

        <label className="dash-form__label" htmlFor="edit-client-contact">
          Correo del cliente
        </label>
        <Input
          id="edit-client-contact"
          name="contactEmail"
          type="email"
          size="large"
          defaultValue={client.contactEmail ?? ''}
          autoComplete="off"
          required
          aria-describedby="edit-client-contact-help"
        />
        <p className="dash-form__help" id="edit-client-contact-help">
          Si lo cambias, la persona responsable entrará con el correo nuevo: es el mismo para los
          avisos y para pedir su código.
        </p>

        <label className="dash-form__label" htmlFor="edit-client-phone">
          WhatsApp <span className="dash-form__hint">(opcional)</span>
        </label>
        <Input
          id="edit-client-phone"
          name="contactPhone"
          type="tel"
          size="large"
          defaultValue={client.contactPhone ?? ''}
          placeholder="999 123 4567"
          autoComplete="off"
        />

        <Button
          htmlType="submit"
          type="primary"
          size="large"
          block
          loading={isPending}
          className="dash-form__submit"
        >
          Guardar cambios
        </Button>
      </form>
    </Modal>
  );
}
