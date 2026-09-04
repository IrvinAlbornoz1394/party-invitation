/**
 * Las zonas horarias que se ofrecen al dar de alta un evento.
 *
 * Es una lista corta y escrita a mano, no las seiscientas de la IANA: quien da de alta un evento
 * busca «Cancún», no `America/Cancun` entre cientos de opciones. Cubre las horas locales que hay
 * en México y las nombra por la ciudad con la que se dictan; el día que haga falta otra, se añade
 * una línea.
 *
 * El valor es el identificador IANA porque es lo que entiende `AT TIME ZONE` en Postgres, y la
 * etiqueta es solo para el desplegable. Nunca al revés.
 *
 * ## Por qué está en su propio archivo
 *
 * Para que el formulario pueda importarla sin arrastrar `zod` al navegador. `new-event.ts` es un
 * esquema de validación —servidor— y esto es una lista de opciones que la pantalla necesita
 * pintar; juntas, el bundle del cliente cargaría el validador entero para llenar un `<Select>`.
 */
export const EVENT_TIME_ZONES = [
  { value: 'America/Merida', label: 'Mérida · Yucatán, Campeche, Tabasco' },
  { value: 'America/Cancun', label: 'Cancún · Quintana Roo' },
  { value: 'America/Mexico_City', label: 'Ciudad de México · centro del país' },
  { value: 'America/Monterrey', label: 'Monterrey · Nuevo León, Coahuila' },
  { value: 'America/Chihuahua', label: 'Chihuahua' },
  { value: 'America/Mazatlan', label: 'Mazatlán · Sinaloa, Nayarit, BCS' },
  { value: 'America/Hermosillo', label: 'Hermosillo · Sonora' },
  { value: 'America/Tijuana', label: 'Tijuana · Baja California' },
] as const;

/**
 * La misma que trae por defecto la columna `events.time_zone`.
 *
 * Está repetida a propósito y conviene saberlo: el `default` de la base de datos cubre las filas
 * que se escriben sin la columna —un script, una migración— y esta cubre el formulario. Si alguna
 * vez se mueve la sede del negocio, hay que cambiar las dos.
 */
export const DEFAULT_EVENT_TIME_ZONE = 'America/Merida';

export function isSupportedTimeZone(value: string): boolean {
  return EVENT_TIME_ZONES.some((zone) => zone.value === value);
}
