'use client';

import { cloneElement, useActionState, useState, type ReactElement, type ReactNode } from 'react';
import { Alert, Button, Input, Modal, Select, Switch } from 'antd';
import { createEventAction } from '@/app/admin/(authenticated)/eventos/actions';
import {
  INITIAL_NEW_EVENT_STATE,
  type NewEventState,
} from '@/app/admin/(authenticated)/eventos/form-state';
import type { NewEventOptions } from '@/application/events/create-event';
import type { ClientSummary } from '@/domain/clients/client-repository';
import type { TemplateSummary } from '@/domain/catalog/catalog-repository';
import { slugifyEventName } from '@/domain/events/event-slug';
import { DEFAULT_EVENT_TIME_ZONE, EVENT_TIME_ZONES } from '@/domain/events/event-time-zone';
import { InvitationCell } from '../primitives/InvitationCell';

/**
 * Alta de un evento. El mismo formulario para las dos pantallas que lo abren.
 *
 * ## El cliente se enseña o no según de dónde se abra
 *
 * Desde `/admin/eventos` hay que elegirlo, porque esa pantalla es de todos los clientes. Desde la
 * ficha de un cliente ya se sabe cuál es, así que el campo **no se pinta** y el identificador
 * viaja en un campo oculto: preguntar por algo que la pantalla acaba de decir en su título es
 * pedirle a alguien que repita lo que está mirando, y abre la puerta a elegir el equivocado.
 *
 * Eso lo decide una sola propiedad, `client`. Con ella, el evento es de ese cliente y no hay
 * desplegable; sin ella, se elige entre `clients`. Dos componentes casi iguales habrían acabado
 * divergiendo en el primer campo que se añadiera a uno solo.
 *
 * Que el identificador esté oculto **no es una medida de seguridad** y conviene decirlo aquí: el
 * campo oculto lo manda el navegador igual que el desplegable, así que se puede cambiar con la
 * misma facilidad. Quien autoriza es `app.authorize_client_context()` en la base de datos, y lo
 * hace igual venga de donde venga. Ver `actions.ts`.
 *
 * ## Lo que el formulario propone solo
 *
 * El título, la dirección de la invitación y el tema llegan sugeridos —del nombre de quien
 * celebra los dos primeros, de la plantilla el tercero— y se pueden sobreescribir. Es lo que
 * convierte un alta de once campos en cuatro decisiones reales: cliente, tipo, plan y plantilla.
 */
