/**
 * La invitación tal como la entiende el dominio.
 *
 * Es deliberadamente más pobre que la fila de `events`: aquí solo está lo que hace
 * falta para decidir el acceso y para construir la identidad pública de la invitación
 * (título, metadata de Open Graph). El contenido que renderiza cada bloque se carga
 * aparte, cuando se conecte la UI.
 */
export interface Invitation {
  readonly id: string;
  readonly clientId: string;
  readonly slug: string;
  readonly title: string;
  readonly celebrantName: string;
  readonly celebrantFullName: string | null;
  readonly celebrantLastName: string | null;
  readonly eventTypeLabel: string | null;
  readonly tagline: string | null;
  readonly startsAt: Date;
  readonly timeZone: string;
  readonly city: string | null;
  readonly storyImageUrl: string | null;
}

/**
 * Resultado de intentar abrir una invitación.
 *
 * `denied` cubre a la vez "el evento no existe", "está en borrador", "ya venció" y
 * "el código es incorrecto". La fusión es intencional: distinguirlos convertiría la
 * ruta en un oráculo con el que enumerar qué eventos existen antes de atacar su
 * código. Quien no tiene el enlace correcto no debe poder deducir nada.
 */
export type InvitationAccessResult =
  | { readonly outcome: 'granted'; readonly invitation: Invitation }
  | { readonly outcome: 'denied' }
  | { readonly outcome: 'rate-limited' };

export interface InvitationAccessRequest {
  readonly slug: string;
  readonly code: string;
  /** IP del cliente, para el límite de intentos. Null si no se pudo determinar. */
  readonly clientIp: string | null;
}
