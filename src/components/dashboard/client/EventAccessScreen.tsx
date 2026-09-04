'use client';

import { useState, useTransition } from 'react';
import { Alert, Button, Popconfirm, Tabs, Tooltip } from 'antd';
import type { TableProps } from 'antd';
import { UserPlus } from 'lucide-react';
import { IDLE_ACTION_STATE, type ActionState } from '@/app/action-state';
import { setEventAccessStatusAction } from '@/app/panel/(event)/eventos/[id]/accesos/actions';
import type { ClientActor } from '@/domain/auth/actor';
import { canChangeEventAccess } from '@/domain/auth/user-management';
import type {
  EventAccessMember,
  EventAccessSnapshot,
  TeamMember,
  TeamSnapshot,
} from '@/domain/auth/user-repository';
import { formatDate } from '../format';
import { IdentityCell } from '../primitives/Cell';
import { DataTable } from '../primitives/DataTable';
import { PageHeader } from '../primitives/PageHeader';
import { SectionCard } from '../primitives/SectionCard';
import { StatusPill } from '../primitives/StatusPill';
import { userStatus } from '../primitives/status-display';
import { GrantAccessDialog } from './GrantAccessDialog';
import { ROLE_LABEL } from './team-roles';

/**
 * Quién puede entrar a este evento.
 *
 * Dos pestañas y no una tabla con una columna de «origen», porque no son dos clases de la misma
 * cosa: en una se puede añadir y quitar, y en la otra no se puede hacer nada. Mezclarlas daría
 * una lista donde la mitad de las filas tienen acciones y la otra mitad no, que es la forma más
 * rápida de que alguien crea que le falta un permiso.
 *
 * Las mismas funciones del dominio que autorizan en el servidor —`canChangeEventAccess`— deciden
 * aquí qué se puede tocar. No es duplicar la autorización: el servidor sigue siendo el que decide
 * y volverá a comprobarlo. Lo que se gana es que la interfaz no ofrezca lo que va a ser
 * rechazado, y que el motivo que se enseña salga de la misma función que lo rechaza.
 */
