'use client';

import { useActionState } from 'react';
import { Alert, Button } from 'antd';
import { Send } from 'lucide-react';
import type { IncompleteBlock } from '@/domain/events/content-completeness';
import type { SubmitState } from '@/app/panel/(event)/eventos/[id]/contenido/form-state';

/**
 * El botón con el que el cliente da por terminada su información, y lo que le falta para poder
 * pulsarlo.
 *
 * Es el final del trabajo del cliente y el principio del de la plataforma, así que la pantalla
 * tiene que dejar claras dos cosas antes de nada: **qué falta** y **qué va a pasar** al pulsar.
 *
 * ## La lista de pendientes va arriba y siempre
 *
 * No detrás de un intento fallido. Quien está llenando un formulario largo quiere saber cuánto le
 * queda mientras lo llena, no descubrirlo al final; y quien vuelve tres días después necesita
 * retomar por donde iba. Con todo completo, el panel se convierte en el botón.
 *
 * ## Guardar y mandar son cosas distintas
 *
 * Guardar es del formulario de abajo y se puede hacer mil veces. Mandar es una sola vez y cambia
 * de manos el evento. Por eso este botón vive en su propio formulario y no al lado de «Guardar
 * contenido»: dos botones juntos, uno inocuo y otro no, es como se manda a revisión algo a medias.
 */
export function ContentSubmitPanel({
  eventId,
  status,
  missing,
  action,
  initialState,
}: {
  readonly eventId: string;
  readonly status: string;
  readonly missing: readonly IncompleteBlock[];
  readonly action: (state: SubmitState, formData: FormData) => Promise<SubmitState>;
  readonly initialState: SubmitState;
}) {
  const [state, submit, sending] = useActionState(action, initialState);

  /* Ya mandado o ya publicado: no hay nada que pulsar, y decir en qué punto está es más útil que
     un botón apagado sin explicación. */
  if (status !== 'draft') {
    return (
      <Alert
        className="content-editor__alert"
        type={status === 'published' ? 'success' : 'info'}
        showIcon
        title={
          status === 'published'
            ? 'Tu invitación está publicada'
            : 'Tu información está en revisión'
        }
        description={
          status === 'published'
            ? 'Ya responde en su dirección. Si necesitas cambiar algo, escríbenos y lo actualizamos.'
            : 'La estamos revisando. Te avisamos en cuanto se publique; si mientras tanto cambias algo aquí, avísanos para que lo veamos.'
        }
      />
    );
  }

  const ready = missing.length === 0;

  return (
    <section className="dash-card dash-publish">
      <div className="dash-publish__head">
        <div className="min-w-0">
          <p className="dash-publish__label">
            {ready ? 'Todo listo' : `Faltan ${missing.length === 1 ? 'datos en 1 sección' : `datos en ${missing.length} secciones`}`}
          </p>
          <p className="dash-form__help" style={{ margin: 0 }}>
            {ready
              ? 'Cuando lo mandes, lo revisamos y publicamos tu invitación.'
              : 'Puedes guardar e ir completando poco a poco. Cuando no falte nada, podrás mandarlo.'}
          </p>
        </div>

        <form action={submit}>
          <input type="hidden" name="eventId" value={eventId} />
          <Button
            htmlType="submit"
            type="primary"
            disabled={!ready}
            loading={sending}
            icon={<Send size={15} strokeWidth={1.9} aria-hidden="true" />}
          >
            Mandar a revisión
          </Button>
        </form>
      </div>

      {!ready && (
        <ul className="dash-publish__missing">
          {missing.map((block) => (
            <li key={block.blockKey}>
              <strong>{block.label}:</strong> {block.missing.join(', ')}
            </li>
          ))}
        </ul>
      )}

      {state.status !== 'idle' && state.message && (
        <Alert
          className="dash-publish__alert"
          type={state.status === 'success' ? 'success' : 'warning'}
          showIcon
          title={state.message}
        />
      )}
    </section>
  );
}
