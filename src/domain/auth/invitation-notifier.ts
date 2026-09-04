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

/**
 * Aviso a quien acaba de recibir acceso a UN evento.
 *
 * Es el hermano de `TeamInvitation` y se separa porque las dos cosas que definen un correo son
 * distintas: a quién nombra y a dónde lleva. Aquel dice «tienes acceso al panel de X» y lleva a
 * la pantalla de acceso; este nombra el EVENTO y lleva directo a él.
 *
 * `label` sustituye a `recipientName` y es nullable, que es la consecuencia entera del modelo:
 * el acceso se concede con el correo y nada más, así que puede no haber a quién saludar. Quien
 * componga el mensaje tiene que aguantar que no lo haya.
 */
export interface EventAccessInvitation {
  readonly email: string;
  /** «Los novios», «Mamá de la quinceañera». Null si quien lo dio de alta no escribió ninguna. */
  readonly label: string | null;
  readonly eventTitle: string;
  readonly clientName: string;
  readonly inviterName: string;
  /**
   * A dónde lleva el botón: el panel de ese evento.
   *
   * Viaja ya compuesta, y por el mismo motivo por el que la URL de acceso no está en
   * `TeamInvitation`: depende del despliegue y eso es infraestructura. Sigue sin llevar ningún
   * token — quien la abra sin sesión acaba en `/acceso` con el destino recordado, y quien no
   * alcance ese evento acaba en un 404.
   */
  readonly eventUrl: string;
}

export interface InvitationNotifier {
  send(invitation: TeamInvitation): Promise<InvitationDeliveryResult>;
  sendEventAccess(invitation: EventAccessInvitation): Promise<InvitationDeliveryResult>;
}