export function EventAccessScreen({
  actor,
  eventId,
  access,
  team,
}: {
  readonly actor: ClientActor;
  readonly eventId: string;
  readonly access: EventAccessSnapshot;
  readonly team: TeamSnapshot;
}) {
  const [isGrantOpen, setGrantOpen] = useState(false);
  const [feedback, setFeedback] = useState<ActionState>(IDLE_ACTION_STATE);

  return (
    <>
      <PageHeader
        title="Accesos"
        description={`Quién puede ver «${access.eventTitle}» además de tu equipo.`}
        actions={
          <Button
            type="primary"
            size="large"
            icon={<UserPlus size={16} strokeWidth={2} />}
            onClick={() => setGrantOpen(true)}
          >
            Dar acceso
          </Button>
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

      <Tabs
        defaultActiveKey="invitados"
        items={[
          {
            key: 'invitados',
            label: `Invitados (${access.members.length})`,
            children: (
              <SectionCard flush>
                <DataTable
                  rows={access.members}
                  rowKey="membershipId"
                  minWidth={720}
                  columns={guestColumns({ actor, eventId, onResult: setFeedback })}
                  empty={{
                    title: 'Todavía no has dado acceso a nadie',
                    description:
                      'Con su correo basta. Entrará directo a este evento y no verá ningún otro.',
                  }}
                />
              </SectionCard>
            ),
          },
          {
            key: 'equipo',
            label: `Tu equipo (${team.members.length})`,
            /* Con título, y no con un párrafo suelto dentro: `flush` quita el relleno del
               cuerpo para que la tabla no flote, así que un texto ahí quedaría pegado al borde.
               La cabecera de la tarjeta conserva el suyo. */
            children: (
              <SectionCard
                title="Todo tu equipo ve este evento"
                subtitle="Alcanzan todos los eventos de la cuenta. Su acceso se administra en Equipo, no aquí."
                flush
              >
                <DataTable
                  rows={team.members}
                  rowKey="id"
                  minWidth={620}
                  columns={TEAM_COLUMNS}
                  empty={{ title: 'No hay nadie más en el equipo' }}
                />
              </SectionCard>
            ),
          },
        ]}
      />

      <GrantAccessDialog
        open={isGrantOpen}
        eventId={eventId}
        eventTitle={access.eventTitle}
        onClose={() => setGrantOpen(false)}
        onResult={setFeedback}
      />
    </>
  );
}

function guestColumns(context: {
  readonly actor: ClientActor;
  readonly eventId: string;
  readonly onResult: (state: ActionState) => void;
}): TableProps<EventAccessMember>['columns'] {
  const { actor, eventId, onResult } = context;

  return [
    {
      title: 'Correo',
      dataIndex: 'email',
      key: 'email',
      /*
       * El correo va de primero y el nombre debajo, al revés que en el equipo. Es el orden que
       * corresponde al dato que de verdad hay: aquí el nombre normalmente no existe, y encabezar
       * cada fila con el hueco de lo que falta hace que la tabla parezca rota.
       */
      render: (_value, member) => (
        <IdentityCell primary={member.email} secondary={member.label ?? member.name} />
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => <StatusPill appearance={userStatus(status)} />,
    },
    {
      title: 'Último acceso',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 148,
      render: (value: Date | null) => (
        <span className="dash-cell__secondary">{value ? formatDate(value) : 'Nunca'}</span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 132,
      align: 'right',
      render: (_value, member) => (
        <AccessAction actor={actor} eventId={eventId} member={member} onResult={onResult} />
      ),
    },
  ];
}

/** El equipo, en lectura. Sin acciones: desde aquí no se le puede quitar nada a nadie. */
const TEAM_COLUMNS: TableProps<TeamMember>['columns'] = [
  {
    title: 'Persona',
    dataIndex: 'name',
    key: 'name',
    render: (_value, member) => (
      <IdentityCell primary={member.name ?? member.email} secondary={member.email} />
    ),
  },
  {
    title: 'Rol',
    dataIndex: 'role',
    key: 'role',
    width: 190,
    render: (_value, member) => (
      <span className="dash-pill dash-pill--neutral">{ROLE_LABEL[member.role]}</span>
    ),
  },
  {
    title: 'Estado',
    dataIndex: 'status',
    key: 'status',
    width: 140,
    render: (status: string) => <StatusPill appearance={userStatus(status)} />,
  },
];

function AccessAction({
  actor,
  eventId,
  member,
  onResult,
}: {
  readonly actor: ClientActor;
  readonly eventId: string;
  readonly member: EventAccessMember;
  readonly onResult: (state: ActionState) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const disabling = member.status !== 'disabled';

  const permission = canChangeEventAccess(actor, member);

  if (!permission.allowed) {
    return (
      <Tooltip title={permission.reason}>
        {/* El `<span>` envuelve al botón deshabilitado a propósito: un elemento con `disabled`
            no emite eventos de ratón, así que sin envoltorio el tooltip que explica POR QUÉ no
            se puede nunca llegaría a mostrarse. */}
        <span>
          <Button type="text" size="small" disabled>
            {disabling ? 'Quitar' : 'Devolver'}
          </Button>
        </span>
      </Tooltip>
    );
  }

  // Devolver el acceso no pide confirmación: es reversible y no le quita nada a nadie.
  if (!disabling) {
    return (
      <Button
        type="text"
        size="small"
        loading={isPending}
        onClick={() => {
          startTransition(async () => {
            onResult(await setEventAccessStatusAction(eventId, member.membershipId, false));
          });
        }}
      >
        Devolver
      </Button>
    );
  }

  return (
    <Popconfirm
      title={`Quitar el acceso de ${member.email}`}
      /* Dice lo que pasa y lo que NO pasa. Quitar un acceso de evento no cierra la sesión al
         instante —al contrario que desactivar a alguien del equipo—, y prometer lo que no se
         cumple es peor que explicar el retraso de una recarga. */
      description="Dejará de ver este evento en cuanto recargue. Su cuenta sigue existiendo."
      okText="Quitar"
      okButtonProps={{ danger: true }}
      cancelText="Cancelar"
      onConfirm={() => {
        startTransition(async () => {
          onResult(await setEventAccessStatusAction(eventId, member.membershipId, true));
        });
      }}
    >
      <Button type="text" size="small" danger loading={isPending}>
        Quitar
      </Button>
    </Popconfirm>
  );
}
