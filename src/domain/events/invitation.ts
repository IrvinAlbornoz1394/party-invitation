import type {
  EventBlockRecord,
  EventContentSource,
} from '@/domain/invitation/event-content';

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
 * Todo lo que hace falta para pintar la invitación, tal como está guardado.
 *
 * Va aparte de {@link Invitation} porque son dos preguntas distintas: aquella responde «¿quién
 * es y se puede abrir?» —y es la única que necesita la metadata de la página—, y esto responde
 * «¿qué se ve?». Cargarlo todo junto obligaría a leer los bloques y las fotos también cuando lo
 * único que se está resolviendo es el `<title>`.
 *
 * `themeTokens` viaja **crudo**, sin interpretar. Interpretarlo aquí metería el esquema de
 * apariencia en la capa de datos; quien pinta llama a `parseInvitationTheme`, que además repara
 * el contraste y nunca lanza.
 */
export interface InvitationContent {
  readonly themeTokens: unknown;
  /** El evento como fuente única del contenido. Ver `domain/invitation/event-content.ts`. */
  readonly source: EventContentSource;
  /** Los bloques configurados: qué variante, en qué orden y qué guarda cada uno. */
  readonly blocks: readonly EventBlockRecord[];
  readonly musicUrl: string | null;
  readonly musicTitle: string | null;
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
  | {
      readonly outcome: 'granted';
      readonly invitation: Invitation;
      readonly content: InvitationContent;
    }
  /**
   * El código es correcto pero la invitación todavía no se puede ver.
   *
   * Es un resultado propio y no un `denied` con matices, porque lo que hay que hacer con él es
   * otra cosa: a quien se equivoca de código no se le cuenta nada —ver `denied`—, y a quien tiene
   * el código bueno se le explica, porque es alguien a quien de verdad invitaron.
   *
   * `unpublished` es la invitación que aún se está preparando; `expired`, la que ya cumplió su
   * vigencia. Se distinguen porque lo que se le dice al invitado no es lo mismo: en un caso
   * vuelva más tarde, en el otro ya no hay nada que ver.
   */
  | { readonly outcome: 'unavailable'; readonly reason: 'unpublished' | 'expired' }
  | { readonly outcome: 'denied' }
  | { readonly outcome: 'rate-limited' };

export interface InvitationAccessRequest {
  readonly slug: string;
  readonly code: string;
  /** IP del cliente, para el límite de intentos. Null si no se pudo determinar. */
  readonly clientIp: string | null;
}
