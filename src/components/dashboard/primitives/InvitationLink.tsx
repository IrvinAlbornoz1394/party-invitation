'use client';

import { CopyButton } from './CopyButton';
import { OpenButton } from './OpenButton';

/**
 * La URL de una invitación, lista para copiar y repartir.
 *
 * Es la función más básica del panel y faltaba: las pantallas enseñaban `/kamilah` —solo el
 * slug— y esa dirección no lleva a ninguna parte. La invitación vive en `/<slug>/<código>`, y
 * el código es la credencial que la protege. Sin él no hay enlace que mandar por WhatsApp.
 *
 * ## Por qué se enseña el código entero
 *
 * `events.access_code` se guarda **sin hashear** precisamente para esto: el organizador tiene
 * que poder recuperar su enlace. Ocultarlo tras un botón de «revelar» daría sensación de
 * secreto sin añadir seguridad — quien ve esta pantalla ya pasó por la sesión, y la
 * protección real de la invitación son el espacio de 32^6 y el límite de intentos por IP que
 * aplica `app.resolve_invitation_access()`.
 */
export function InvitationLink({
  url,
  label = 'Enlace de la invitación',
}: {
  readonly url: string;
  readonly label?: string;
}) {
  return (
    <div className="dash-invite">
      <span className="dash-invite__label">{label}</span>

      <div className="dash-invite__row">
        {/*
          Un `<input readOnly>` y no texto suelto: permite seleccionarlo entero con un toque
          en el móvil, que es el respaldo cuando el portapapeles no está disponible. El
          desplazamiento de una URL larga queda dentro del campo en lugar de ensanchar la
          tarjeta, y `dir="ltr"` evita que se reordene visualmente.
        */}
        <input
          className="dash-invite__url"
          value={url}
          readOnly
          dir="ltr"
          aria-label={label}
          onFocus={(event) => event.currentTarget.select()}
        />

        <div className="dash-invite__actions">
          <CopyButton value={url} describedAs="Copiar el enlace de la invitación" />
          <OpenButton url={url} describedAs="Abrir la invitación en una pestaña nueva" />
        </div>
      </div>
    </div>
  );
}
