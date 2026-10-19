'use client';

import { useState, useTransition } from 'react';
import { Alert, Button, Popconfirm, Tooltip } from 'antd';
import type { TableProps } from 'antd';
import { MessageCircle, Pencil, Trash2, UserPlus, Users } from 'lucide-react';
import { IDLE_ACTION_STATE, type ActionState } from '@/app/action-state';
import { deleteGuestGroupAction } from '@/app/panel/(event)/eventos/[id]/invitados/actions';
import { invitationUrl } from '@/domain/events/invitation-url';
import {
  guestInviteMessage,
  summarizeGuestList,
  type GuestGroup,
  type GuestList,
} from '@/domain/guests/guest-group';
import { whatsappUrl } from '@/domain/invitation/blocks/rsvp';
import { IdentityCell } from '../primitives/Cell';
import { CopyButton } from '../primitives/CopyButton';
import { DataTable } from '../primitives/DataTable';
import { PageHeader } from '../primitives/PageHeader';
import { SectionCard } from '../primitives/SectionCard';
import { StatCard } from '../primitives/StatCard';
import { StatusPill } from '../primitives/StatusPill';
import { rsvpStatus } from '../primitives/status-display';
import { siteUrl } from '../site-url';
import { GuestGroupDialog } from './GuestGroupDialog';

/**
 * La lista de invitados de un evento, por familia.
 *
 * Lo que se viene a hacer aquí es **repartir enlaces**: cada fila trae el suyo para copiar o, si
 * la familia tiene WhatsApp, para mandárselo con un mensaje ya escrito. La respuesta de cada una
 * se ve en la misma fila, pero el resumen —cuántos vienen— vive en «Confirmaciones».
 *
 * Un visor ve la lista entera sin ninguna acción de edición; el servidor lo vuelve a comprobar.
 */
export function GuestsScreen({
  list,
  canEdit,
}: {
  readonly list: GuestList;
  readonly canEdit: boolean;
}) {
  const [dialog, setDialog] = useState<{ readonly group: GuestGroup | null } | null>(null);
  const [feedback, setFeedback] = useState<ActionState>(IDLE_ACTION_STATE);
  const summary = summarizeGuestList(list.groups);

  return (
    <>
      <PageHeader
        title="Invitados"
        description="Cada familia recibe su propio enlace. Desde él confirma cuántos asistirán o avisa que no podrá ir."
        actions={
          canEdit ? (
            <Button
              type="primary"
              size="large"
              icon={<UserPlus size={16} strokeWidth={2} />}
              onClick={() => setDialog({ group: null })}
            >
              Agregar invitación
            </Button>
          ) : undefined
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
            onClose={() => setFeedback(IDLE_ACTION_STATE)}
          />
        )}
      </div>

      {/* Un enlace de una invitación en borrador no abre: se avisa antes de que alguien los
          reparta y la familia se encuentre con la portada. */}
      {list.eventStatus !== 'published' && list.groups.length > 0 && (
        <Alert
          className="dash-page-alert"
          type="info"
          showIcon
          message="Los enlaces funcionarán cuando la invitación esté publicada. Puedes ir preparando la lista."
        />
      )}

      <div className="dash-grid" style={{ marginBottom: 'var(--dash-gap)' }}>
        <StatCard icon={Users} tone="azure" label="Invitaciones" value={summary.families} />
        <StatCard icon={UserPlus} tone="plum" label="Lugares apartados" value={summary.seats} />
        <StatCard
          icon={MessageCircle}
          tone="sage"
          label="Ya respondieron"
          value={summary.families - summary.pendingFamilies}
          suffix={`de ${summary.families}`}
        />
      </div>

      <SectionCard flush>
        <DataTable
          rows={list.groups}
          rowKey="id"
          minWidth={820}
          columns={columns({ list, canEdit, onEdit: (group) => setDialog({ group }), onResult: setFeedback })}
          empty={{
            title: 'Todavía no hay invitaciones',
            description: canEdit
              ? 'Agrega a cada familia con los lugares que le apartas y mándale su enlace.'
              : 'Cuando se agreguen familias, aparecerán aquí con su enlace.',
          }}
        />
      </SectionCard>

      {canEdit && (
        <GuestGroupDialog
          /* El formulario es no controlado: sin `key`, abrir otra familia conservaría los
             valores de la anterior. */
          key={dialog?.group?.id ?? 'new'}
          open={dialog !== null}
          eventId={list.eventId}
          group={dialog?.group ?? null}
          onClose={() => setDialog(null)}
          onResult={setFeedback}
        />
      )}
    </>
  );
}

