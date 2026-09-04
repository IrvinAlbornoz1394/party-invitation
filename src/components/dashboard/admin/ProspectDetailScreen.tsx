'use client';

import { useActionState, useState } from 'react';
import { Alert, Button, Input, Segmented, Select } from 'antd';
import Link from 'next/link';
import { ArrowLeft, Ban, MessageCircle, RotateCcw } from 'lucide-react';
import type { ClientSummary } from '@/domain/clients/client-repository';
import { slugifyClientName } from '@/domain/clients/client-slug';
import type { Prospect } from '@/domain/prospects/prospect';
import type { ProspectTouch } from '@/domain/prospects/prospect-repository';
import { formatDate, pluralize } from '../format';
import { EmptyState } from '../primitives/EmptyState';
import { PageHeader } from '../primitives/PageHeader';
import { SectionCard } from '../primitives/SectionCard';
import { StatusPill } from '../primitives/StatusPill';
import { prospectStatus } from '../primitives/status-display';

/**
 * Una solicitud: lo que pidió, lo que se ha hablado y cómo termina.
 *
 * ## Dos columnas, y cuál va en cada una
 *
 * A la izquierda lo que se **lee** —la solicitud y la conversación—, a la derecha lo que se
 * **hace**. Antes iba todo en una sola columna a lo ancho de la pantalla, y el formulario de
 * seguimiento se llevaba media página con tres campos y una bitácora dentro: un bloque enorme para
 * escribir dos líneas. Aquí la columna de acciones ocupa poco más de un tercio, que es lo que
 * necesitan un desplegable y un botón, y la lectura recupera el ancho.
 *
 * La separación también arregla algo que no era estético: anotar y consultar la bitácora eran la
 * misma tarjeta, así que la lista de anotaciones crecía empujando el formulario hacia arriba y a
 * los diez contactos había que desplazarse para encontrarlo.
 *
 * ## Arriba lo que escribió, y no se edita
 *
 * La ficha separa visualmente lo mismo que separa la tabla: la solicitud es la evidencia de lo que
 * esa persona pidió y no se toca nunca; el seguimiento va encima. Poder editar lo que alguien
 * escribió convierte la evidencia en una nota, y a los dos meses nadie sabe si «quería Premium» lo
 * dijo el prospecto o lo dedujo quien atendió.
 *
 * ## El botón de WhatsApp es lo que de verdad se usa
 *
 * Va en la cabecera, con el teléfono ya puesto, porque el trabajo real de esta pantalla es
 * escribirle a alguien. Todo lo demás —anotar, cerrar— ocurre después de esa conversación.
 *
 * ## Toda solicitud tiene salida
 *
 * Las tres formas de sacarla de la bandeja están en la columna derecha y ninguna está escondida
 * dentro de un desplegable: crear su cliente, vincularla con uno que ya existe, o descartarla. Una
 * bandeja de la que solo se puede entrar acaba siendo un archivo que nadie abre.
 */
