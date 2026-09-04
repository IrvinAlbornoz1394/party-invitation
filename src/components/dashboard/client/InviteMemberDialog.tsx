'use client';

import { useActionState } from 'react';
import { Alert, Button, Input, Modal } from 'antd';
import { IDLE_ACTION_STATE, type ActionState } from '@/app/action-state';
import { inviteUserAction } from '@/app/panel/(authenticated)/equipo/actions';
import { ROLE_HELP } from './team-roles';

/**
 * Invitar a un colaborador al equipo del cliente.
 *
 * No emite ningún token de invitación, y no le hace falta: con acceso por código de un solo
 * uso, la persona entra pidiendo el suyo y el correo ES la verificación. Un token añadiría
 * una segunda credencial que caduca, que hay que reenviar y que hay que poder revocar.
 *
 * ## Ya no pregunta el rol
 *
 * Solo lo abre el dueño y solo puede conceder uno, así que el desplegable ofrecía una opción:
 * un control que no decide nada y que hay que leer igual. El valor viaja en un campo oculto
 * porque la acción de servidor sigue recibiendo lo mismo y no tiene por qué enterarse de que
 * en una pantalla hubo o dejó de haber un selector.
 *
 * Traspasar la cuenta a otro dueño sigue siendo posible, pero no desde aquí: se hace cambiando
 * el rol de alguien que ya está en la lista. Es una operación bastante más grave que invitar, y
 * ofrecerla en el mismo formulario donde se teclea un correo la abarataba de más.
 */
export function InviteMemberDialog({
  open,
  onClose,
  onResult,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onResult: (state: ActionState) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (previous: ActionState, formData: FormData) => {
      const result = await inviteUserAction(previous, formData);

      // El modal se cierra solo cuando sale bien; si falla, se queda abierto con lo escrito
      // para poder corregir. Volver a teclear todo por una errata en el correo sería el
      // camino más corto a que nadie use esta pantalla.
      if (result.status === 'success') {
        onResult(result);
        onClose();
      }

      return result;
    },
    IDLE_ACTION_STATE,
  );

  return (
    <Modal title="Invitar a alguien" open={open} onCancel={onClose} footer={null} destroyOnHidden>
      <p className="dash-form__intro">
        Recibirá un correo diciendo que ya tiene acceso. No hay contraseñas: entra con un código
        de 6 dígitos.
      </p>

      <form action={formAction} className="dash-form">
        <div role="alert" aria-live="assertive">
          {state.status === 'error' && state.message && (
            <Alert type="error" showIcon message={state.message} className="dash-form__alert" />
          )}
        </div>

        <label className="dash-form__label" htmlFor="invite-name">
          Nombre
        </label>
        <Input id="invite-name" name="name" size="large" placeholder="María Pérez" required />

        <label className="dash-form__label" htmlFor="invite-email">
          Correo electrónico
        </label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          size="large"
          placeholder="maria@correo.com"
          autoComplete="off"
          required
        />

        <label className="dash-form__label" htmlFor="invite-phone">
          Teléfono <span className="dash-form__hint">(opcional)</span>
        </label>
        <Input
          id="invite-phone"
          name="phone"
          type="tel"
          size="large"
          placeholder="999 123 4567"
          autoComplete="off"
        />

        <p className="dash-form__help">Entra como colaborador. {ROLE_HELP.staff}</p>
        <input type="hidden" name="role" value="staff" />

        <Button
          htmlType="submit"
          type="primary"
          size="large"
          block
          loading={isPending}
          className="dash-form__submit"
        >
          Enviar invitación
        </Button>
      </form>
    </Modal>
  );
}
