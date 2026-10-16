'use client';

import { useActionState, useState } from 'react';
import { Alert, Button, Modal, Tag } from 'antd';
import { Copy, Link2, Rocket } from 'lucide-react';
import type { IncompleteBlock } from '@/domain/events/content-completeness';
import { EVENT_STATUS_LABELS, isEventStatus } from '@/domain/events/event-status';
import type { EventOverview } from '@/domain/events/event-repository';
import type { PublishState } from '@/app/admin/(authenticated)/eventos/[id]/contenido/form-state';
import { formatDate, formatDaysUntil, formatLongDate, formatMoney, pluralize } from '../format';
import { InvitationLink } from '../primitives/InvitationLink';

/**
 * Lo que la plataforma puede hacer con un evento además de escribir su contenido: publicarlo y
 * pasarle el enlace al cliente.
 *
 * Va encima del formulario y no al final. Con cinco tarjetas de campos, un botón al pie obliga a
 * recorrer la pantalla entera para encontrarlo, y sobre todo esconde lo único que hay que saber
 * antes de tocar nada: en qué estado está el evento y si le falta algo.
 *
 * ## Publicar pide confirmación
 *
 * Es la operación que hace visible la invitación en su dirección y la que empieza a contar la
 * vigencia del plan. No es destructiva, pero sí es la que el cliente ve, y un clic de más en la
 * fila equivocada se arregla despublicando a mano en la base de datos — que no es una operación
 * que exista en el panel.
 *
 * ## Lo que falta se enseña, no se resume
 *
 * Cuando la acción responde «incompleto» devuelve la lista por secciones, y aquí se pinta entera.
 * Un «faltan datos» a secas obliga a abrir las cinco tarjetas buscando el hueco; «Ubicación: la
 * dirección de la sede» se arregla en diez segundos.
 *
 * ## Publicado, el enlace queda a la mano
 *
 * En cuanto el evento está publicado se enseña la dirección de la invitación con dos botones:
 * copiarla y abrirla. Es lo siguiente que se hace después de publicar —avisarle al cliente,
 * normalmente pegándosela por WhatsApp, y mirar que se vea bien en su dirección de verdad—, y sin
 * esto había que ir a la lista de eventos a buscarla. Antes de publicar no se enseña: la dirección
 * todavía contesta «aún no está disponible», y mandarla así confunde a quien la abre.
 *
 * Junto al enlace va la ficha del evento: qué plan se le vendió, hasta cuándo dura y con qué
 * plantilla se armó. Es lo que se pregunta en cuanto el cliente llama —«¿hasta cuándo se ve?»,
 * «¿mi plan incluye…?»— y antes había que ir a buscarlo a otra pantalla.
 */
