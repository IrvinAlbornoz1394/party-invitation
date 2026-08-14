/**
 * La cuenta que administra la plataforma.
 *
 * Está en un módulo propio porque la comparten `db:seed` y `db:platform-admin`, y el valor
 * que de verdad importa es el **correo**: es la identidad con la que se inicia sesión y la
 * clave con la que los dos scripts hacen upsert. Dos valores distintos crearían dos cuentas
 * y solo una tendría el rol.
 *
 * Ya no hay ningún "cliente de la plataforma". Antes hacía falta uno porque toda cuenta
 * tenía que pertenecer a un tenant, así que se inventaba una organización para el
 * superadministrador — y mantenerla sincronizada entre los dos scripts era una fuente de
 * duplicados. Hoy `users.client_id` es NULL para estas cuentas, que es lo que significan de
 * verdad: no son clientes de sí mismas.
 */
export const PLATFORM_ADMIN = {
  email: 'gago1394@gmail.com',
  name: 'Irvin',
} as const;
