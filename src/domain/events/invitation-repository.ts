import type { TenantScope } from '../auth/actor';
import type { PlatformCredentials } from '../auth/platform-credentials';
import type {
  Invitation,
  InvitationAccessRequest,
  InvitationAccessResult,
  InvitationContent,
} from './invitation';

/**
 * Puerto de salida hacia la persistencia.
 *
 * El dominio declara qué necesita; la infraestructura decide cómo. Esta interfaz no
 * menciona Postgres, Drizzle ni SQL a propósito: es lo que permite probar los casos de
 * uso con una implementación en memoria y lo que dejaría cambiar de motor sin tocar
 * las reglas de negocio (principio de inversión de dependencias).
 */
export interface InvitationRepository {
  /**
   * Resuelve el acceso a una invitación validando slug y código a la vez.
   *
   * La comprobación del código va aquí y no en el caso de uso porque tiene que ser
   * atómica con el registro del intento y con el límite por IP. Separarlas abriría una
   * carrera en la que un atacante paralelo se salta el límite.
   */
  findForAccess(request: InvitationAccessRequest): Promise<InvitationAccessResult>;

  /**
   * La invitación de un evento que ya se sabe alcanzado, para la vista previa del panel.
   *
   * Sin código, sin límite por IP y sin exigir que esté publicada: la autorización la trae el
   * alcance, que sale de una membresía. Devuelve `null` si el evento no está dentro de ese
   * alcance — que con RLS puesto es lo mismo que decir que no existe para quien pregunta.
   */
  findForPreview(
    scope: TenantScope,
    eventId: string,
  ): Promise<{ readonly invitation: Invitation; readonly content: InvitationContent } | null>;

  /**
   * La misma vista previa, pedida por la plataforma.
   *
   * Existe porque `findForPreview` fija el contexto del cliente **sin preguntar**: es correcto
   * cuando quien pide es un miembro de ese cliente —su sesión ya lo demostró— y sería un agujero
   * si un caso de uso de plataforma lo llamara con un `clientId` cualquiera. Esta pasa antes por
   * `app.authorize_client_context()`, que es lo que separa «abrir el contexto de un cliente» de
   * «decir que eres de ese cliente».
   */
  findForPreviewAsPlatform(
    credentials: PlatformCredentials,
    clientId: string,
    eventId: string,
  ): Promise<{ readonly invitation: Invitation; readonly content: InvitationContent } | null>;
}