export function EventPublishPanel({
  eventId,
  status,
  clientFillsContent,
  publishAction,
  shareAction,
  initialState,
  invitationUrl,
  overview,
}: {
  readonly eventId: string;
  /** La dirección completa de la invitación, `/<slug>/<código>`, con el dominio delante. */
  readonly invitationUrl: string;
  /** Plan, vigencia y diseño. `null` si no se pudo leer; entonces solo se enseña el enlace. */
  readonly overview: EventOverview | null;
  readonly status: string;
  readonly clientFillsContent: boolean;
  readonly publishAction: (state: PublishState, formData: FormData) => Promise<PublishState>;
  readonly shareAction: (state: PublishState, formData: FormData) => Promise<PublishState>;
  readonly initialState: PublishState;
}) {
  const [publishState, publish, publishing] = useActionState(publishAction, initialState);
  const [shareState, share, sharing] = useActionState(shareAction, initialState);
  const [confirming, setConfirming] = useState(false);

  const label = isEventStatus(status) ? EVENT_STATUS_LABELS[status] : status;
  const publishable = status === 'draft' || status === 'review';
  /* El estado llega del servidor, que la acción de publicar revalida; el éxito de la acción cubre
     el instante entre que contesta y llega la página nueva. */
  const published = status === 'published' || publishState.status === 'success';

  /* El aviso de la última acción que se ejecutó. Los dos estados son independientes —cada uno con
     su `useActionState`— y enseñar los dos a la vez apilaría mensajes que hablan de cosas
     distintas. Gana el que tiene algo que decir; si los dos lo tienen, el de publicar. */
  const notice = publishState.status !== 'idle' ? publishState : shareState;

  return (
    <section className="dash-card dash-publish">
      <div className="dash-publish__head">
        <div>
          <p className="dash-publish__label">Estado</p>
          <Tag color={status === 'published' ? 'green' : status === 'review' ? 'gold' : undefined}>
            {label}
          </Tag>
          {clientFillsContent && (
            <span className="dash-publish__waiting">Esperando al cliente</span>
          )}
        </div>

        <div className="dash-publish__actions">
          <form action={share}>
            <input type="hidden" name="eventId" value={eventId} />
            <Button
              htmlType="submit"
              loading={sharing}
              icon={<Link2 size={15} strokeWidth={1.9} aria-hidden="true" />}
            >
              {clientFillsContent ? 'Reenviar enlace al cliente' : 'Enviar enlace al cliente'}
            </Button>
          </form>

          <Button
            type="primary"
            disabled={!publishable}
            loading={publishing}
            icon={<Rocket size={15} strokeWidth={1.9} aria-hidden="true" />}
            onClick={() => setConfirming(true)}
          >
            Publicar
          </Button>
        </div>
      </div>

      {notice.status !== 'idle' && notice.message && (
        <Alert
          className="dash-publish__alert"
          type={notice.status === 'success' ? 'success' : 'warning'}
          showIcon
          title={notice.message}
          description={
            <>
              {notice.missing.length > 0 && <MissingList blocks={notice.missing} />}
              {notice.contentUrl && <ContentLink url={notice.contentUrl} />}
            </>
          }
        />
      )}

      {published && (
        <div className="dash-publish__invitation">
          {overview && <EventOverviewList overview={overview} />}
          <InvitationLink url={invitationUrl} label="Enlace de la invitación publicada" />
        </div>
      )}

      {/*
        El formulario de publicar vive dentro del diálogo: así el botón que confirma **es** el
        que envía, y no hay un estado intermedio de «confirmado pero sin mandar» que se pueda
        quedar colgado si alguien cierra la ventana.
      */}
      <Modal
        open={confirming}
        onCancel={() => setConfirming(false)}
        footer={null}
        title="¿Publicar esta invitación?"
        width={460}
      >
        <p className="dash-form__intro">
          Quedará visible en su dirección para cualquiera que tenga el enlace, y empezará a correr
          la vigencia del plan. Comprobamos antes que no falte información.
        </p>

        <form action={publish} onSubmit={() => setConfirming(false)}>
          <input type="hidden" name="eventId" value={eventId} />
          <div className="dash-form-actions dash-form__submit">
            <Button onClick={() => setConfirming(false)}>Cancelar</Button>
            <Button htmlType="submit" type="primary" loading={publishing}>
              Sí, publicar
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

/**
 * La ficha del evento publicado, en cuatro datos.
 *
 * La vigencia dice la fecha y cuánto falta: «vence el 16 oct 2027 · dentro de 365 días». Con
 * solo la fecha, saber si hay que avisarle al cliente que renueve obliga a hacer la cuenta.
 * Recién publicado, mientras llega la página revalidada, `expiresAt` todavía es nula y se
 * enseña la duración del plan en su lugar.
 */
function EventOverviewList({ overview }: { readonly overview: EventOverview }) {
  const duration = pluralize(overview.planDurationMonths, 'mes', 'meses');

  return (
    <dl className="dash-publish__overview">
      <div>
        <dt>Plan</dt>
        <dd>
          <strong>{overview.planName}</strong>
          <span>{formatMoney(overview.planPriceCents, overview.planCurrency)}</span>
        </dd>
      </div>
      <div>
        <dt>Vigencia</dt>
        <dd>
          {overview.expiresAt ? (
            <>
              <strong>Hasta el {formatDate(overview.expiresAt)}</strong>
              <span>
                {duration}, {formatDaysUntil(overview.expiresAt)}
              </span>
            </>
          ) : (
            <strong>{duration} desde hoy</strong>
          )}
        </dd>
      </div>
      <div>
        <dt>Evento</dt>
        <dd>
          <strong>{overview.eventTypeName}</strong>
          <span>{formatLongDate(overview.startsAt)}</span>
        </dd>
      </div>
      <div>
        <dt>Diseño</dt>
        <dd>
          <strong>{overview.templateName}</strong>
          <span>Tema {overview.themeName}</span>
        </dd>
      </div>
    </dl>
  );
}

/** Lo que falta, sección por sección. */
function MissingList({ blocks }: { readonly blocks: readonly IncompleteBlock[] }) {
  return (
    <ul className="dash-publish__missing">
      {blocks.map((block) => (
        <li key={block.blockKey}>
          <strong>{block.label}:</strong> {block.missing.join(', ')}
        </li>
      ))}
    </ul>
  );
}

/**
 * El enlace del cliente, para copiarlo.
 *
 * Se enseña siempre que la acción lo devuelve, se haya mandado el correo o no: la mitad de estas
 * conversaciones se resuelven pegándoselo al cliente por WhatsApp mientras se habla con él.
 */
function ContentLink({ url }: { readonly url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="dash-publish__link">
      <code className="dash-code">{url}</code>
      <Button
        size="small"
        icon={<Copy size={14} strokeWidth={1.9} aria-hidden="true" />}
        onClick={() => {
          void navigator.clipboard.writeText(url).then(() => setCopied(true));
        }}
      >
        {copied ? 'Copiado' : 'Copiar'}
      </Button>
    </div>
  );
}
