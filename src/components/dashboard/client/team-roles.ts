import type { UserRole } from '@/domain/auth/actor';

/**
 * Cómo se nombran los roles en la interfaz.
 *
 * En un módulo propio porque lo comparten la tabla de equipo y el modal de invitación, y
 * porque un archivo que exporta componentes **y** constantes pierde el fast refresh de React.
 *
 * El texto de ayuda importa más de lo que parece: es lo que se lee al elegir un rol, y la
 * diferencia entre «Administrador» y «Colaborador» no se deduce del nombre. Escribirlo aquí
 * hace que el desplegable de invitación y el de la tabla digan exactamente lo mismo.
 */
export const ROLE_LABEL: Record<UserRole, string> = {
  owner: 'Dueño',
  admin: 'Administrador',
  staff: 'Colaborador',
};

export const ROLE_HELP: Record<UserRole, string> = {
  owner: 'Control total: gestiona el equipo y puede nombrar otro dueño.',
  /*
   * `admin` ya no se puede asignar —el formulario solo ofrece «Colaborador» y la tabla solo
   * ofrece los otros dos— pero el texto se queda: sigue habiendo cuentas con este rol de antes
   * del cambio, y su fila necesita algo que decir.
   */
  admin: 'Rol antiguo. Trabaja en los eventos, sin gestionar personas.',
  staff: 'Ve el resumen y todos los eventos, y puede dar acceso a un evento suyo. No gestiona el equipo.',
};
