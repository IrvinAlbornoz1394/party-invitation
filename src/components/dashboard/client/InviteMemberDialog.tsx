'use client';

import { useActionState, useState } from 'react';
import { Alert, Button, Input, Modal, Select } from 'antd';
import { IDLE_ACTION_STATE, type ActionState } from '@/app/action-state';
import { inviteUserAction } from '@/app/panel/(authenticated)/equipo/actions';
import { hasRoleAtLeast, type ClientActor, type UserRole } from '@/domain/auth/actor';
import { ROLE_HELP, ROLE_LABEL } from './team-roles';

/**
 * Invitar a alguien al equipo del cliente.
 *
 * No emite ningún token de invitación, y no le hace falta: con acceso por código de un solo
 * uso, la persona entra pidiendo el suyo y el correo ES la verificación. Un token añadiría
 * una segunda credencial que caduca, que hay que reenviar y que hay que poder revocar.
 */
export function InviteMemberDialog({
  open,
  actor,
  onClose,
  onResult,
}: {
  readonly open: boolean;
  readonly actor: ClientActor;
  readonly onClose: () => void;
  readonly onResult: (state: ActionState) => void;
}) {
  const [role, setRole] = useState<UserRole>('staff');

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

  /*
   * Solo los roles que este actor puede conceder. La regla real la aplica el dominio en el
   * servidor; esto evita ofrecer lo que va a ser rechazado — un administrador no ve la
   * opción «Dueño» en lugar de elegirla y recibir un error.
   */
  const assignableRoles = (['owner', 'admin', 'staff'] as const).filter((candidate) =>
    hasRoleAtLeast(actor, candidate),
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

        <label className="dash-form__label" htmlFor="invite-role">
          Rol
        </label>
        <Select
          id="invite-role"
          value={role}
          onChange={setRole}
          size="large"
          style={{ width: '100%' }}
          options={assignableRoles.map((option) => ({
            value: option,
            label: ROLE_LABEL[option],
            title: ROLE_HELP[option],
          }))}
        />
        <p className="dash-form__help">{ROLE_HELP[role]}</p>
        {/*
          El Select de antd no expone un `name` al formulario, así que el valor viaja en un
          campo oculto espejado desde el estado. Es el mismo patrón que el código OTP en la
          pantalla de acceso.
        */}
        <input type="hidden" name="role" value={role} />

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
