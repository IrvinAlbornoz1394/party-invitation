'use client';

import { useActionState, useState } from 'react';
import { Alert, Button, Input } from 'antd';
import { CheckCircle2, MessageSquareText } from 'lucide-react';
import type { SubmitState } from '@/app/panel/(event)/eventos/[id]/contenido/form-state';
import { PageHeader } from '../primitives/PageHeader';
import { SectionCard } from '../primitives/SectionCard';

/**
 * Lo que ve el cliente después de enviar su información: que ya la tenemos, y cómo pedir un
 * cambio. El formulario no se enseña, ni siquiera en solo lectura: con los campos a la vista lo
 * natural es intentar editarlos, y el guardado los rechazaría (`EditEventContent.save`).
 */
export function ContentLockedScreen({
  eventId,
  status,
  changeRequestedAt,
  action,
}: {
  readonly eventId: string;
  readonly status: string;
  /** Si ya pidió cambios y todavía no se le devolvió la edición. */
  readonly changeRequestedAt: Date | null;
  readonly action: (state: SubmitState, formData: FormData) => Promise<SubmitState>;
}) {
  const [state, submit, sending] = useActionState(action, { status: 'idle', message: '' } as SubmitState);
  const [asking, setAsking] = useState(false);
  const requested = changeRequestedAt !== null || state.status === 'success';

  return (
    <>
      <PageHeader
        title="Tu invitación"
        description={
          status === 'published'
            ? 'Tu invitación ya está publicada.'
            : 'Ya recibimos tu información y estamos armando tu invitación.'
        }
      />

      <SectionCard title="Tu información ya está completa">
        <div className="client-locked">
          <CheckCircle2 className="client-locked__icon" size={28} strokeWidth={1.6} aria-hidden="true" />
          <div>
            <p style={{ marginTop: 0 }}>
              Gracias, ya tenemos lo que necesitamos. Por eso esta pantalla ya no se puede editar.
            </p>
            <p style={{ marginBottom: 0 }}>
              Si quieres cambiar algo, solicítalo al administrador y te habilitamos la edición de nuevo.
            </p>
          </div>
        </div>

        {requested ? (
          <Alert
            className="content-editor__alert"
            type="info"
            showIcon
            title="Ya pediste cambios"
            description={
              state.status === 'success'
                ? state.message
                : 'Le avisamos al equipo. En cuanto te habiliten la edición, podrás volver a entrar aquí.'
            }
          />
        ) : asking ? (
          <form action={submit} className="client-locked__form">
            <input type="hidden" name="eventId" value={eventId} />
            <label htmlFor="change-note" className="dash-form__label">
              ¿Qué quieres cambiar? (opcional)
            </label>
            <Input.TextArea
              id="change-note"
              name="note"
              rows={3}
              maxLength={1000}
              placeholder="Por ejemplo: cambiar la foto de portada y la hora de la recepción."
            />
            <div className="client-saved__actions">
              <Button onClick={() => setAsking(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={sending}>
                Enviar solicitud
              </Button>
            </div>
            {state.status === 'error' && (
              <Alert className="content-editor__alert" type="warning" showIcon title={state.message} />
            )}
          </form>
        ) : (
          <Button
            size="large"
            icon={<MessageSquareText size={16} aria-hidden="true" />}
            onClick={() => setAsking(true)}
          >
            Solicitar cambios
          </Button>
        )}
      </SectionCard>
    </>
  );
}
