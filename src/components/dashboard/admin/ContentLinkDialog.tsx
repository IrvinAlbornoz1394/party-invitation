'use client';

import { useEffect, useState, useTransition } from 'react';
import { Alert, Button, Input, Modal, Skeleton } from 'antd';
import { MessageCircle, RefreshCw } from 'lucide-react';
import {
  generateContentLinkAction,
  loadContentLinkAction,
  type ContentLinkView,
} from '@/app/admin/(authenticated)/eventos/enlace/actions';
import { formatDate } from '../format';
import { CopyButton } from '../primitives/CopyButton';

/**
 * El enlace para que el cliente llene su información, listo para copiar y pegar en su WhatsApp.
 *
 * Ya no se manda por correo (decisión del 2026-11-18): la conversación con el cliente está en
 * WhatsApp, y ahí es donde tiene que llegar. El modal enseña el enlace vigente —el mismo cada vez
 * que se abre, mientras no venza— o genera uno si no hay.
 *
 * «Generar uno nuevo» invalida el anterior. Es lo que se hace si el enlace se mandó a quien no
 * era, o si el cliente lo perdió y ya venció.
 */
export function ContentLinkDialog({
  event,
  clientPhone,
  onClose,
}: {
  /** El evento cuyo enlace se enseña; `null` cierra el modal. */
  readonly event: { readonly id: string; readonly title: string } | null;
  /** Para abrir directamente su chat. Sin teléfono, WhatsApp pide elegir el contacto. */
  readonly clientPhone?: string | null;
  readonly onClose: () => void;
}) {
  const [view, setView] = useState<ContentLinkView | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!event) return;

    setView(null);
    startTransition(async () => setView(await loadContentLinkAction(event.id)));
  }, [event]);

  const generate = () => {
    if (!event) return;
    startTransition(async () => setView(await generateContentLinkAction(event.id)));
  };

  const whatsappHref =
    view?.status === 'active'
      ? whatsappUrl(
          clientPhone ?? null,
          `¡Hola! Aquí puedes llenar los datos de tu invitación «${event?.title ?? ''}»: ${view.url}\n\nEl enlace vale cinco días. Puedes guardar y volver cuando quieras.`,
        )
      : null;

  return (
    <Modal
      open={event !== null}
      onCancel={onClose}
      title="Enlace para el cliente"
      footer={null}
      destroyOnHidden
    >
      {event && <p className="dash-form__help" style={{ marginTop: 0 }}>{event.title}</p>}

      {view === null && <Skeleton active paragraph={{ rows: 2 }} title={false} />}

      {view?.status === 'error' && <Alert type="error" showIcon title={view.message} />}

      {view?.status === 'none' && (
        <>
          <p>
            Todavía no hay un enlace vigente para este evento. Al generarlo, el cliente podrá entrar a
            llenar su información durante cinco días, sin pedir código.
          </p>
          <Button type="primary" size="large" loading={pending} onClick={generate}>
            Generar enlace
          </Button>
        </>
      )}

      {view?.status === 'active' && (
        <div className="content-link">
          <Input readOnly value={view.url} aria-label="Enlace para el cliente" onFocus={(e) => e.target.select()} />

          <div className="content-link__actions">
            <CopyButton value={view.url} label="Copiar enlace" />
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <Button icon={<MessageCircle size={15} aria-hidden="true" />}>Abrir en WhatsApp</Button>
              </a>
            )}
          </div>

          <ul className="content-link__facts">
            <li>Vence el {formatDate(new Date(view.expiresAt))}.</li>
            <li>
              {view.openedAt
                ? `El cliente ya entró (${formatDate(new Date(view.openedAt))}).`
                : 'El cliente todavía no lo abre.'}
            </li>
            <li>Solo sirve para este evento, y deja de funcionar cuando el cliente envía su información.</li>
          </ul>

          <Button
            type="link"
            icon={<RefreshCw size={14} aria-hidden="true" />}
            loading={pending}
            onClick={generate}
            style={{ paddingInline: 0 }}
          >
            Generar uno nuevo (el anterior deja de servir)
          </Button>
        </div>
      )}
    </Modal>
  );
}

/** `wa.me` con el mensaje escrito; con teléfono abre su chat, sin él deja elegir a quién. */
function whatsappUrl(phone: string | null, message: string): string {
  const digits = phone?.replace(/\D/g, '') ?? '';
  const number = digits.length === 10 ? `52${digits}` : digits;

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
