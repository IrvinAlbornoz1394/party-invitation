'use client';

import { useActionState, useState } from 'react';
import { Alert, Button, Input, Modal } from 'antd';
import { IDLE_ACTION_STATE, type ActionState } from '@/app/action-state';
import { createClientAction } from '@/app/admin/(authenticated)/clientes/actions';
import { slugifyClientName } from '@/domain/clients/client-slug';

/**
 * Alta de un cliente.
 *
 * Crea el cliente y su primera cuenta dueña **en una sola operación**. No se pueden separar:
 * un cliente sin ninguna cuenta no lo puede arreglar nadie desde la aplicación, porque para
 * entrar a un cliente hace falta tener cuenta en él. Por eso el formulario pide las dos cosas
 * y la base de datos las escribe atómicamente.
 *
 * Está en su propio archivo, y no dentro de la pantalla que lo abre, porque son dos
 * responsabilidades: una lista y un formulario de alta. Juntos daban un archivo de doscientas
 * líneas en el que había que buscar dónde acababa una cosa y empezaba la otra.
 */
export function NewClientDialog({
  open,
  onClose,
  onResult,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onResult: (state: ActionState) => void;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const [state, formAction, isPending] = useActionState(
    async (previous: ActionState, formData: FormData) => {
      const result = await createClientAction(previous, formData);

      /*
       * El modal se cierra solo cuando sale bien; si falla, se queda abierto con lo escrito
       * para poder corregir. Volver a teclear cinco campos por una errata en el correo sería
       * el camino más corto a que nadie use esta pantalla.
       */
      if (result.status === 'success') {
        onResult(result);
        setName('');
        setSlug('');
        onClose();
      }

      return result;
    },
    IDLE_ACTION_STATE,
  );

  /*
   * El identificador se propone a partir del nombre pero se puede sobreescribir. Se enseña
   * en lugar de generarlo en silencio porque es lo que se dicta por teléfono en soporte:
   * corregirlo aquí es más barato que descubrir después que se llama `familia-p-rez`.
   */
  const suggestedSlug = slug.length > 0 ? slug : slugifyClientName(name);

  return (
    <Modal
      title="Dar de alta un cliente"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <p className="dash-form__intro">
        Se crea el cliente y la cuenta de la persona responsable, que entrará con su propio
        código. No hay contraseñas.
      </p>

      <form action={formAction} className="dash-form">
        {/*
          La región existe siempre, con o sin error. `aria-live` solo anuncia los cambios
          dentro de un elemento que YA estaba en el árbol: si el contenedor apareciera junto
          con el mensaje, el lector no tendría nada que comparar y no diría nada. Es el fallo
          clásico de este patrón.
        */}
        <div role="alert" aria-live="assertive">
          {state.status === 'error' && state.message && (
            <Alert type="error" showIcon message={state.message} className="dash-form__alert" />
          )}
        </div>

        <label className="dash-form__label" htmlFor="client-name">
          Nombre del cliente
        </label>
        <Input
          id="client-name"
          name="name"
          size="large"
          placeholder="Familia Méndez"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="off"
          required
        />

        <label className="dash-form__label" htmlFor="client-slug">
          Identificador <span className="dash-form__hint">(interno)</span>
        </label>
        <Input
          id="client-slug"
          name="slug"
          size="large"
          placeholder={suggestedSlug || 'familia-mendez'}
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          autoComplete="off"
          aria-describedby="client-slug-help"
        />
        <p className="dash-form__help" id="client-slug-help">
          Solo letras, números y guiones. Si lo dejas vacío se genera a partir del nombre.
        </p>

        <label className="dash-form__label" htmlFor="client-contact">
          Correo de contacto <span className="dash-form__hint">(opcional)</span>
        </label>
        <Input
          id="client-contact"
          name="contactEmail"
          type="email"
          size="large"
          placeholder="contacto@cliente.com"
          autoComplete="off"
        />

        <label className="dash-form__label" htmlFor="client-owner-name">
          Persona responsable
        </label>
        <Input
          id="client-owner-name"
          name="ownerName"
          size="large"
          placeholder="Laura Méndez"
          autoComplete="off"
          required
        />

        <label className="dash-form__label" htmlFor="client-owner-email">
          Su correo
        </label>
        <Input
          id="client-owner-email"
          name="ownerEmail"
          type="email"
          size="large"
          placeholder="laura@cliente.com"
          autoComplete="off"
          required
          aria-describedby="client-owner-help"
        />
        <p className="dash-form__help" id="client-owner-help">
          Recibirá un aviso de alta. Con este correo pedirá su código para entrar.
        </p>

        <Button
          htmlType="submit"
          type="primary"
          size="large"
          block
          loading={isPending}
          className="dash-form__submit"
        >
          Crear cliente
        </Button>
      </form>
    </Modal>
  );
}
