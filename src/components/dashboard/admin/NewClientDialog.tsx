'use client';

import { useActionState, useState } from 'react';
import { Alert, Button, Input, Modal, Switch } from 'antd';
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
  /*
   * Cómo se llama la cuenta que se crea, y por qué esto es un interruptor.
   *
   * `clients.name` es el cliente —a quién se le factura, de quién son los eventos— y `users.name`
   * es la persona que entra al panel. Son cosas distintas y se ven en sitios distintos: el
   * segundo encabeza cada correo con su código de acceso y es lo que lista `/panel/equipo` cuando
   * el dueño invita a alguien más.
   *
   * Pero en la mayoría de las altas son la **misma persona**: alguien que contrata la invitación
   * de su propia boda. Pedirlo dos veces en ese caso es una pregunta de más, y quitarlo del todo
   * dejaría a las familias y a las agencias con una cuenta llamada «Familia Méndez» saludando en
   * sus correos.
   *
   * Con el interruptor, el caso común no se escribe y el otro sigue siendo posible.
   */
  const [sameName, setSameName] = useState(true);
  const [ownerName, setOwnerName] = useState('');

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
        setOwnerName('');
        setSameName(true);
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

        {/*
          Un solo correo, y obligatorio.

          Eran dos —uno «de contacto», opcional, y otro para la cuenta— y en la práctica se
          escribía el mismo en los dos, o el primero se quedaba vacío y después no había a dónde
          mandar los avisos del evento. Dos campos para una dirección es una pregunta de más y la
          forma de acabar con dos direcciones distintas sin que nadie decidiera separarlas.
        */}
        <label className="dash-form__label" htmlFor="client-contact">
          Correo del cliente
        </label>
        <Input
          id="client-contact"
          name="contactEmail"
          type="email"
          size="large"
          placeholder="contacto@cliente.com"
          autoComplete="off"
          required
          aria-describedby="client-contact-help"
        />
        <p className="dash-form__help" id="client-contact-help">
          Aquí llegan los avisos, y con este correo pedirá su código para entrar. No hay
          contraseñas.
        </p>

        {/*
          El teléfono se guarda y todavía no se usa para nada.

          Va ahora porque pedirlo cuesta un campo y conseguirlo después cuesta una llamada: el día
          que WhatsApp esté integrado, los avisos podrán salir por los dos lados sin volver a
          preguntárselo a nadie. Opcional mientras ese día no llegue — exigir un dato que no se
          usa es fricción sin contrapartida.
        */}
        <label className="dash-form__label" htmlFor="client-phone">
          WhatsApp <span className="dash-form__hint">(opcional)</span>
        </label>
        <Input
          id="client-phone"
          name="contactPhone"
          type="tel"
          size="large"
          placeholder="999 123 4567"
          autoComplete="off"
          aria-describedby="client-phone-help"
        />
        <p className="dash-form__help" id="client-phone-help">
          Todavía no mandamos nada por aquí. Lo guardamos para cuando los avisos también salgan
          por WhatsApp.
        </p>

        {/*
          El interruptor va **antes** del campo que gobierna y no al lado: primero se decide si
          hace falta escribir algo, y solo entonces aparece dónde escribirlo. Al revés —un campo
          que se desactiva— deja a la vista una casilla que no se puede tocar, que es la manera
          de que alguien intente tocarla.
        */}
        <div className="dash-form__field dash-switch-field">
          <Switch
            id="client-same-name"
            checked={sameName}
            onChange={setSameName}
            aria-describedby="client-same-name-note"
          />
          <div className="min-w-0">
            <label className="dash-form__label" htmlFor="client-same-name">
              La cuenta va a nombre del cliente
            </label>
            <p className="dash-form__help" id="client-same-name-note">
              {sameName
                ? `Se creará a nombre de «${name.trim() || 'el nombre de arriba'}». Es lo normal cuando el cliente es una persona.`
                : 'La cuenta irá a nombre de otra persona: la que de verdad entra al panel.'}
            </p>
          </div>
        </div>

        {sameName ? (
          /* El nombre viaja igual, en un campo oculto: la acción de servidor recibe siempre lo
             mismo y no tiene que saber que existió un interruptor en una pantalla. */
          <input type="hidden" name="ownerName" value={name.trim()} />
        ) : (
          <>
            <label className="dash-form__label" htmlFor="client-owner-name">
              Persona responsable
            </label>
            <Input
              id="client-owner-name"
              name="ownerName"
              size="large"
              placeholder="Laura Méndez"
              value={ownerName}
              onChange={(event) => setOwnerName(event.target.value)}
              autoComplete="off"
              required
              aria-describedby="client-owner-help"
            />
            <p className="dash-form__help" id="client-owner-help">
              Quien entra al panel. Aparece en sus correos y en la lista de su equipo.
            </p>
          </>
        )}

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
