'use client';

import { useActionState, useEffect, useState } from 'react';
import { Alert, Button, Input, Modal, Select, Skeleton } from 'antd';
import {
  loadEventDetailsAction,
  updateEventDetailsAction,
} from '@/app/admin/(authenticated)/eventos/actions';
import {
  INITIAL_EDIT_EVENT_STATE,
  type EditEventState,
} from '@/app/admin/(authenticated)/eventos/form-state';
import type { NewEventOptions } from '@/application/events/create-event';
import type { EditableEventDetails } from '@/domain/events/event-details';
import { EVENT_TIME_ZONES } from '@/domain/events/event-time-zone';
import { matchesTemplate, templateOf } from './event-template-options';
import { FieldItem } from './NewEventDialog';

/**
 * Editar un evento: los datos del alta, no el contenido de la invitación.
 *
 * Son dos acciones distintas y se ofrecen por separado: la fila de una tabla lleva al editor de la
 * invitación —lo que leen los invitados— y el lápiz abre esto —lo que se vendió y cómo se arma—.
 * Qué se puede cambiar aquí y qué no está en `event-details.ts`.
 *
 * Los datos actuales se piden al abrir (`loadEventDetailsAction`): las filas de las tablas no
 * traen plantilla, tema ni hora local.
 */
export function EditEventDialog({
  eventId,
  open,
  onClose,
  onResult,
  options,
}: {
  readonly eventId: string;
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onResult: (state: EditEventState) => void;
  readonly options: NewEventOptions;
}) {
  const [details, setDetails] = useState<EditableEventDetails | null | 'loading'>('loading');

  /* Se carga una vez por evento: quien abre el diálogo lo monta con `key={eventId}`, así que
     cambiar de evento es montar uno nuevo. */
  useEffect(() => {
    let cancelled = false;

    void loadEventDetailsAction(eventId).then((loaded) => {
      if (!cancelled) setDetails(loaded);
    });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return (
    <Modal
      title="Editar evento"
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      destroyOnHidden
    >
      {details === 'loading' ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : details === null ? (
        <Alert type="error" showIcon message="No se pudo cargar el evento." />
      ) : (
        <EditEventForm
          details={details}
          options={options}
          onSaved={(state) => {
            onResult(state);
            onClose();
          }}
        />
      )}
    </Modal>
  );
}

function EditEventForm({
  details,
  options,
  onSaved,
}: {
  readonly details: EditableEventDetails;
  readonly options: NewEventOptions;
  readonly onSaved: (state: EditEventState) => void;
}) {
  const [title, setTitle] = useState(details.title);
  const [date, setDate] = useState(details.date);
  const [time, setTime] = useState(details.time);
  const [timeZone, setTimeZone] = useState(details.timeZone);
  const [planKey, setPlanKey] = useState(details.planKey);
  const [templateId, setTemplateId] = useState(details.templateId);
  const [themeId, setThemeId] = useState(details.themeId);

  const [state, formAction, isPending] = useActionState(
    async (previous: EditEventState, formData: FormData) => {
      const result = await updateEventDetailsAction(previous, formData);

      /* Si falla, el diálogo se queda abierto con lo elegido para poder corregir. */
      if (result.status === 'success') onSaved(result);

      return result;
    },
    INITIAL_EDIT_EVENT_STATE,
  );

  /* El tipo de celebración no se edita, así que las plantillas se acotan siempre por él. */
  const templates = options.templates.filter((template) =>
    matchesTemplate(template, details.eventTypeKey, planKey),
  );

  const choosePlan = (value: string) => {
    setPlanKey(value);

    /* La plantilla puede dejar de encajar con el plan nuevo. Se limpia en vez de dejarla puesta
       e inválida, igual que en el alta. */
    if (!matchesTemplate(templateOf(options, templateId), details.eventTypeKey, value)) {
      setTemplateId('');
    }
  };

  /* Elegir otra plantilla propone su tema, como en el alta. Se puede cambiar después. */
  const chooseTemplate = (value: string) => {
    setTemplateId(value);

    const suggested = options.themes.find(
      (theme) => theme.key === templateOf(options, value)?.defaultThemeKey,
    );

    if (suggested) setThemeId(suggested.id);
  };

  const planChanged = planKey !== details.planKey;
  const templateChanged = templateId !== details.templateId && templateId !== '';
  const published = details.status === 'published';
  const anyChanged =
    planChanged ||
    templateId !== details.templateId ||
    themeId !== details.themeId ||
    title.trim() !== details.title ||
    date !== details.date ||
    time !== details.time ||
    timeZone !== details.timeZone;

  return (
    <form action={formAction} className="dash-form">
      <input type="hidden" name="eventId" value={details.id} />

      {/* Siempre en el árbol: `aria-live` solo anuncia cambios en una región que ya existía. */}
      <div role="alert" aria-live="assertive">
        {state.status === 'error' && state.message && (
          <Alert type="error" showIcon message={state.message} className="dash-form__alert" />
        )}
      </div>

      <FieldItem
        id="edit-event-title"
        label="Título en el panel"
        help="Solo se ve aquí dentro, para encontrar el evento entre los demás."
        error={state.errors.title}
      >
        <Input
          size="large"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          autoComplete="off"
        />
      </FieldItem>

      <div className="dash-field-row">
        <FieldItem id="edit-event-date" label="Fecha" error={state.errors.date}>
          <input
            className="dash-native-input dash-native-input--large"
            type="date"
            name="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </FieldItem>

        <FieldItem id="edit-event-time" label="Hora" error={state.errors.time}>
          <input
            className="dash-native-input dash-native-input--large"
            type="time"
            name="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            required
          />
        </FieldItem>

        <FieldItem id="edit-event-timezone" label="Zona horaria" error={state.errors.timeZone}>
          <Select
            size="large"
            value={timeZone}
            onChange={setTimeZone}
            style={{ width: '100%' }}
            options={EVENT_TIME_ZONES.map((zone) => ({ value: zone.value, label: zone.label }))}
          />
        </FieldItem>
      </div>

      <FieldItem id="edit-event-plan" label="Plan contratado" error={state.errors.planKey}>
        <Select
          size="large"
          value={planKey || undefined}
          onChange={choosePlan}
          style={{ width: '100%' }}
          options={options.plans.map((plan) => ({ value: plan.key, label: plan.name }))}
        />
      </FieldItem>

      <FieldItem
        id="edit-event-template"
        label="Plantilla"
        help={
          templates.length === 0
            ? 'Ninguna plantilla encaja con este tipo de evento y ese plan.'
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
          options={templates.map((template) => ({ value: template.id, label: template.name }))}
        />
      </FieldItem>

      <FieldItem
        id="edit-event-theme"
        label="Tema"
        help="Color y tipografía. Cambiarlo no toca el contenido."
        error={state.errors.themeId}
      >
        <Select
          size="large"
          value={themeId || undefined}
          onChange={setThemeId}
          style={{ width: '100%' }}
          options={options.themes.map((theme) => ({ value: theme.id, label: theme.name }))}
        />
      </FieldItem>

      {/*
        Lo que cambia por debajo se dice antes de guardar, y solo cuando aplica. En un evento
        publicado, cualquier cambio lo regresa a borrador: eso va primero, porque es lo que ven los
        invitados.
      */}
      {published && anyChanged && (
        <Alert
          className="dash-form__alert"
          type="warning"
          showIcon
          message="Al guardar, la invitación volverá a borrador."
          description="Dejará de verse en su enlace hasta que la publiques de nuevo. La vigencia del plan se conserva."
        />
      )}

      {(planChanged || templateChanged) && (
        <Alert
          className="dash-form__alert"
          type="info"
          showIcon
          message="Esto cambia qué secciones lleva la invitación."
          description={
            <ul className="dash-publish__missing">
              {templateChanged && (
                <li>
                  Las secciones toman el diseño y el orden de la plantilla nueva. Lo que se
                  escribió se conserva; las secciones que la nueva no tiene quedan apagadas.
                </li>
              )}
              {planChanged && (
                <li>
                  Se encienden o apagan las secciones según lo que incluye el plan.
                  {published && ' La vigencia se recalcula desde el día en que se publicó.'}
                </li>
              )}
            </ul>
          }
        />
      )}

      {/* Los desplegables de antd no escriben ningún campo del formulario; sus valores viajan en
          estos. Ver `NewEventDialog`. */}
      <input type="hidden" name="timeZone" value={timeZone} />
      <input type="hidden" name="planKey" value={planKey} />
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="themeId" value={themeId} />

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
  );
}
