'use client';

import { useActionState } from 'react';
import { Alert, Button, Input, Modal } from 'antd';
import { IDLE_ACTION_STATE, type ActionState } from '@/app/action-state';
import { grantEventAccessAction } from '@/app/panel/(event)/eventos/[id]/accesos/actions';

/**
 * Dar acceso a un evento.
 *
 * Un campo obligatorio: el correo. Es la diferencia entera con `InviteMemberDialog`, y no es un
 * atajo — es lo que hace que este acceso se pueda dar en el momento, por teléfono, sin pedirle
 * a nadie su nombre completo para poder mirar su propia boda. La identidad se crea sin nombre
 * (`users.name` es nullable justamente por esto) y quien pinte uno cae al correo.
 *
 * La etiqueta es opcional y es de quien la escribe, no de quien la recibe: «Los novios», «Mamá
 * de la quinceañera». Sirve para distinguir tres correos parecidos en la lista y para encabezar
 * el aviso que se manda. Vive en `memberships.label` y no en la identidad porque es cómo llama
 * ESTE cliente a esa persona; la misma dirección puede ser «los novios» en una boda y «el
 * fotógrafo» en otra.
 */
export function GrantAccessDialog({
  open,
  eventId,
  eventTitle,
  onClose,
  onResult,
}: {
  readonly open: boolean;
  readonly eventId: string;
  readonly eventTitle: string;
  readonly onClose: () => void;
  readonly onResult: (state: ActionState) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (previous: ActionState, formData: FormData) => {
      const result = await grantEventAccessAction(previous, formData);

      // El modal se cierra solo cuando sale bien; si falla, se queda abierto con lo escrito
      // para poder corregir la errata sin volver a teclear el correo entero.
      if (result.status === 'success') {
        onResult(result);
        onClose();
      }

      return result;
    },
    IDLE_ACTION_STATE,
  );

  return (
    <Modal title="Dar acceso a este evento" open={open} onCancel={onClose} footer={null} destroyOnHidden>
      <p className="dash-form__intro">
        Podrá ver «{eventTitle}» y ningún otro evento. No podrá editar nada ni ver tu equipo.
      </p>

      <form action={formAction} className="dash-form">
        {/* La región existe siempre, con o sin error. `aria-live` solo anuncia los cambios
            dentro de un elemento que YA estaba en el árbol: si el contenedor apareciera junto
            con el mensaje, el lector no tendría nada que comparar y no diría nada. */}
        <div role="alert" aria-live="assertive">
          {state.status === 'error' && state.message && (
            <Alert type="error" showIcon message={state.message} className="dash-form__alert" />
          )}
        </div>

        <input type="hidden" name="eventId" value={eventId} />

        <label className="dash-form__label" htmlFor="grant-email">
          Correo electrónico
        </label>
        <Input
          id="grant-email"
          name="email"
          type="email"
          size="large"
          placeholder="novios@correo.com"
          autoComplete="off"
          required
          aria-describedby="grant-email-help"
        />
        <p className="dash-form__help" id="grant-email-help">
          Con este correo pedirá su código para entrar. No hay contraseñas y no hace falta nada
          más.
        </p>

        <label className="dash-form__label" htmlFor="grant-label">
          Cómo lo llamas <span className="dash-form__hint">(opcional)</span>
        </label>
        <Input
          id="grant-label"
          name="label"
          size="large"
          placeholder="Los novios"
          autoComplete="off"
          aria-describedby="grant-label-help"
        />
        <p className="dash-form__help" id="grant-label-help">
          Solo para que tú lo distingas en esta lista. Es lo que encabeza el correo que le
          mandamos.
        </p>

        <Button
          htmlType="submit"
          type="primary"
          size="large"
          block
          loading={isPending}
          className="dash-form__submit"
        >
          Dar acceso
        </Button>
      </form>
    </Modal>
  );
}
