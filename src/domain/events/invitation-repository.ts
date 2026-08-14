import type { InvitationAccessRequest, InvitationAccessResult } from './invitation';

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
}
