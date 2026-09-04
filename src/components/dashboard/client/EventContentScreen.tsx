'use client';

import { cloneElement, useActionState, useState, type ReactElement, type ReactNode } from 'react';
import { Alert, Button, Input, Select } from 'antd';
import type {
  EventCollections,
  GalleryRow,
  ScheduleRow,
  VenueRow,
} from '@/domain/events/event-collections';
import type { EventContentDraft } from '@/domain/events/event-content-draft';
import { PageHeader } from '../primitives/PageHeader';
import { SectionCard } from '../primitives/SectionCard';
import { CollectionEditor } from './CollectionEditor';
import './content-editor.css';

/**
 * El editor de contenido: formulario a la izquierda, invitación real a la derecha.
 *
 * ## Dos tercios y un tercio
 *
 * La proporción no es estética. Un formulario de dieciséis campos necesita ancho para que las
 * etiquetas y los controles quepan en una línea; una invitación necesita el ancho de un teléfono y
 * ni un píxel más, porque es donde se va a abrir. Darle la mitad a cada uno estrecharía el
 * formulario sin que la invitación ganara nada.
 *
 * La vista previa es un `<iframe>` a la ruta `/vista`. No es un atajo: la invitación se pinta con
 * Tailwind sin preflight y el panel con antd, y meter las dos en el mismo documento es la pelea de
 * especificidad que `docs/BACKEND.md` describe en «Estilos». Además, dentro del marco el
 * `<iframe>` **es** el viewport, así que las medias queries de la invitación responden como en un
 * teléfono en vez de heredar el ancho del escritorio.
 *
 * ## Se actualiza al guardar, no en cada tecla
 *
 * Repintar la invitación con cada pulsación exigiría ensamblar el contenido en el navegador, y eso
 * significa una segunda implementación del ensamblado —la del servidor y la del cliente— que el
 * día que divergieran haría que la vista previa mintiera. Que mienta es el único fallo que una
 * vista previa no se puede permitir, así que se recarga después de cada guardado y enseña siempre
 * lo que de verdad hay guardado.
 *
 * ## La fecha y la hora son controles nativos
 *
 * Y no los selectores de antd, por dos motivos concretos. El primero: este formulario se envía
 * como `FormData` a una Server Action, y un `<input type="date">` manda exactamente `YYYY-MM-DD`
 * —el formato que espera el esquema del dominio— sin nada en medio. El segundo: los selectores de
 * antd dependen de `dayjs`, que hoy está en el proyecto solo como dependencia transitiva de antd;
 * importarlo directamente sería construir sobre algo que nadie declaró.
 *
 * ## En móvil no se bloquea
 *
 * La retícula pasa a una columna y el marco se va abajo. Bloquear el móvil sería duro en este
 * mercado, donde mucha gente solo tiene teléfono; lo que se pierde es la comodidad de ver las dos
 * cosas a la vez, y eso lo dice el aviso en lugar de una pantalla que se niega a cargar.
 */