export function ProspectDetailScreen({
  prospect,
  touches,
  clients,
  actions,
  initialState,
}: {
  readonly prospect: Prospect;
  readonly touches: readonly ProspectTouch[];
  /** Para vincular con un cliente que ya existe. Ver `ExistingClientForm`. */
  readonly clients: readonly ClientSummary[];
  readonly actions: ProspectScreenActions;
  readonly initialState: FormState;
}) {
  /*
   * Un solo aviso para los cinco formularios, y no uno por acción.
   *
   * Cada `useActionState` guarda su propio resultado, así que pintar «el que tenga mensaje» dejaría
   * ver el éxito de hace diez minutos junto al error de ahora. Con un estado compartido que cada
   * acción escribe al terminar, lo que se lee es siempre lo último que pasó — el mismo patrón que
   * usa la pantalla de clientes con su diálogo de alta.
   */
  const [feedback, setFeedback] = useState<FormState>(initialState);

  const [, record, isRecording] = useActionState(
    reporting(actions.record, setFeedback),
    initialState,
  );
  const [, convert, isConverting] = useActionState(
    reporting(actions.convert, setFeedback),
    initialState,
  );
  const [, link, isLinking] = useActionState(reporting(actions.link, setFeedback), initialState);
  const [, discard, isDiscarding] = useActionState(
    reporting(actions.discard, setFeedback),
    initialState,
  );
  const [, reopen, isReopening] = useActionState(
    reporting(actions.reopen, setFeedback),
    initialState,
  );

  const whatsapp = prospect.contactPhone.replace(/[^\d]/g, '');
  const isDiscarded = prospect.status === 'lost';

  return (
    <>
      <PageHeader
        title={prospect.contactName}
        description={
          <>
            Escribió el {formatDate(prospect.createdAt)} ·{' '}
            <StatusPill appearance={prospectStatus(prospect.status)} />
          </>
        }
        actions={
          <>
            {/*
              `wa.me` con el teléfono limpio de espacios y signos. No se prellena el mensaje: quien
              escribe ya leyó la solicitud entera y sabe mejor que nadie qué decir; un texto
              enlatado aquí solo se borraría antes de enviarlo.
            */}
            <Button
              type="primary"
              size="large"
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noreferrer noopener"
              icon={<MessageCircle size={16} strokeWidth={2} />}
            >
              Escribirle por WhatsApp
            </Button>
            <Link href="/admin/prospectos">
              <Button size="large" icon={<ArrowLeft size={16} strokeWidth={2} />}>
                Volver a la bandeja
              </Button>
            </Link>
          </>
        }
      />

      <div role="status" aria-live="polite">
        {feedback.message && (
          <Alert
            className="dash-page-alert"
            type={feedback.status === 'error' ? 'error' : 'success'}
            showIcon
            closable
            message={feedback.message}
            onClose={() => setFeedback(initialState)}
          />
        )}
      </div>

      <div className="dash-split">
        <div className="dash-stack">
          <SectionCard title="Lo que pidió" subtitle="Tal como lo escribió. No se edita.">
            <dl className="dash-facts">
              <Fact label="Teléfono" value={prospect.contactPhone} />
              <Fact label="Correo" value={prospect.contactEmail} />
              <Fact label="Celebración" value={prospect.eventTypeKey} />
              <Fact label="Fecha del evento" value={prospect.eventDate} />
              <Fact label="Invitados" value={prospect.guestRange} />
              <Fact label="Plan que miraba" value={prospect.planKey} />
              <Fact label="Plantilla que miraba" value={prospect.templateKey} />
            </dl>

            {prospect.message && <p className="dash-quote">{prospect.message}</p>}
          </SectionCard>

          <SectionCard
            title="Conversación"
            subtitle={
              touches.length > 0
                ? pluralize(touches.length, 'anotación', 'anotaciones')
                : undefined
            }
          >
            {touches.length === 0 ? (
              <EmptyState
                icon={MessageCircle}
                title="Todavía no se ha hablado con esta persona"
                description="Escríbele por WhatsApp y anota aquí qué contestó. La bitácora es lo que responde «¿ya le insistí?» dentro de dos meses."
              />
            ) : (
              <ol className="dash-timeline">
                {touches.map((touch) => (
                  <li key={touch.id} className="dash-timeline__item">
                    <div className="dash-timeline__head">
                      <span className="dash-timeline__when">{formatDate(touch.createdAt)}</span>
                      <span className="dash-timeline__channel">
                        {CHANNEL_LABEL[touch.channel]}
                      </span>
                      {touch.authorEmail && (
                        <span className="dash-timeline__who">{touch.authorEmail}</span>
                      )}
                    </div>
                    <p className="dash-timeline__note">{touch.note}</p>
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>
        </div>

        <div className="dash-stack">
          <SectionCard title="Anotar" subtitle="Cada vez que hables con esta persona.">
            <form action={record} className="dash-stack">
              <input type="hidden" name="prospectId" value={prospect.id} />

              <label className="dash-field">
                <span className="dash-field__label">Qué pasó</span>
                <Input.TextArea
                  name="note"
                  rows={3}
                  required
                  placeholder="Le mandé la propuesta; lo consulta con su mamá."
                />
              </label>

              <div className="dash-field-row">
                <label className="dash-field">
                  <span className="dash-field__label">Por dónde</span>
                  {/*
                    Los `Select` de antd no envían su valor en un `FormData` —no son un `<select>`
                    del navegador— así que cada uno refleja el suyo en un campo oculto. Es el mismo
                    patrón en los tres selectores de esta pantalla.
                  */}
                  <ChannelPicker />
                </label>

                <label className="dash-field">
                  <span className="dash-field__label">Cómo queda</span>
                  {/*
                    Sin «perdido». Cerrar sin venta es su propia acción, ahí abajo, porque pide el
                    motivo — y un estado que se puede elegir aquí sin explicarlo dejaría la mitad
                    interesante de la estadística vacía.
                  */}
                  <StatusPicker />
                </label>
              </div>

              <label className="dash-field">
                <span className="dash-field__label">Volver a escribirle el</span>
                {/*
                  Llega con la fecha que ya tuviera: al anotar de nuevo sin tocarla, el compromiso
                  se conserva en vez de borrarse por omisión. Se formatea en UTC a propósito —el
                  valor guardado es el inicio del día— porque un `toISOString` local daría días
                  distintos en el servidor y en el navegador, y la hidratación cambiaría el campo.
                */}
                <input
                  className="dash-native-input"
                  type="date"
                  name="nextFollowUp"
                  defaultValue={prospect.nextFollowUpAt?.toISOString().slice(0, 10) ?? ''}
                />
              </label>

              <div className="dash-form-actions">
                <Button type="primary" htmlType="submit" loading={isRecording}>
                  Anotar
                </Button>
              </div>
            </form>
          </SectionCard>

          <SectionCard
            title="Contratación"
            subtitle={prospect.clientId ? undefined : 'Al cerrar la venta, se vuelve cliente.'}
          >
            {prospect.clientId ? (
              <p className="dash-note">
                Ya es cliente:{' '}
                <Link href={`/admin/clientes/${prospect.clientId}`}>{prospect.clientName}</Link>. El
                siguiente paso es darle de alta su evento.
              </p>
            ) : (
              <ConversionForms
                prospect={prospect}
                clients={clients}
                convert={convert}
                isConverting={isConverting}
                link={link}
                isLinking={isLinking}
              />
            )}
          </SectionCard>

          {isDiscarded ? (
            <SectionCard title="Descartada">
              <div className="dash-stack">
                <p className="dash-note">
                  {prospect.lostReason
                    ? `Motivo: ${prospect.lostReason}.`
                    : 'Se cerró sin motivo anotado.'}{' '}
                  Ya no aparece en la bandeja ni en el contador, y sigue contando en las cifras del
                  embudo.
                </p>

                <form action={reopen}>
                  <input type="hidden" name="prospectId" value={prospect.id} />
                  <Button
                    htmlType="submit"
                    loading={isReopening}
                    icon={<RotateCcw size={15} strokeWidth={2} />}
                  >
                    Reabrir
                  </Button>
                </form>
              </div>
            </SectionCard>
          ) : (
            prospect.clientId === null && (
              <DiscardForm prospect={prospect} discard={discard} isDiscarding={isDiscarding} />
            )
          )}
        </div>
      </div>
    </>
  );
}

/** Una acción de servidor de esta pantalla, tal como la consume `useActionState`. */
export type ProspectAction = (state: FormState, formData: FormData) => Promise<FormState>;

/**
 * Las cinco acciones, en un objeto y no en cinco propiedades sueltas.
 *
 * Todas son de la misma pantalla y se pasan siempre juntas; separarlas solo alargaría la firma y
 * la llamada de la página con cinco líneas que no dicen nada más.
 */
export interface ProspectScreenActions {
  readonly record: ProspectAction;
  readonly convert: ProspectAction;
  readonly link: ProspectAction;
  readonly discard: ProspectAction;
  readonly reopen: ProspectAction;
}

interface FormState {
  readonly status: 'idle' | 'success' | 'error';
  readonly message: string;
}

/**
 * Envuelve una acción para que, además de devolver su resultado, lo anuncie en el aviso común.
 *
 * Es una función normal y no un hook a propósito: no guarda estado ni usa nada de React, solo
 * compone dos llamadas. Un hook aquí sería envolver una closure en ceremonia.
 */
function reporting(action: ProspectAction, report: (state: FormState) => void): ProspectAction {
  return async (previous, formData) => {
    const result = await action(previous, formData);

    report(result);

    return result;
  };
}

/**
 * Los dos caminos de la conversión, en el mismo sitio y con la misma importancia.
 *
 * «Cliente nuevo» va primero porque es lo que pasa casi siempre: quien acaba de decir que sí no
 * suele existir todavía como cliente. El otro camino no sobra —la misma familia que ya contrató la
 * boda vuelve para los XV—, y tenerlos juntos evita el error de crear un duplicado por no
 * acordarse de mirar la lista.
 */
function ConversionForms({
  prospect,
  clients,
  convert,
  isConverting,
  link,
  isLinking,
}: {
  readonly prospect: Prospect;
  readonly clients: readonly ClientSummary[];
  readonly convert: (formData: FormData) => void;
  readonly isConverting: boolean;
  readonly link: (formData: FormData) => void;
  readonly isLinking: boolean;
}) {
  const [mode, setMode] = useState<ConversionMode>('new');

  return (
    <div className="dash-stack">
      {/*
        Un `<div>` con rótulo y no un `<label>`: `Segmented` es un grupo de botones de opción, y un
        `<label>` solo puede etiquetar a un control — envolviéndolo, el clic en el rótulo activaría
        el primero del grupo.
      */}
      <div className="dash-field">
        <span className="dash-field__label">Su cliente</span>
        <Segmented<ConversionMode>
          block
          value={mode}
          onChange={setMode}
          options={[
            { label: 'Es nuevo', value: 'new' },
            { label: 'Ya existe', value: 'existing' },
          ]}
        />
      </div>

      {mode === 'new' ? (
        <NewClientForm prospect={prospect} convert={convert} isConverting={isConverting} />
      ) : (
        <ExistingClientForm
          prospect={prospect}
          clients={clients}
          link={link}
          isLinking={isLinking}
        />
      )}
    </div>
  );
}

type ConversionMode = 'new' | 'existing';

/**
 * Crear el cliente desde la solicitud.
 *
 * Los campos llegan escritos con lo que puso el prospecto, y **abiertos**. Es la respuesta al
 * riesgo real de prellenar: que se acepte sin mirar y el cliente acabe llamándose «Ana» en vez de
 * como se factura. Por eso el nombre del cliente lleva su ayuda debajo en vez de resolverse solo.
 *
 * Los campos son controlados, no `defaultValue`: React reinicia un formulario cuando su acción
 * termina, así que un error del servidor —un correo repetido, por ejemplo— borraría los otros
 * cuatro campos y obligaría a teclearlos otra vez.
 */
function NewClientForm({
  prospect,
  convert,
  isConverting,
}: {
  readonly prospect: Prospect;
  readonly convert: (formData: FormData) => void;
  readonly isConverting: boolean;
}) {
  const [name, setName] = useState(prospect.contactName);
  const [slug, setSlug] = useState('');
  const [ownerName, setOwnerName] = useState(prospect.contactName);
  /* El correo con el que va a nacer el cliente. Se rellena con el que dejó en el formulario
     público, donde es opcional, y se queda vacío cuando no lo dejó — que es justo la
     conversación que hay que tener antes de darle de alta. */
  const [contactEmail, setContactEmail] = useState(prospect.contactEmail ?? '');
  const [contactPhone, setContactPhone] = useState(prospect.contactPhone);

  return (
    <form action={convert} className="dash-stack">
      <input type="hidden" name="prospectId" value={prospect.id} />

      <label className="dash-field">
        <span className="dash-field__label">Nombre del cliente</span>
        <Input
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="off"
          required
        />
        <span className="dash-field__help">Como lo vas a facturar, no como firmó la web.</span>
      </label>

      <label className="dash-field">
        <span className="dash-field__label">Identificador</span>
        <Input
          name="slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder={slugifyClientName(name) || 'familia-mendez'}
          autoComplete="off"
        />
        <span className="dash-field__help">Si lo dejas vacío se genera del nombre.</span>
      </label>

      <label className="dash-field">
        <span className="dash-field__label">Persona responsable</span>
        <Input
          name="ownerName"
          value={ownerName}
          onChange={(event) => setOwnerName(event.target.value)}
          autoComplete="off"
          required
        />
      </label>

      <label className="dash-field">
        <span className="dash-field__label">Correo del cliente</span>
        <Input
          name="contactEmail"
          type="email"
          value={contactEmail}
          onChange={(event) => setContactEmail(event.target.value)}
          autoComplete="off"
          required
        />
        <span className="dash-field__help">
          {prospect.contactEmail === null
            ? 'No dejó correo en el formulario —ahí es opcional— y un cliente no puede nacer sin él: pídeselo. Es donde llegan los avisos y con el que pedirá su código para entrar.'
            : 'Ahí llegan los avisos y con él pedirá su código para entrar.'}
        </span>
      </label>

      <label className="dash-field">
        <span className="dash-field__label">WhatsApp</span>
        <Input
          name="contactPhone"
          type="tel"
          value={contactPhone}
          onChange={(event) => setContactPhone(event.target.value)}
          autoComplete="off"
        />
        <span className="dash-field__help">
          Viene de la solicitud. Todavía no se manda nada por aquí; se guarda para cuando los
          avisos también salgan por WhatsApp.
        </span>
      </label>

      <div className="dash-form-actions">
        <Button type="primary" htmlType="submit" loading={isConverting}>
          Crear cliente y vincular
        </Button>
      </div>
    </form>
  );
}

/** Vincular con un cliente que ya está dado de alta. */
function ExistingClientForm({
  prospect,
  clients,
  link,
  isLinking,
}: {
  readonly prospect: Prospect;
  readonly clients: readonly ClientSummary[];
  readonly link: (formData: FormData) => void;
  readonly isLinking: boolean;
}) {
  const [clientId, setClientId] = useState<string | undefined>(undefined);

  return (
    <form action={link} className="dash-stack">
      <input type="hidden" name="prospectId" value={prospect.id} />

      <label className="dash-field">
        <span className="dash-field__label">Cliente</span>
        <Select
          showSearch
          placeholder="Elige el cliente"
          style={{ width: '100%' }}
          value={clientId}
          onChange={setClientId}
          optionFilterProp="label"
          options={clients.map((client) => ({ value: client.id, label: client.name }))}
        />
        <input type="hidden" name="clientId" value={clientId ?? ''} />
      </label>

      <div className="dash-form-actions">
        <Button htmlType="submit" loading={isLinking} disabled={clients.length === 0}>
          Vincular
        </Button>
      </div>
    </form>
  );
}

/**
 * La salida de quien no compró.
 *
 * Está a la vista y con su propio botón porque es una decisión que se toma una vez y hay que poder
 * tomarla sin buscarla. El motivo es obligatorio —el botón no se activa sin él— y es la única
 * fricción que se añade: `lost_reason` es lo que después explica por qué no se cerraron las que no
 * se cerraron, y solo se sabe en este momento.
 */
function DiscardForm({
  prospect,
  discard,
  isDiscarding,
}: {
  readonly prospect: Prospect;
  readonly discard: (formData: FormData) => void;
  readonly isDiscarding: boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <SectionCard title="¿Ya no va a comprar?" subtitle="Descartarla la saca de la bandeja.">
      <form action={discard} className="dash-stack">
        <input type="hidden" name="prospectId" value={prospect.id} />

        <label className="dash-field">
          <span className="dash-field__label">Por qué se descarta</span>
          <Input
            name="reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Presupuesto, fecha, se fue con otro…"
          />
          <span className="dash-field__help">
            Se guarda en la bitácora y en las cifras. Si vuelve a escribir, se reabre.
          </span>
        </label>

        <div className="dash-form-actions">
          <Button
            danger
            htmlType="submit"
            loading={isDiscarding}
            disabled={reason.trim().length === 0}
            icon={<Ban size={15} strokeWidth={2} />}
          >
            Descartar
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

/** El canal, con su valor reflejado en un campo oculto que el formulario sí envía. */
function ChannelPicker() {
  const [channel, setChannel] = useState('whatsapp');

  return (
    <>
      <Select
        value={channel}
        onChange={setChannel}
        style={{ width: '100%' }}
        options={[
          { value: 'whatsapp', label: 'WhatsApp' },
          { value: 'call', label: 'Llamada' },
          { value: 'email', label: 'Correo' },
          { value: 'meeting', label: 'Reunión' },
          { value: 'other', label: 'Otro' },
        ]}
      />
      <input type="hidden" name="channel" value={channel} />
    </>
  );
}

/** En qué queda la conversación. Sin desenlaces: esos tienen su propia tarjeta. */
function StatusPicker() {
  const [status, setStatus] = useState<string | undefined>(undefined);

  return (
    <>
      <Select
        allowClear
        placeholder="Sin cambio"
        style={{ width: '100%' }}
        value={status}
        onChange={(value?: string) => setStatus(value)}
        options={[
          { value: 'contacted', label: 'Contactada' },
          { value: 'quoted', label: 'Cotizada' },
        ]}
      />
      <input type="hidden" name="status" value={status ?? ''} />
    </>
  );
}

function Fact({ label, value }: { readonly label: string; readonly value: string | null }) {
  if (!value) return null;

  return (
    <div className="dash-facts__row">
      <dt className="dash-facts__label">{label}</dt>
      <dd className="dash-facts__value">{value}</dd>
    </div>
  );
}

const CHANNEL_LABEL: Record<ProspectTouch['channel'], string> = {
  whatsapp: 'WhatsApp',
  call: 'Llamada',
  email: 'Correo',
  meeting: 'Reunión',
  other: 'Otro',
};
