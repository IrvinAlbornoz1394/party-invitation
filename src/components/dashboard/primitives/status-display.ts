/**
 * Cómo se presenta cada estado del dominio, traducido en un solo sitio.
 *
 * Vive fuera del componente que lo pinta por la misma razón mecánica que `format.ts`: un
 * módulo que exporta componentes **y** funciones sueltas pierde el fast refresh de React.
 *
 * Y está centralizado porque las mismas etiquetas salen en `/admin/eventos` y en `/panel`.
 * Dos copias divergirían en la primera prisa —una diría «Borrador» y la otra «draft»— y
 * quien diera soporte tendría que traducir mentalmente entre lo que ve el cliente y lo que
 * ve la plataforma.
 */

/**
 * El tono es semántico, no un color: quien escribe una pantalla dice «esto es positivo», no
 * «esto es verde». Cambiar qué verde usa el panel es entonces una línea de CSS, en lugar de
 * un recorrido por las pantallas buscando quién puso ese valor a mano.
 */
export type StatusTone = 'positive' | 'pending' | 'neutral' | 'danger';

export interface StatusAppearance {
  readonly label: string;
  readonly tone: StatusTone;
}

const EVENT_STATUS: Record<string, StatusAppearance> = {
  draft: { label: 'Borrador', tone: 'pending' },
  published: { label: 'Publicado', tone: 'positive' },
  archived: { label: 'Archivado', tone: 'neutral' },
};

const CLIENT_STATUS: Record<string, StatusAppearance> = {
  active: { label: 'Activo', tone: 'positive' },
  suspended: { label: 'Suspendido', tone: 'danger' },
  closed: { label: 'Cerrado', tone: 'neutral' },
};

const USER_STATUS: Record<string, StatusAppearance> = {
  active: { label: 'Activa', tone: 'positive' },
  // «Sin entrar» es más útil que «invitada»: lo que le importa a quien mira la lista es si
  // esa persona ya usó su acceso, no en qué estado interno está la fila.
  invited: { label: 'Sin entrar', tone: 'pending' },
  disabled: { label: 'Desactivada', tone: 'neutral' },
};

/**
 * El acceso va por función y no por índice directo para que un valor inesperado —una
 * migración que añade un estado y una pantalla que todavía no lo conoce— se muestre tal cual
 * en gris, en vez de dejar la celda vacía y parecer un fallo de carga.
 */
function lookup(map: Record<string, StatusAppearance>, value: string): StatusAppearance {
  return map[value] ?? { label: value, tone: 'neutral' };
}

export const eventStatus = (value: string): StatusAppearance => lookup(EVENT_STATUS, value);
export const clientStatus = (value: string): StatusAppearance => lookup(CLIENT_STATUS, value);
export const userStatus = (value: string): StatusAppearance => lookup(USER_STATUS, value);

/** Activo / inactivo, para las filas de catálogo. */
export const activeStatus = (isActive: boolean): StatusAppearance =>
  isActive ? { label: 'Activo', tone: 'positive' } : { label: 'Inactivo', tone: 'neutral' };
