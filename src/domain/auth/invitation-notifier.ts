/**
 * Aviso a quien acaba de ser dado de alta en el panel.
 *
 * No lleva ninguna credencial, y esa es la característica que define este mensaje: dice
 * "tienes acceso, entra por aquí", y quien lo recibe pide su código en la pantalla normal.
 *
 * Es lo que evita tener dos sistemas de credenciales. Un enlace de invitación con token
 * sería una segunda credencial con su propia caducidad, su propio reenvío, su propia
 * revocación y su propio riesgo de reenvío accidental a un grupo. Con OTP no aporta nada: el
 * correo ya prueba que la dirección es de quien la usa.
 *
 * Consecuencia práctica: este mensaje se puede reenviar sin peligro, y si nunca llega, la
 * persona entra igual sabiendo que tiene cuenta.
 */
export interface TeamInvitation {
  readonly email: string;
  readonly recipientName: string;
  /** Quién la dio de alta. Da contexto y evita que el correo parezca no solicitado. */
  readonly inviterName: string;
  readonly clientName: string;
}

/*
 * La URL de la pantalla de acceso NO está aquí. Depende del despliegue —dominio, puerto,
 * protocolo— y eso es infraestructura: si viajara en este tipo, cada caso de uso tendría que
 * conocer la URL pública para poder mandar una invitación.
 */

export type InvitationDeliveryResult =
  | { readonly outcome: 'sent' }
  /** No hay proveedor configurado. En desarrollo es lo normal. */
  | { readonly outcome: 'not-configured' }
  | { readonly outcome: 'failed'; readonly reason: string };

export interface InvitationNotifier {
  send(invitation: TeamInvitation): Promise<InvitationDeliveryResult>;
}