export function NewEventDialog({
  open,
  onClose,
  onResult,
  options,
  clients = [],
  client = null,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onResult: (state: NewEventState) => void;
  /** El catálogo con el que se llenan los desplegables. Ver `LoadNewEventOptions`. */
  readonly options: NewEventOptions;
  /** Entre los que elegir cuando el cliente no viene dado. Se ignora si `client` llega. */
  readonly clients?: readonly ClientSummary[];
  /** El cliente al que pertenece el evento, cuando la pantalla ya lo sabe. */
  readonly client?: { readonly id: string; readonly name: string } | null;
}) {
  /*
   * El cliente fijo gana siempre sobre el elegido, en lugar de arrancar el estado con su id. Así
   * no hay dos verdades que sincronizar: sin `client` manda el desplegable, con `client` manda la
   * propiedad, y no existe el estado intermedio en el que el formulario recuerda al cliente de
   * una pantalla anterior.
   */
  const [chosenClientId, setChosenClientId] = useState('');
  const clientId = client?.id ?? chosenClientId;

  const [eventTypeKey, setEventTypeKey] = useState('');
  const [planKey, setPlanKey] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [themeId, setThemeId] = useState('');
  const [celebrantName, setCelebrantName] = useState('');
  /*
   * La fecha y la hora también son estado, aunque el control nativo sepa guardárselo solo. Si no
   * lo fueran, `reset()` no las alcanzaría y el evento siguiente empezaría con la fecha del
   * anterior — el error más caro que puede cometer este formulario.
   */
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [timeZone, setTimeZone] = useState<string>(DEFAULT_EVENT_TIME_ZONE);
  /*
   * Quién llena el contenido. Empieza apagado —lo llena la plataforma— porque es lo que pasa en
   * la mayoría de las altas: se da de alta el evento con los datos delante, en la misma llamada
   * en la que se cerró la venta.
   */
  const [clientFills, setClientFills] = useState(false);
  /*
   * En cuanto alguien escribe el título, deja de proponerse. Sin esta marca, corregir el nombre de
   * quien celebra pisaría un título escrito a mano — el peor momento posible para perderlo.
   */
  const [titleTouched, setTitleTouched] = useState(false);

  const [state, formAction, isPending] = useActionState(
    async (previous: NewEventState, formData: FormData) => {
      const result = await createEventAction(previous, formData);

      /*
       * Solo se cierra si salió bien. Si falla, el modal se queda abierto con todo lo escrito:
       * volver a capturar once campos por una fecha mal puesta sería el camino más corto a que
       * nadie use esta pantalla.
       */
      if (result.status === 'success') {
        onResult(result);
        reset();
        onClose();
      }

      return result;
    },
    INITIAL_NEW_EVENT_STATE,
  );

  function reset() {
    setChosenClientId('');
    setEventTypeKey('');
    setPlanKey('');
    setTemplateId('');
    setThemeId('');
    setCelebrantName('');
    setDate('');
    setTime('');
    setTitle('');
    setSlug('');
    setTimeZone(DEFAULT_EVENT_TIME_ZONE);
    setClientFills(false);
    setTitleTouched(false);
  }

  /*
   * Las plantillas se acotan por tipo de celebración y por plan, que son las dos relaciones que el
   * catálogo declara (`template_event_types` y `template_plans`). Ofrecer las que no encajan
   * llevaría a elegir una que el plan no incluye, y eso se descubriría al abrir la invitación.
   *
   * Mientras no haya tipo ni plan elegidos se ofrecen todas: filtrar por nada es no filtrar.
   */
  const templates = options.templates.filter((template) =>
    matches(template, eventTypeKey, planKey),
  );

  const chooseEventType = (value: string) => {
    setEventTypeKey(value);

    // La plantilla elegida puede dejar de encajar con el tipo nuevo. Se limpia en vez de dejarla
    // puesta e inválida: un desplegable que enseña algo que ya no está en su lista miente.
    if (templateId && !matches(templateOf(options, templateId), value, planKey)) setTemplateId('');
    if (!titleTouched) setTitle(suggestTitle(options, celebrantName, value));
  };

  const choosePlan = (value: string) => {
    setPlanKey(value);
    if (templateId && !matches(templateOf(options, templateId), eventTypeKey, value)) {
      setTemplateId('');
    }
  };

  /*
   * Elegir plantilla trae su tema. `templates.default_theme_key` existe justo para esto —«con cuál
   * se ve como se pensó»— y sigue siendo una sugerencia: el desplegable de tema queda con ese
   * valor y se puede cambiar por cualquier otro.
   */
  const chooseTemplate = (value: string) => {
    setTemplateId(value);

    const suggested = options.themes.find(
      (theme) => theme.key === templateOf(options, value)?.defaultThemeKey,
    );

    if (suggested) setThemeId(suggested.id);
  };

  const changeCelebrant = (value: string) => {
    setCelebrantName(value);
    if (!titleTouched) setTitle(suggestTitle(options, value, eventTypeKey));
  };

  const suggestedSlug = slugifyEventName(celebrantName);

  return (
    <Modal
      title="Dar de alta un evento"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      destroyOnHidden
    >
      <p className="dash-form__intro">
        {client
          ? `El evento será de ${client.name}. Nace en borrador: se publica cuando su invitación esté lista.`
          : 'El evento nace en borrador. Se publica cuando su invitación esté lista.'}
      </p>

      {/*
        Un `<form>` nativo y no el `<Form>` de antd, que es lo que había y lo que rompía el
        diálogo entero: su componente registra un `onSubmit` que llama a `preventDefault()` y a
        `stopPropagation()` para validar por su cuenta, y con eso React nunca ejecuta la acción de
        servidor del atributo `action`. El botón se pulsaba y no pasaba **nada** —ni error, ni
        carga, ni evento creado— desde las dos pantallas que abren este diálogo.

        No es un problema que se pueda esquivar con opciones: el `preventDefault` está escrito
        dentro de `@rc-component/form` y no depende de ninguna propiedad. O se usa el estado de
        campos de antd y se envía a mano desde `onFinish`, o se usa el formulario nativo. Aquí lo
        segundo es lo correcto y además lo que ya hacía el diálogo hermano (`NewClientDialog`):
        este formulario no usa ni una función de antd —los valores viven en `useState` y viajan en
        campos ocultos—, así que el `<Form>` solo aportaba la maqueta de los rótulos.
      */}
      <form action={formAction} className="dash-form">
        {/*
          La región existe siempre, con o sin error. `aria-live` solo anuncia los cambios dentro de
          un elemento que YA estaba en el árbol: si el contenedor apareciera junto con el mensaje,
          el lector no tendría nada que comparar y no diría nada.
        */}
        <div role="alert" aria-live="assertive">
          {state.status === 'error' && state.message && (
            <Alert type="error" showIcon title={state.message} className="dash-form__alert" />
          )}
        </div>

        {/*
          El identificador del cliente viaja siempre por el formulario. Cuando la pantalla lo sabe
          va aquí y no se enseña; cuando no, lo escribe el desplegable de abajo.
        */}
        <input type="hidden" name="clientId" value={clientId} />

        {client === null && (
          <FieldItem id="event-client" label="Cliente" error={state.errors.clientId}>
            <Select
              showSearch
              size="large"
              placeholder="Elige el cliente"
              /* Se busca por la etiqueta —el nombre— y no por el valor, que es un UUID: nadie
                 teclea un UUID para encontrar a nadie. */
              optionFilterProp="label"
              value={chosenClientId || undefined}
              onChange={setChosenClientId}
              style={{ width: '100%' }}
              options={clients.map((candidate) => ({
                value: candidate.id,
                label: candidate.name,
              }))}
            />
          </FieldItem>
        )}

        <div className="dash-field-row">
          <FieldItem id="event-type" label="Tipo de celebración" error={state.errors.eventTypeKey}>
            <Select
              size="large"
              placeholder="Boda, XV años…"
              value={eventTypeKey || undefined}
              onChange={chooseEventType}
              style={{ width: '100%' }}
              options={options.eventTypes.map((eventType) => ({
                value: eventType.key,
                label: eventType.name,
              }))}
            />
          </FieldItem>

          <FieldItem id="event-plan" label="Plan contratado" error={state.errors.planKey}>
            <Select
              size="large"
              placeholder="Elige el plan"
              value={planKey || undefined}
              onChange={choosePlan}
              style={{ width: '100%' }}
              options={options.plans.map((plan) => ({ value: plan.key, label: plan.name }))}
            />
          </FieldItem>
        </div>

        <FieldItem
          id="event-celebrant"
          label="Quién celebra"
          help="Como se anuncia en la portada: «Fátima», «Ana y Luis»."
          error={state.errors.celebrantName}
        >
          <Input
            size="large"
            name="celebrantName"
            placeholder="Fátima"
            value={celebrantName}
            onChange={(event) => changeCelebrant(event.target.value)}
            autoComplete="off"
          />
        </FieldItem>

        <FieldItem
          id="event-title"
          label="Título en el panel"
          help="Solo se ve aquí dentro, para encontrar el evento entre los demás."
          error={state.errors.title}
        >
          <Input
            size="large"
            name="title"
            placeholder="XV años de Fátima"
            value={title}
            onChange={(event) => {
              setTitleTouched(true);
              setTitle(event.target.value);
            }}
            autoComplete="off"
          />
        </FieldItem>

        {/*
          Fecha y hora son controles nativos y viajan como texto —`YYYY-MM-DD` y `HH:MM`—, igual
          que en el editor de contenido. La conversión al instante la hace Postgres con la zona de
          abajo: hacerla en el navegador guardaría la fiesta a otra hora para quien capture desde
          otra zona. Ver `new-event.ts`.
        */}
        <div className="dash-field-row">
          <FieldItem id="event-date" label="Fecha" error={state.errors.date}>
            <input
              className="dash-native-input dash-native-input--large"
              type="date"
              name="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </FieldItem>

          <FieldItem id="event-time" label="Hora" error={state.errors.time}>
            <input
              className="dash-native-input dash-native-input--large"
              type="time"
              name="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              required
            />
          </FieldItem>

          <FieldItem
            id="event-timezone"
            label="Zona horaria"
            help="La hora local del evento."
            error={state.errors.timeZone}
          >
            <Select
              size="large"
              value={timeZone}
              onChange={setTimeZone}
              style={{ width: '100%' }}
              options={EVENT_TIME_ZONES.map((zone) => ({
                value: zone.value,
                label: zone.label,
              }))}
            />
          </FieldItem>
        </div>

        <FieldItem
          id="event-template"
          label="Plantilla"
          help={
            eventTypeKey === '' && planKey === ''
              ? 'Elige antes el tipo y el plan para ver las que encajan.'
              : templates.length === 0
                ? 'Ninguna plantilla encaja con ese tipo y ese plan.'
                : 'La estructura de la invitación: qué secciones trae y en qué orden.'
          }
          error={state.errors.templateId}
        >
          <Select
            size="large"
            placeholder="Elige la plantilla"
            value={templateId || undefined}
            onChange={chooseTemplate}
            style={{ width: '100%' }}
            options={templates.map((template) => ({
              value: template.id,
              label: template.name,
            }))}
          />
        </FieldItem>

        <FieldItem
          id="event-theme"
          label="Tema"
          help="Color y tipografía. La plantilla propone el suyo; se puede cambiar."
          error={state.errors.themeId}
        >
          <Select
            size="large"
            placeholder="Elige el tema"
            value={themeId || undefined}
            onChange={setThemeId}
            style={{ width: '100%' }}
            options={options.themes.map((theme) => ({ value: theme.id, label: theme.name }))}
          />
        </FieldItem>

        <FieldItem
          id="event-slug"
          label={
            <>
              Dirección de la invitación <span className="dash-form__hint">(opcional)</span>
            </>
          }
          help={`Si la dejas vacía se genera del nombre. La invitación vivirá en /${
            slug.trim() || suggestedSlug || 'direccion'
          }/<código>.`}
          error={state.errors.slug}
        >
          <Input
            size="large"
            name="slug"
            placeholder={suggestedSlug || 'fatima'}
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            autoComplete="off"
          />
        </FieldItem>

        {/*
          Quién llena el contenido, lo último antes de crear.

          Va aquí y no arriba con el tipo y el plan porque no es un dato de la celebración: es una
          decisión sobre **el trabajo**, y se toma cuando ya se ve el evento entero montado. Con el
          interruptor encendido, al crear le sale al cliente un correo con el enlace a su
          formulario; apagado, el correo solo le avisa de que ya empezamos.
        */}
        <div className="dash-form__field dash-switch-field">
          <Switch
            id="event-client-fills"
            checked={clientFills}
            onChange={setClientFills}
            aria-describedby="event-client-fills-note"
          />
          <div className="min-w-0">
            <label className="dash-form__label" htmlFor="event-client-fills">
              El cliente llenará su información
            </label>
            <p className="dash-form__help" id="event-client-fills-note">
              {clientFills
                ? 'Le mandamos un correo con el enlace a su formulario. Cuando termine, el evento llega a revisión.'
                : 'La información la capturamos nosotros. Al cliente solo le avisamos de que su evento ya existe.'}
            </p>
          </div>
        </div>

        {/* Los desplegables de antd no escriben ningún campo del formulario: su valor viaja en
            estos, que es lo que hace que la acción reciba `FormData` y no un objeto del cliente. */}
        <input type="hidden" name="eventTypeKey" value={eventTypeKey} />
        {/* El interruptor de antd tampoco: manda «true» o nada, que es lo que el esquema del
            dominio espera leer. */}
        <input type="hidden" name="clientFillsContent" value={clientFills ? 'true' : 'false'} />
        <input type="hidden" name="planKey" value={planKey} />
        <input type="hidden" name="templateId" value={templateId} />
        <input type="hidden" name="themeId" value={themeId} />
        <input type="hidden" name="timeZone" value={timeZone} />

        <Button
          htmlType="submit"
          type="primary"
          size="large"
          block
          loading={isPending}
          className="dash-form__submit"
        >
          Crear evento
        </Button>
      </form>
    </Modal>
  );
}

