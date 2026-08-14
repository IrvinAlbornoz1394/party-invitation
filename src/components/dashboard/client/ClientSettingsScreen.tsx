'use client';

import { Alert } from 'antd';
import { KeyRound, Mail, ShieldCheck } from 'lucide-react';
import type { ClientActor, UserRole } from '@/domain/auth/actor';
import { CodeCell } from '../primitives/Cell';
import { FactList } from '../primitives/FactList';
import { PageHeader } from '../primitives/PageHeader';
import { SectionCard } from '../primitives/SectionCard';

/**
 * Los ajustes de una cuenta de cliente.
 *
 * Es una pantalla de lectura, por los mismos motivos que la equivalente de plataforma: el
 * correo es la credencial con la que se pide el código —cambiarlo desde aquí sería cambiarse
 * la llave en caliente— y no hay contraseña que rotar porque el acceso es por código de un
 * solo uso.
 *
 * Lo que sí explica es el rol, y ahí está su utilidad real: «¿por qué no puedo invitar a
 * nadie?» es la pregunta que más llega a soporte desde este panel, y la respuesta es que un
 * colaborador no gestiona personas. Decirlo aquí, con el texto de lo que cada rol puede
 * hacer, ahorra esa llamada.
 */
export function ClientSettingsScreen({
  actor,
  clientName,
}: {
  readonly actor: ClientActor;
  readonly clientName: string;
}) {
  return (
    <>
      <PageHeader
        title="Ajustes"
        description="Tu cuenta y qué puedes hacer dentro del panel."
      />

      <div className="dash-split">
        <div className="dash-stack">
          <SectionCard title="Tu cuenta">
            <FactList
              facts={[
                { label: 'Nombre', value: actor.name },
                { label: 'Correo', value: actor.email },
                { label: 'Cuenta', value: clientName },
                { label: 'Tu rol', value: ROLE_LABEL[actor.role] },
                { label: 'Identificador', value: <CodeCell>{actor.userId}</CodeCell> },
              ]}
            />

            <Alert
              className="dash-page-alert"
              style={{ marginTop: 'var(--dash-gap)', marginBottom: 0 }}
              type="info"
              showIcon
              message="¿Necesitas cambiar algo de esto?"
              description="El correo es la credencial con la que pides tu código de acceso, así que no se edita desde el panel. Escríbenos y lo cambiamos nosotros."
            />
          </SectionCard>

          <SectionCard title="Qué puede hacer tu rol">
            <p className="dash-block__description">{ROLE_HELP[actor.role]}</p>
            <FactList
              facts={[
                { label: 'Ver los eventos', value: 'Sí' },
                {
                  label: 'Ver el equipo',
                  value: 'Sí — saber con quién trabajas no es un privilegio',
                },
                {
                  label: 'Invitar y quitar personas',
                  value: actor.role === 'staff' ? 'No' : 'Sí',
                },
                {
                  label: 'Nombrar otros dueños',
                  value: actor.role === 'owner' ? 'Sí' : 'No',
                },
              ]}
            />
          </SectionCard>
        </div>

        <SectionCard title="Cómo entras">
          <ul className="dash-bullets">
            <li>
              <span className="dash-bullets__icon dash-tone-gold" aria-hidden="true">
                <Mail size={15} strokeWidth={2} />
              </span>
              <span>
                Pides un código de 6 dígitos a tu correo. <strong>No hay contraseña</strong> que
                recordar ni que se pueda filtrar.
              </span>
            </li>
            <li>
              <span className="dash-bullets__icon dash-tone-rose" aria-hidden="true">
                <KeyRound size={15} strokeWidth={2} />
              </span>
              <span>El código vence en 10 minutos y vale una sola vez.</span>
            </li>
            <li>
              <span className="dash-bullets__icon dash-tone-slate" aria-hidden="true">
                <ShieldCheck size={15} strokeWidth={2} />
              </span>
              <span>
                Solo ves los datos de tu cuenta. El aislamiento lo impone la base de datos, no
                la pantalla.
              </span>
            </li>
          </ul>
        </SectionCard>
      </div>
    </>
  );
}

const ROLE_LABEL: Record<UserRole, string> = {
  owner: 'Dueño de la cuenta',
  admin: 'Administrador',
  staff: 'Colaborador',
};

const ROLE_HELP: Record<UserRole, string> = {
  owner: 'Control total sobre la cuenta, incluido nombrar y quitar otros dueños.',
  admin: 'Administras los eventos e invitas al equipo, pero no puedes nombrar dueños.',
  staff: 'Trabajas en los eventos. La gestión de personas queda en manos de los administradores.',
};
