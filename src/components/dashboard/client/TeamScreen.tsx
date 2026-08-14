'use client';

import { useState, useTransition } from 'react';
import { Alert, Button, Popconfirm, Select, Tooltip } from 'antd';
import type { TableProps } from 'antd';
import { UserPlus } from 'lucide-react';
import { IDLE_ACTION_STATE, type ActionState } from '@/app/action-state';
import { changeRoleAction, setStatusAction } from '@/app/panel/(authenticated)/equipo/actions';
import { hasRoleAtLeast, type ClientActor, type UserRole } from '@/domain/auth/actor';
import { canChangeRole, canSetStatus } from '@/domain/auth/user-management';
import type { TeamMember, TeamSnapshot } from '@/domain/auth/user-repository';
import { formatDate } from '../format';
import { IdentityCell } from '../primitives/Cell';
import { DataTable } from '../primitives/DataTable';
import { PageHeader } from '../primitives/PageHeader';
import { SectionCard } from '../primitives/SectionCard';
import { StatusPill } from '../primitives/StatusPill';
import { userStatus } from '../primitives/status-display';
import { InviteMemberDialog } from './InviteMemberDialog';
import { ROLE_HELP, ROLE_LABEL } from './team-roles';

/**
 * Quién puede entrar al panel del cliente.
 *
 * Las mismas funciones del dominio que autorizan en el servidor —`canChangeRole`,
 * `canSetStatus`— se usan aquí para decidir qué se puede tocar. No es duplicar la
 * autorización: el servidor sigue siendo el que decide y volverá a comprobarlo. Lo que se
 * gana es que la interfaz no ofrezca acciones que van a ser rechazadas, y que el motivo que
 * se muestra sea exactamente el mismo texto en los dos lados, porque sale de la misma
 * función.
 *
 * Cualquier rol puede VER el equipo —saber con quién trabajas no es un privilegio—, pero solo
 * `admin` y `owner` pueden modificarlo.
 */
export function TeamScreen({
  actor,
  team,
}: {
  readonly actor: ClientActor;
  readonly team: TeamSnapshot;
}) {
  const [isInviteOpen, setInviteOpen] = useState(false);
  const [feedback, setFeedback] = useState<ActionState>(IDLE_ACTION_STATE);

  const canInvite = hasRoleAtLeast(actor, 'admin');

  return (
    <>
      <PageHeader
        title="Equipo"
        description={`Quién puede entrar al panel de ${team.clientName || 'tu cuenta'}.`}
        actions={
          canInvite && (
            <Button
              type="primary"
              size="large"
              icon={<UserPlus size={16} strokeWidth={2} />}
              onClick={() => setInviteOpen(true)}
            >
              Invitar persona
            </Button>
          )
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

      <SectionCard flush>
        <DataTable
          rows={team.members}
          rowKey="id"
          minWidth={760}
          columns={buildColumns({ actor, team, onResult: setFeedback })}
          empty={{ title: 'No hay nadie más en el equipo' }}
        />
      </SectionCard>

      <InviteMemberDialog
        open={isInviteOpen}
        actor={actor}
        onClose={() => setInviteOpen(false)}
        onResult={setFeedback}
      />
    </>
  );
}

function buildColumns(context: {
  readonly actor: ClientActor;
  readonly team: TeamSnapshot;
  readonly onResult: (state: ActionState) => void;
}): TableProps<TeamMember>['columns'] {
  const { actor, team, onResult } = context;

  return [
    {
      title: 'Persona',
      dataIndex: 'name',
      key: 'name',
      render: (_value, member) => (
        <IdentityCell
          primary={
            <>
              {member.name}
              {member.id === actor.userId && <span className="dash-you">tú</span>}
            </>
          }
          secondary={member.email}
        />
      ),
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      width: 190,
      render: (_value, member) => (
        <RoleCell actor={actor} team={team} member={member} onResult={onResult} />
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
        <StatusAction actor={actor} team={team} member={member} onResult={onResult} />
      ),
    },
  ];
}

function RoleCell({
  actor,
  team,
  member,
  onResult,
}: {
  readonly actor: ClientActor;
  readonly team: TeamSnapshot;
  readonly member: TeamMember;
  readonly onResult: (state: ActionState) => void;
}) {
  const [isPending, startTransition] = useTransition();

  /*
   * Se pregunta al dominio por cada rol posible. Así el desplegable solo ofrece los que de
   * verdad se pueden asignar —un `admin` no ve la opción «Dueño»— en lugar de dejar elegir y
   * fallar después.
   */
  const options = (['owner', 'admin', 'staff'] as const)
    .filter(
      (role) =>
        role === member.role ||
        canChangeRole(actor, member, role, { activeOwners: team.activeOwners }).allowed,
    )
    .map((role) => ({ value: role, label: ROLE_LABEL[role], title: ROLE_HELP[role] }));

  const editable = canChangeRole(actor, member, member.role === 'owner' ? 'admin' : 'owner', {
    activeOwners: team.activeOwners,
  });

  // Si no se puede editar, se muestra el rol y el motivo al posarse encima. Un control
  // deshabilitado sin explicación es la forma más rápida de que alguien crea que hay un fallo.
  if (!editable.allowed && options.length <= 1) {
    return (
      <Tooltip title={editable.reason}>
        <span className="dash-pill dash-pill--neutral">{ROLE_LABEL[member.role]}</span>
      </Tooltip>
    );
  }

  return (
    <Select
      value={member.role}
      loading={isPending}
      disabled={isPending}
      style={{ width: '100%' }}
      options={options}
      aria-label={`Rol de ${member.name}`}
      onChange={(role: UserRole) => {
        startTransition(async () => {
          onResult(await changeRoleAction(member.id, role));
        });
      }}
    />
  );
}

function StatusAction({
  actor,
  team,
  member,
  onResult,
}: {
  readonly actor: ClientActor;
  readonly team: TeamSnapshot;
  readonly member: TeamMember;
  readonly onResult: (state: ActionState) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const disabling = member.status !== 'disabled';

  const permission = canSetStatus(actor, member, disabling ? 'disabled' : 'active', {
    activeOwners: team.activeOwners,
  });

  if (!permission.allowed) {
    return (
      <Tooltip title={permission.reason}>
        {/* El `<span>` envuelve al botón deshabilitado a propósito: un elemento con
            `disabled` no emite eventos de ratón, así que sin envoltorio el tooltip que
            explica POR QUÉ no se puede nunca llegaría a mostrarse. */}
        <span>
          <Button type="text" size="small" disabled>
            {disabling ? 'Desactivar' : 'Reactivar'}
          </Button>
        </span>
      </Tooltip>
    );
  }

  // Reactivar no pide confirmación: es reversible y no le quita el acceso a nadie.
  if (!disabling) {
    return (
      <Button
        type="text"
        size="small"
        loading={isPending}
        onClick={() => {
          startTransition(async () => {
            onResult(await setStatusAction(member.id, false));
          });
        }}
      >
        Reactivar
      </Button>
    );
  }

  return (
    <Popconfirm
      title={`Desactivar a ${member.name}`}
      description="Se cerrará su sesión al instante y no podrá volver a entrar."
      okText="Desactivar"
      okButtonProps={{ danger: true }}
      cancelText="Cancelar"
      onConfirm={() => {
        startTransition(async () => {
          onResult(await setStatusAction(member.id, true));
        });
      }}
    >
      <Button type="text" size="small" danger loading={isPending}>
        Desactivar
      </Button>
    </Popconfirm>
  );
}