function columns(context: {
  readonly list: GuestList;
  readonly canEdit: boolean;
  readonly onEdit: (group: GuestGroup) => void;
  readonly onResult: (state: ActionState) => void;
}): TableProps<GuestGroup>['columns'] {
  const { list, canEdit, onEdit, onResult } = context;

  return [
    {
      title: 'Invitación',
      dataIndex: 'name',
      key: 'name',
      render: (_value, group) => <IdentityCell primary={group.name} secondary={group.notes} />,
    },
    {
      title: 'Lugares',
      dataIndex: 'seats',
      key: 'seats',
      width: 100,
      align: 'center',
    },
    {
      title: 'Respuesta',
      key: 'reply',
      width: 150,
      render: (_value, group) => <StatusPill appearance={rsvpStatus(group.reply)} />,
    },
    {
      title: 'Enlace',
      key: 'link',
      width: 150,
      render: (_value, group) => <GuestLinkActions list={list} group={group} />,
    },
    ...(canEdit
      ? [
          {
            title: '',
            key: 'actions',
            width: 100,
            align: 'right' as const,
            render: (_value: unknown, group: GuestGroup) => (
              <RowActions eventId={list.eventId} group={group} onEdit={onEdit} onResult={onResult} />
            ),
          },
        ]
      : []),
  ];
}

/** Copiar el enlace de la familia o mandárselo por WhatsApp con el mensaje ya escrito. */
function GuestLinkActions({ list, group }: { readonly list: GuestList; readonly group: GuestGroup }) {
  const url = invitationUrl(siteUrl(), list.eventSlug, group.inviteCode);

  return (
    <span style={{ display: 'inline-flex', gap: 4 }}>
      <CopyButton
        value={url}
        iconOnly
        size="small"
        describedAs={`el enlace de ${group.name}`}
      />
      {group.phone && (
        <Tooltip title="Mandar por WhatsApp">
          <Button
            type="text"
            size="small"
            href={whatsappUrl(group.phone, guestInviteMessage(group.name, list.eventTitle, url))}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Mandar su enlace a ${group.name} por WhatsApp`}
            icon={<MessageCircle size={15} strokeWidth={1.8} />}
          />
        </Tooltip>
      )}
    </span>
  );
}

function RowActions({
  eventId,
  group,
  onEdit,
  onResult,
}: {
  readonly eventId: string;
  readonly group: GuestGroup;
  readonly onEdit: (group: GuestGroup) => void;
  readonly onResult: (state: ActionState) => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <span style={{ display: 'inline-flex', gap: 4 }}>
      <Tooltip title="Editar">
        <Button
          type="text"
          size="small"
          aria-label={`Editar ${group.name}`}
          icon={<Pencil size={15} strokeWidth={1.8} />}
          onClick={() => onEdit(group)}
        />
      </Tooltip>
      <Popconfirm
        title={`Quitar «${group.name}»`}
        /* Dice lo que se pierde: el enlace deja de abrir y su respuesta sale de la cuenta. */
        description={
          group.reply
            ? 'Su enlace dejará de funcionar y su respuesta saldrá de las confirmaciones.'
            : 'Su enlace dejará de funcionar.'
        }
        okText="Quitar"
        okButtonProps={{ danger: true }}
        cancelText="Cancelar"
        onConfirm={() => {
          startTransition(async () => {
            onResult(await deleteGuestGroupAction(eventId, group.id));
          });
        }}
      >
        <Button
          type="text"
          size="small"
          danger
          loading={isPending}
          aria-label={`Quitar ${group.name}`}
          icon={<Trash2 size={15} strokeWidth={1.8} />}
        />
      </Popconfirm>
    </span>
  );
}