export function EventContentScreen({
  eventId,
  draft,
  collections: initialCollections,
  timeZone,
  action,
  initialState,
  title = 'Contenido',
  description = 'Lo que dice tu invitación. El diseño lo ponemos nosotros.',
  previewUrl,
  banner,
}: {
  readonly eventId: string;
  readonly draft: EventContentDraft;
  readonly collections: EventCollections;
  /** La zona del evento, que se muestra y no se edita. Ver el aviso junto a la hora. */
  readonly timeZone: string;
  readonly action: (state: ContentState, formData: FormData) => Promise<ContentState>;
  readonly initialState: ContentState;
  /**
   * El encabezado, la vista previa y lo que va encima del formulario.
   *
   * Los cuatro tienen valor por defecto porque esta pantalla nació para el panel del cliente y
   * sigue siendo su casa. Existen porque **la plataforma edita el mismo contenido**: el admin
   * llena eventos de clientes que mandan sus datos por WhatsApp, y ahí cambian el texto de la
   * cabecera —no es «tu invitación»—, la ruta del marco —la del panel exige membresía en el
   * cliente y un admin no la tiene— y hace falta sitio para las acciones de publicar.
   *
   * Es lo contrario de duplicar la pantalla: un segundo editor de trece campos y tres
   * colecciones acabaría divergiendo, y el día que divergiera el admin guardaría cosas que el
   * cliente no puede escribir.
   */
  readonly title?: string;
  readonly description?: string;
  readonly previewUrl?: string;
  readonly banner?: ReactNode;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  /*
   * Las tres listas SÍ viven en estado de React, al contrario que los campos sueltos, que van sin
   * controlar. La diferencia no es incoherencia: un campo de texto lo lleva bien el navegador,
   * pero añadir, quitar y reordenar filas es estado que hay que manejar, y el `FormData` no sabe
   * expresar una lista ordenada de objetos. Se serializan en un campo oculto al enviar.
   */
  const [collections, setCollections] = useState<EditableCollections>(initialCollections);

  /*
   * La `key` del `<iframe>` cambia con el resultado del guardado, y eso hace que React lo
   * desmonte y lo vuelva a montar — es decir, que el marco recargue su documento. Sin esto la
   * invitación de la derecha se quedaría en la versión anterior y se leería «guardado» al lado
   * de algo que no cambió, que es el peor mensaje posible porque invita a guardar otra vez.
   *
   * Va por `key` y no por un `ref` con `contentWindow.location.reload()`: el marco es del mismo
   * origen y funcionaría, pero sería estado imperativo sincronizado a mano con el del formulario.
   */
  const previewKey = `${state.status}-${state.message}`;

  return (
    <>
      <PageHeader title={title} description={description} />

      {banner}

      {state.status !== 'idle' && state.message && (
        <Alert
          className="content-editor__alert"
          type={state.status === 'success' ? 'success' : 'error'}
          title={state.message}
          showIcon
        />
      )}

      <div className="content-editor">
        <div className="content-editor__form">
          {/*
            Un `<form>` nativo y no el `<Form>` de antd. Aquel registra un `onSubmit` que llama a
            `preventDefault()` y a `stopPropagation()` para validar por su cuenta, y con eso React
            nunca ejecuta la acción de servidor del atributo `action`: se pulsaba «Guardar» y no
            pasaba nada. El mismo fallo estaba en el alta de eventos; está explicado con detalle en
            `NewEventDialog`.

            Aquí el `<Form>` tampoco aportaba nada más que la maqueta: los campos son nativos o
            `Input` de antd con `name` y `defaultValue`, y lo que se envía lo lee la acción del
            `FormData`. Ninguno usa el estado de campos de antd.
          */}
          <form action={formAction}>
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="collections" value={JSON.stringify(collections)} />

            <SectionCard title="Quién celebra">
              <Field
                name="celebrantName"
                label="Nombre"
                help="Como quieres que aparezca en la portada."
                required
                initial={draft.celebrantName}
                errors={state.errors}
              />
              <Field
                name="celebrantLastName"
                label="Apellidos"
                initial={draft.celebrantLastName}
                errors={state.errors}
              />
              <Field
                name="celebrantFullName"
                label="Nombre completo"
                help="Solo si quieres que se anuncie de otra forma. Si lo dejas vacío, se usa el nombre y los apellidos."
                initial={draft.celebrantFullName}
                errors={state.errors}
              />
              <Field
                name="eventTypeLabel"
                label="Cómo se llama la celebración"
                help="«Nuestra boda», «Mis XV años»."
                initial={draft.eventTypeLabel}
                errors={state.errors}
              />
            </SectionCard>

            <SectionCard title="Cuándo y dónde">
              {/*
                La fecha y la hora van en dos controles y se envían como texto, no como un
                instante. La conversión a la hora real la hace Postgres con la zona del evento: ver
                `event-content-draft.ts` para por qué hacerla en el navegador guardaría la boda a
                otra hora para quien capture desde otra zona.
              */}
              <div className="content-editor__row">
                <NativeField
                  id="content-date"
                  label="Fecha"
                  error={state.errors.date}
                >
                  <input
                    className="dash-native-input"
                    type="date"
                    name="date"
                    defaultValue={draft.date}
                    required
                  />
                </NativeField>

                <NativeField
                  id="content-time"
                  label="Hora"
                  help={`Hora local de ${timeZone}`}
                  error={state.errors.time}
                >
                  <input
                    className="dash-native-input"
                    type="time"
                    name="time"
                    defaultValue={draft.time}
                    required
                  />
                </NativeField>
              </div>

              <Field name="city" label="Ciudad" initial={draft.city} errors={state.errors} />
            </SectionCard>

            <SectionCard title="Lo que quieres contar">
              <Field
                name="tagline"
                label="Frase de la portada"
                help="Una línea. Es lo primero que se lee."
                initial={draft.tagline}
                errors={state.errors}
              />
              <Field
                name="story"
                label="Su historia"
                help="Los saltos de línea se respetan: cada bloque será un párrafo."
                initial={draft.story}
                errors={state.errors}
                multiline
              />
            </SectionCard>

            <SectionCard title="Dónde es">
              <CollectionEditor<VenueRow>
                title="Sedes"
                description="La ceremonia, la recepción, lo que haga falta. Salen en el orden en que las pongas."
                rows={collections.venues}
                max={12}
                addLabel="Añadir una sede"
                emptyLabel="Todavía no hay ninguna sede."
                rowTitle={(row) => row.label || row.name}
                makeEmpty={() => ({
                  id: null,
                  kind: 'reception',
                  label: '',
                  name: '',
                  address: null,
                  detail: null,
                  mapUrl: null,
                  time: null,
                  imageUrl: null,
                  imageAlt: null,
                })}
                onChange={(venues) => setCollections((current) => ({ ...current, venues }))}
                renderRow={(row, index, update) => (
                  <>
                    <div className="content-editor__row">
                      <RowField
                        label="Título"
                        error={state.errors[`venues.${index}.label`]}
                        value={row.label}
                        onChange={(label) => update({ label: label ?? '' })}
                        placeholder="Ceremonia religiosa"
                      />
                      <RowField
                        label="Clase"
                        error={state.errors[`venues.${index}.kind`]}
                        node={
                          <Select
                            value={row.kind}
                            onChange={(kind) => update({ kind })}
                            style={{ width: '100%' }}
                            options={[
                              { value: 'church', label: 'Ceremonia' },
                              { value: 'reception', label: 'Recepción' },
                              { value: 'other', label: 'Otro' },
                            ]}
                          />
                        }
                      />
                    </div>

                    <RowField
                      label="Nombre del lugar"
                      error={state.errors[`venues.${index}.name`]}
                      value={row.name}
                      onChange={(name) => update({ name: name ?? '' })}
                      placeholder="Parroquia de San Juan"
                    />
                    <RowField
                      label="Dirección"
                      error={state.errors[`venues.${index}.address`]}
                      value={row.address ?? ''}
                      onChange={(address) => update({ address })}
                    />

                    <div className="content-editor__row">
                      <RowField
                        label="Hora"
                        help="Se aplica a la fecha del evento."
                        error={state.errors[`venues.${index}.time`]}
                        node={
                          <input
                            className="dash-native-input"
                            type="time"
                            value={row.time ?? ''}
                            onChange={(event) => update({ time: event.target.value || null })}
                          />
                        }
                      />
                      <RowField
                        label="Enlace al mapa"
                        error={state.errors[`venues.${index}.mapUrl`]}
                        value={row.mapUrl ?? ''}
                        onChange={(mapUrl) => update({ mapUrl })}
                        placeholder="https://maps.google.com/…"
                      />
                    </div>

                    <RowField
                      label="Nota"
                      help="«Estacionamiento por la calle 60»."
                      error={state.errors[`venues.${index}.detail`]}
                      value={row.detail ?? ''}
                      onChange={(detail) => update({ detail })}
                    />
                  </>
                )}
              />
            </SectionCard>

            <SectionCard title="Cronograma">
              <CollectionEditor<ScheduleRow>
                title="Qué pasa y cuándo"
                description="La hora se escribe tal cual: «7:00 pm», «al caer la tarde»."
                rows={collections.schedule}
                max={30}
                addLabel="Añadir un momento"
                emptyLabel="Todavía no hay cronograma."
                rowTitle={(row) => row.title}
                makeEmpty={() => ({
                  id: null,
                  timeLabel: '',
                  title: '',
                  description: null,
                  icon: null,
                })}
                onChange={(schedule) => setCollections((current) => ({ ...current, schedule }))}
                renderRow={(row, index, update) => (
                  <>
                    <div className="content-editor__row">
                      <RowField
                        label="Hora"
                        error={state.errors[`schedule.${index}.timeLabel`]}
                        value={row.timeLabel}
                        onChange={(timeLabel) => update({ timeLabel: timeLabel ?? '' })}
                        placeholder="7:00 pm"
                      />
                      <RowField
                        label="Qué pasa"
                        error={state.errors[`schedule.${index}.title`]}
                        value={row.title}
                        onChange={(title) => update({ title: title ?? '' })}
                        placeholder="Cóctel de bienvenida"
                      />
                    </div>

                    <RowField
                      label="Detalle"
                      error={state.errors[`schedule.${index}.description`]}
                      value={row.description ?? ''}
                      onChange={(description) => update({ description })}
                    />
                  </>
                )}
              />
            </SectionCard>

            <SectionCard title="Fotos">
              {/*
                Son URLs y no una subida de archivos porque todavía no hay almacenamiento propio.
                Es la limitación más visible de esta pantalla y está anotada como pendiente; el
                campo no cambia de forma el día que exista la subida.
              */}
              <Field
                name="heroImageUrl"
                label="Portada"
                help="Enlace directo a la imagen (https://…)."
                initial={draft.heroImageUrl}
                errors={state.errors}
              />
              <Field
                name="storyImageUrl"
                label="Historia"
                initial={draft.storyImageUrl}
                errors={state.errors}
              />
              <Field
                name="closingImageUrl"
                label="Cierre"
                initial={draft.closingImageUrl}
                errors={state.errors}
              />

              <CollectionEditor<GalleryRow>
                title="Galería"
                description="Las fotos que se ven en la sección de galería, en este orden."
                rows={collections.gallery}
                max={60}
                addLabel="Añadir una foto"
                emptyLabel="Todavía no hay fotos en la galería."
                rowTitle={(row, index) => row.caption || row.altText || `Foto ${index + 1}`}
                makeEmpty={() => ({ id: null, url: '', altText: null, caption: null })}
                onChange={(gallery) => setCollections((current) => ({ ...current, gallery }))}
                renderRow={(row, index, update) => (
                  <>
                    <RowField
                      label="Enlace de la imagen"
                      error={state.errors[`gallery.${index}.url`]}
                      value={row.url}
                      onChange={(url) => update({ url: url ?? '' })}
                      placeholder="https://…"
                    />
                    <div className="content-editor__row">
                      <RowField
                        label="Descripción"
                        help="Para quien no puede ver la foto."
                        error={state.errors[`gallery.${index}.altText`]}
                        value={row.altText ?? ''}
                        onChange={(altText) => update({ altText })}
                      />
                      <RowField
                        label="Pie de foto"
                        error={state.errors[`gallery.${index}.caption`]}
                        value={row.caption ?? ''}
                        onChange={(caption) => update({ caption })}
                      />
                    </div>
                  </>
                )}
              />
            </SectionCard>

            <SectionCard title="Cómo te contactan">
              <Field
                name="contactWhatsapp"
                label="WhatsApp"
                help="A donde llegan las confirmaciones."
                initial={draft.contactWhatsapp}
                errors={state.errors}
              />
              <Field
                name="contactPhone"
                label="Teléfono"
                initial={draft.contactPhone}
                errors={state.errors}
              />
              <Field
                name="contactInstagram"
                label="Instagram"
                initial={draft.contactInstagram}
                errors={state.errors}
              />

              <NativeField
                id="content-rsvp-deadline"
                label="Fecha límite para confirmar"
                help="Opcional."
                error={state.errors.rsvpDeadline}
              >
                <input
                  className="dash-native-input"
                  type="date"
                  name="rsvpDeadline"
                  defaultValue={draft.rsvpDeadline ?? ''}
                />
              </NativeField>
            </SectionCard>

            {/* Pegado abajo: con cinco tarjetas, un botón al final del scroll obliga a buscarlo. */}
            <div className="content-editor__actions">
              <Button type="primary" size="large" htmlType="submit" loading={isPending}>
                Guardar contenido
              </Button>
            </div>
          </form>
        </div>

        <aside className="content-editor__preview">
          <div className="content-editor__preview-head">
            <span className="content-editor__preview-label">Vista previa</span>
            <span className="content-editor__preview-note">Se actualiza al guardar</span>
          </div>

          <div className="content-editor__phone">
            <iframe
              key={previewKey}
              className="content-editor__frame"
              src={previewUrl ?? `/panel/eventos/${eventId}/vista`}
              title="Vista previa de la invitación"
            />
          </div>

          <p className="content-editor__hint">
            Para editar con comodidad conviene una computadora: aquí ves la invitación al lado del
            formulario.
          </p>
        </aside>
      </div>
    </>
  );
}

/** El estado que devuelve la acción de guardado. Se declara aquí para no importar del servidor. */
interface ContentState {
  readonly status: 'idle' | 'success' | 'error';
  readonly message: string;
  readonly errors: Readonly<Record<string, string>>;
}

/**
 * Un campo de texto con su etiqueta, su ayuda y su error.
 *
 * Existe porque son trece campos con la misma forma, y trece bloques de `Form.Item` copiados
 * serían trece sitios donde el error se pinta distinto. El valor va como `defaultValue` y no
 * controlado: el formulario se envía como `FormData` nativo a una Server Action, así que el
 * navegador ya lleva la cuenta de lo que se escribió y un `useState` por campo solo añadiría
 * trece estados que pueden desincronizarse.
 */
/**
 * Un campo cuyo control es nativo —una fecha, una hora—, con su rótulo y su nota.
 *
 * Es el hermano de {@link Field} para los dos casos en los que el control no es un `Input` de
 * antd. Se separan en vez de meter un `children` en aquel porque `Field` sabe además qué nombre
 * lleva el campo y de dónde sale su valor inicial, y eso es justo lo que estos no tienen.
 */
function NativeField({
  id,
  label,
  help,
  error,
  children,
}: {
  readonly id: string;
  readonly label: string;
  readonly help?: string;
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

      {cloneElement(children, { id, 'aria-describedby': noteId })}

      {note && (
        <p className={error ? 'dash-form__error' : 'dash-form__help'} id={noteId}>
          {note}
        </p>
      )}
    </div>
  );
}

function Field({
  name,
  label,
  help,
  initial,
  errors,
  required = false,
  multiline = false,
}: {
  readonly name: string;
  readonly label: string;
  readonly help?: string;
  readonly initial: string | null;
  readonly errors: Readonly<Record<string, string>>;
  readonly required?: boolean;
  readonly multiline?: boolean;
}) {
  const error = errors[name];
  const note = error ?? help;
  const id = `content-${name}`;

  return (
    <div className="dash-form__field">
      <label className="dash-form__label" htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" className="dash-form__hint">
            {' '}
            ·  obligatorio
          </span>
        )}
      </label>

      {multiline ? (
        <Input.TextArea
          id={id}
          name={name}
          defaultValue={initial ?? ''}
          rows={6}
          required={required}
          aria-describedby={note ? `${id}-note` : undefined}
        />
      ) : (
        <Input
          id={id}
          name={name}
          defaultValue={initial ?? ''}
          required={required}
          aria-describedby={note ? `${id}-note` : undefined}
        />
      )}

      {note && (
        <p className={error ? 'dash-form__error' : 'dash-form__help'} id={`${id}-note`}>
          {note}
        </p>
      )}
    </div>
  );
}