/**
 * El resultado del alta, en la pantalla que abrió el diálogo.
 *
 * Está aquí y no en cada pantalla porque es la otra mitad del mismo flujo: el diálogo se cierra al
 * crear y este aviso es lo único que queda del evento recién dado de alta. Enseña su enlace ya
 * compuesto —con el código, no solo la dirección— porque el momento en el que hace falta es
 * exactamente ese: quien acaba de crear el evento suele tener al cliente al teléfono.
 */
export function NewEventNotice({
  state,
  onDismiss,
}: {
  readonly state: NewEventState;
  readonly onDismiss: () => void;
}) {
  if (state.status !== 'success' || state.created === null) return null;

  return (
    // Se anuncia además de verse: quien envió el formulario puede tener el foco lejos de aquí.
    <div role="status" aria-live="polite">
      <Alert
        className="dash-page-alert"
        type="success"
        showIcon
        closable
        title={state.message}
        description={
          <InvitationCell
            slug={state.created.slug}
            accessCode={state.created.accessCode}
            eventTitle={state.created.title}
          />
        }
        onClose={onDismiss}
      />
    </div>
  );
}

/**
 * Un campo con su etiqueta, su ayuda y el motivo del servidor cuando lo hay.
 *
 * El error sustituye a la ayuda en lugar de apilarse debajo: son dos frases sobre el mismo
 * control y la que importa cuando hay error es la del error.
 */
