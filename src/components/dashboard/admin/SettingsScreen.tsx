'use client';

import { Alert } from 'antd';
import { KeyRound, Mail, ShieldCheck, User } from 'lucide-react';
import type { PlatformActor } from '@/domain/auth/actor';
import { CodeCell } from '../primitives/Cell';
import { FactList } from '../primitives/FactList';
import { PageHeader } from '../primitives/PageHeader';
import { SectionCard } from '../primitives/SectionCard';

/**
 * Los ajustes de la cuenta de plataforma.
 *
 * Es deliberadamente una pantalla de **lectura**, y conviene explicar por qué en vez de
 * dejar que parezca inacabada:
 *
 * - **No se edita el correo.** Es la identidad con la que se pide el código de acceso, y es
 *   única en toda la plataforma. Cambiarlo desde aquí sería cambiarse la credencial en
 *   caliente, con el riesgo de quedarse fuera sin forma de volver.
 * - **No hay contraseña que cambiar.** El acceso es por código de un solo uso; no existe
 *   ningún secreto reutilizable que rotar.
 * - **No se edita el rol.** `platform_role` está revocada para el rol de la aplicación en
 *   Postgres precisamente para que ninguna pantalla pueda concederlo — es la defensa que
 *   impide que administrar cuentas se convierta en una escalada de privilegios. Se gestiona
 *   con `npm run db:platform-admin`.
 *
 * Lo que sí hace es responder «¿con qué cuenta estoy entrando y qué puede hacer?», que es la
 * pregunta real cuando hay dos paneles y varias cuentas.
 */
export function SettingsScreen({ actor }: { readonly actor: PlatformActor }) {
  return (
    <>
      <PageHeader
        title="Ajustes"
        description="Tu cuenta de plataforma y cómo se protege el acceso al panel."
      />

      <div className="dash-split">
        <div className="dash-stack">
          <SectionCard title="Tu cuenta">
            <FactList
              facts={[
                { label: 'Nombre', value: actor.name },
                { label: 'Correo', value: actor.email },
                {
                  label: 'Rol',
                  value:
                    actor.platformRole === 'superadmin' ? 'Superadministrador' : 'Soporte',
                },
                { label: 'Identificador', value: <CodeCell>{actor.userId}</CodeCell> },
              ]}
            />

            <Alert
              className="dash-page-alert"
              style={{ marginTop: 'var(--dash-gap)', marginBottom: 0 }}
              type="info"
              showIcon
              message="Estos datos no se editan desde el panel"
              description="El correo es la credencial con la que pides tu código, y el rol de plataforma está revocado para la aplicación a propósito. Ambos se gestionan con el comando db:platform-admin."
            />
          </SectionCard>

          <SectionCard title="Alcance de tu acceso">
            <ul className="dash-bullets">
              <li>
                <span className="dash-bullets__icon dash-tone-plum" aria-hidden="true">
                  <ShieldCheck size={15} strokeWidth={2} />
                </span>
                <span>
                  Ves <strong>todos los clientes</strong> y todos sus eventos. Una cuenta de
                  cliente solo ve los suyos.
                </span>
              </li>
              <li>
                <span className="dash-bullets__icon dash-tone-azure" aria-hidden="true">
                  <KeyRound size={15} strokeWidth={2} />
                </span>
                <span>
                  Para leer los datos de un cliente, la base de datos <strong>autoriza cada
                  operación</strong> por separado y el permiso dura solo esa consulta. No
                  existe «entrar como» un cliente.
                </span>
              </li>
              <li>
                <span className="dash-bullets__icon dash-tone-sage" aria-hidden="true">
                  <User size={15} strokeWidth={2} />
                </span>
                <span>
                  El catálogo —planes, plantillas, temas y componentes— es de{' '}
                  <strong>solo lectura</strong> desde el panel. Ampliarlo se hace con el rol
                  dueño de la base de datos.
                </span>
              </li>
            </ul>
          </SectionCard>
        </div>

        <SectionCard title="Cómo entras">
          <ul className="dash-bullets">
            <li>
              <span className="dash-bullets__icon dash-tone-gold" aria-hidden="true">
                <Mail size={15} strokeWidth={2} />
              </span>
              <span>
                Pides un código de 6 dígitos a tu correo. <strong>No hay contraseña</strong>,
                así que no hay nada que se pueda reutilizar si se filtra.
              </span>
            </li>
            <li>
              <span className="dash-bullets__icon dash-tone-rose" aria-hidden="true">
                <KeyRound size={15} strokeWidth={2} />
              </span>
              <span>
                El código vence en 10 minutos, vale una sola vez y tiene los intentos
                contados.
              </span>
            </li>
            <li>
              <span className="dash-bullets__icon dash-tone-slate" aria-hidden="true">
                <ShieldCheck size={15} strokeWidth={2} />
              </span>
              <span>
                Al salir, la sesión se revoca en el servidor — no basta con borrar la cookie
                del navegador.
              </span>
            </li>
          </ul>
        </SectionCard>
      </div>
    </>
  );
}