/**
 * Las tres listas mientras se editan.
 *
 * Es `EventCollections` con los arrays en solo lectura. El del dominio los tiene mutables porque
 * los infiere zod, y aquí conviene lo contrario: el editor devuelve listas nuevas en cada cambio y
 * nadie debe mutar la que tiene en la mano. Al enviar se serializan, así que la diferencia no
 * sobrevive al `JSON.stringify` — solo existe para que el compilador vigile mientras tanto.
 */
interface EditableCollections {
  readonly venues: readonly VenueRow[];
  readonly schedule: readonly ScheduleRow[];
  readonly gallery: readonly GalleryRow[];
}

/**
 * Un campo dentro de una fila de colección.
 *
 * Es controlado, al contrario que `Field`, y esa es toda la diferencia entre los dos. Un campo
 * suelto del formulario lo lleva el navegador y se lee del `FormData`; uno de una fila tiene que
 * vivir en el estado de React, porque su valor viaja serializado en el campo oculto y porque
 * reordenar filas mueve valores entre posiciones.
 *
 * `node` permite meter un control que no es un `Input` —un selector, una hora— sin duplicar la
 * envoltura de etiqueta, ayuda y error.
 */
function RowField({
  label,
  help,
  error,
  value,
  onChange,
  placeholder,
  node,
}: {
  readonly label: string;
  readonly help?: string;
  readonly error?: string;
  readonly value?: string;
  /**
   * Recibe `null` cuando el campo queda en blanco, que es lo que el esquema del dominio espera
   * para «sin valor». Los campos obligatorios —el título de una sede, la hora del cronograma— lo
   * convierten a cadena vacía en su propio `onChange`: su tipo no admite ausencia, y dejar que
   * llegara `null` haría que un campo borrado se guardara como si nunca hubiera existido en vez
   * de fallar la validación con su motivo.
   */
  readonly onChange?: (value: string | null) => void;
  readonly placeholder?: string;
  readonly node?: ReactNode;
}) {
  const note = error ?? help;

  return (
    /*
     * El rótulo envuelve al control en vez de apuntarle con un `htmlFor`, y aquí es la opción
     * correcta: estos campos se generan por fila —cinco sedes, doce momentos del cronograma— así
     * que un identificador tendría que llevar el índice, y los índices cambian al reordenar. Un
     * `<label>` que contiene su control no necesita ninguno.
     */
    <label className="dash-form__field">
      <span className="dash-form__label">{label}</span>

      {node ?? (
        <Input
          value={value}
          placeholder={placeholder}
          /* La cadena vacía se manda como null: es lo que el esquema del dominio espera para
             «este campo está en blanco», y evita guardar cadenas vacías que la invitación
             interpretaría como «hay contenido» y pintaría un hueco. */
          onChange={(event) => onChange?.(event.target.value === '' ? null : event.target.value)}
        />
      )}

      {note && <p className={error ? 'dash-form__error' : 'dash-form__help'}>{note}</p>}
    </label>
  );
}