function FieldItem({
  id,
  label,
  help,
  error,
  children,
}: {
  /** El identificador del control, para atar el rótulo y la ayuda. Ver abajo. */
  readonly id: string;
  readonly label: ReactNode;
  readonly help?: ReactNode;
  readonly error?: string;
  readonly children: ReactElement<Record<string, unknown>>;
}) {
  const note = error ?? help;
  const noteId = note ? `${id}-note` : undefined;

  return (
    <div className="dash-form__field">
      <label className="dash-form__label" htmlFor={id}>
        {label}
      </label>

      {/*
        El `id` y el `aria-describedby` se le ponen al control desde aquí en vez de repetirlos en
        los once campos. Es lo mismo que hacía `Form.Item` de antd por dentro —solo que aquel no
        llegaba a hacerlo: ata el rótulo al control a partir del `name` del campo, y estos ítems
        no tenían `name` porque no se usaba el estado de antd. O sea que los rótulos de este
        formulario no estaban asociados a nada; ahora sí.
      */}
      {cloneElement(children, { id, 'aria-describedby': noteId })}

      {note && (
        <p className={error ? 'dash-form__error' : 'dash-form__help'} id={noteId}>
          {note}
        </p>
      )}
    </div>
  );
}

function templateOf(options: NewEventOptions, templateId: string): TemplateSummary | undefined {
  return options.templates.find((template) => template.id === templateId);
}

/** Una plantilla encaja si el catálogo la declara para ese tipo y para ese plan. */
function matches(
  template: TemplateSummary | undefined,
  eventTypeKey: string,
  planKey: string,
): boolean {
  if (!template) return false;
  if (eventTypeKey !== '' && !template.eventTypes.some((type) => type.key === eventTypeKey)) {
    return false;
  }

  return planKey === '' || template.planKeys.includes(planKey);
}

/**
 * «Boda de Ana y Luis» a partir del tipo y del nombre.
 *
 * Sin tipo elegido devuelve el nombre a secas en lugar de una frase a medias: el título se
 * completa solo cuando se elige el tipo, y mientras tanto ya sirve para encontrar el evento.
 */
function suggestTitle(
  options: NewEventOptions,
  celebrantName: string,
  eventTypeKey: string,
): string {
  const name = celebrantName.trim();
  if (name === '') return '';

  const eventType = options.eventTypes.find((candidate) => candidate.key === eventTypeKey);

  return eventType ? `${eventType.name} de ${name}` : name;
}
